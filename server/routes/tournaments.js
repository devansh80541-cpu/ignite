import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// LIST ALL TOURNAMENTS (Public / Player)
router.get('/', (req, res) => {
  try {
    const { mode, status, search } = req.query;
    let query = 'SELECT * FROM tournaments WHERE 1=1';
    const params = [];

    if (mode && mode !== 'all') {
      query += ' AND mode = ?';
      params.push(mode);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    } else {
      query += " AND status != 'draft'"; // Hide drafts from public
    }

    if (search) {
      query += ' AND (name LIKE ? OR map LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY CASE status WHEN 'live' THEN 1 WHEN 'open' THEN 2 WHEN 'full' THEN 3 ELSE 4 END, date ASC, start_time ASC";

    const tournaments = db.prepare(query).all(...params);

    // Filter sensitive room details from list
    const safeTournaments = tournaments.map(t => {
      return {
        ...t,
        room_id: t.is_room_released ? t.room_id : null,
        room_password: t.is_room_released ? t.room_password : null,
        scoring_rules: t.scoring_rules ? JSON.parse(t.scoring_rules) : {}
      };
    });

    res.json({ tournaments: safeTournaments });
  } catch (error) {
    console.error('Fetch tournaments error:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// GET SINGLE TOURNAMENT DETAILS + SLOTS + REGISTRATION STATUS
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers['authorization'];
    let currentUserId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) currentUserId = decoded.id;
      } catch (e) {
        // Continue unauthenticated
      }
    }

    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get all registered slots
    const registrations = db.prepare(`
      SELECT tr.*, u.username, u.name, u.avatar
      FROM tournament_registrations tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE tr.tournament_id = ? AND tr.status = 'registered'
      ORDER BY tr.slot_number ASC
    `).all(id);

    // Check if current user is registered
    let userRegistration = null;
    if (currentUserId) {
      userRegistration = registrations.find(r => r.user_id === currentUserId) || null;
    }

    // Prepare 50 slot array for Battle Royale or max_slots array
    const maxSlots = tournament.max_slots || 50;
    const slots = [];
    const regMap = new Map(registrations.map(r => [r.slot_number, r]));

    for (let i = 1; i <= maxSlots; i++) {
      const reg = regMap.get(i);
      if (reg) {
        slots.push({
          slotNumber: i,
          status: 'occupied',
          userId: reg.user_id,
          playerName: reg.player_ign || reg.username || `Player ${i}`,
          playerUid: reg.player_ff_uid || 'Hidden',
          teamName: reg.team_name || null,
          avatar: reg.avatar || null,
          isMe: currentUserId && reg.user_id === currentUserId
        });
      } else {
        slots.push({
          slotNumber: i,
          status: tournament.status === 'full' || tournament.status === 'completed' || tournament.status === 'cancelled' ? 'locked' : 'available',
          userId: null,
          playerName: null,
          playerUid: null,
          teamName: null,
          avatar: null,
          isMe: false
        });
      }
    }

    // Teams for clash squad
    const teams = db.prepare(`
      SELECT t.*, u.username as captain_username, u.in_game_name as captain_ign
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      WHERE t.tournament_id = ?
    `).all(id).map(team => ({
      ...team,
      members: team.members_json ? JSON.parse(team.members_json) : []
    }));

    // Match Results if completed
    const results = db.prepare(`
      SELECT * FROM match_results WHERE tournament_id = ? ORDER BY position ASC, total_points DESC
    `).all(id);

    // Obscure room credentials unless released AND user is registered (or admin)
    const canSeeRoom = tournament.is_room_released && userRegistration;

    res.json({
      tournament: {
        ...tournament,
        room_id: canSeeRoom ? tournament.room_id : null,
        room_password: canSeeRoom ? tournament.room_password : null,
        scoring_rules: tournament.scoring_rules ? JSON.parse(tournament.scoring_rules) : {},
        isUserRegistered: !!userRegistration,
        userSlot: userRegistration ? userRegistration.slot_number : null
      },
      slots,
      teams,
      results,
      registeredCount: registrations.length,
      totalSlots: maxSlots
    });
  } catch (error) {
    console.error('Tournament details error:', error);
    res.status(500).json({ error: 'Failed to retrieve tournament details' });
  }
});

// JOIN TOURNAMENT / RESERVE A SLOT (ATOMIC SERVER-SIDE MONEY TRANSACTION)
router.post('/:id/join', authenticateToken, (req, res) => {
  const tournamentId = req.params.id;
  const userId = req.user.id;
  const { slotNumber, inGameName, freeFireUid, teamName, teamMembers } = req.body;

  try {
    // ATOMIC DATABASE TRANSACTION
    const joinTx = db.transaction(() => {
      // 1. Fetch fresh user and tournament records inside transaction
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId);

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'open') {
        throw new Error(`Registration is closed for this tournament (Status: ${tournament.status.toUpperCase()})`);
      }

      // Check if user is already registered in this tournament
      const existingReg = db.prepare('SELECT * FROM tournament_registrations WHERE tournament_id = ? AND user_id = ?').get(tournamentId, userId);
      if (existingReg) {
        throw new Error('You are already registered for this tournament.');
      }

      const entryFee = Number(tournament.entry_fee) || 0;

      // Check Wallet Balance
      if (user.wallet_balance < entryFee) {
        throw new Error(`Insufficient wallet balance. Entry fee is ₹${entryFee.toFixed(2)}, your balance is ₹${user.wallet_balance.toFixed(2)}. Please add money to your wallet.`);
      }

      // Determine slot
      let targetSlot = slotNumber ? parseInt(slotNumber, 10) : null;
      const occupiedSlots = db.prepare("SELECT slot_number FROM tournament_registrations WHERE tournament_id = ? AND status = 'registered'").all(tournamentId).map(s => s.slot_number);

      if (targetSlot) {
        if (targetSlot < 1 || targetSlot > tournament.max_slots) {
          throw new Error(`Invalid slot number. Must be between 1 and ${tournament.max_slots}.`);
        }
        if (occupiedSlots.includes(targetSlot)) {
          throw new Error(`Slot ${targetSlot} is already taken. Please choose another slot.`);
        }
      } else {
        // Find lowest available slot
        for (let s = 1; s <= tournament.max_slots; s++) {
          if (!occupiedSlots.includes(s)) {
            targetSlot = s;
            break;
          }
        }
        if (!targetSlot) {
          throw new Error('All tournament slots are currently full.');
        }
      }

      const ign = inGameName || user.in_game_name || user.username;
      const ffUid = freeFireUid || user.free_fire_uid || 'N/A';

      // 2. Deduct Entry Fee & Record Transaction
      const balanceBefore = user.wallet_balance;
      const balanceAfter = balanceBefore - entryFee;
      const transactionId = `tx-entry-${uuidv4().substring(0, 8)}`;

      if (entryFee > 0) {
        db.prepare("UPDATE users SET wallet_balance = ?, total_matches = total_matches + 1, updated_at = datetime('now') WHERE id = ?")
          .run(balanceAfter, userId);

        db.prepare(`
          INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, status, description)
          VALUES (?, ?, 'tournament_entry', ?, ?, ?, ?, 'completed', ?)
        `).run(
          transactionId,
          userId,
          -entryFee,
          balanceBefore,
          balanceAfter,
          tournamentId,
          `Entry Fee for ${tournament.name} (Slot ${targetSlot < 10 ? '0' + targetSlot : targetSlot})`
        );
      } else {
        db.prepare("UPDATE users SET total_matches = total_matches + 1, updated_at = datetime('now') WHERE id = ?")
          .run(userId);
      }

      // Handle Clash Squad Team creation if applicable
      let teamId = null;
      if (tournament.mode === 'clash_squad' && teamName) {
        teamId = uuidv4();
        db.prepare(`
          INSERT INTO teams (id, tournament_id, name, captain_id, team_size, members_json)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(teamId, tournamentId, teamName, userId, tournament.team_size || 4, JSON.stringify(teamMembers || [{ ign, ffUid }]));
      }

      // 3. Create Tournament Registration
      const regId = uuidv4();
      db.prepare(`
        INSERT INTO tournament_registrations (id, tournament_id, user_id, slot_number, team_id, team_name, player_ff_uid, player_ign, entry_fee_paid, payment_transaction_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered')
      `).run(
        regId,
        tournamentId,
        userId,
        targetSlot,
        teamId,
        teamName || null,
        ffUid,
        ign,
        entryFee,
        entryFee > 0 ? transactionId : null
      );

      // 4. Update Tournament filled_slots count and status
      const newFilledCount = occupiedSlots.length + 1;
      const newStatus = newFilledCount >= tournament.max_slots ? 'full' : 'open';

      db.prepare("UPDATE tournaments SET filled_slots = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newFilledCount, newStatus, tournamentId);

      // 5. Send Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
        VALUES (?, ?, ?, ?, 'tournament', 0, ?)
      `).run(
        uuidv4(),
        userId,
        '🎮 Tournament Registration Confirmed',
        `You have joined "${tournament.name}" at Slot ${targetSlot < 10 ? '0' + targetSlot : targetSlot}. Room details will be released before match start.`,
        `/tournaments/${tournamentId}`
      );

      return {
        slotNumber: targetSlot,
        balanceAfter,
        filledSlots: newFilledCount,
        status: newStatus
      };
    });

    const result = joinTx();

    res.json({
      message: `Successfully registered for slot ${result.slotNumber < 10 ? '0' + result.slotNumber : result.slotNumber}!`,
      slotNumber: result.slotNumber,
      walletBalance: result.balanceAfter
    });
  } catch (error) {
    console.error('Tournament join error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to join tournament' });
  }
});

// GET USER'S REGISTERED TOURNAMENTS (Upcoming, Live, Completed)
router.get('/my/list', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const myTournaments = db.prepare(`
      SELECT 
        t.*,
        tr.slot_number,
        tr.team_name,
        tr.created_at as joined_at,
        tr.entry_fee_paid,
        mr.position as final_position,
        mr.kills as my_kills,
        mr.total_points as my_points,
        mr.prize_amount as prize_won
      FROM tournament_registrations tr
      INNER JOIN tournaments t ON tr.tournament_id = t.id
      LEFT JOIN match_results mr ON mr.tournament_id = t.id AND mr.user_id = tr.user_id
      WHERE tr.user_id = ? AND tr.status = 'registered'
      ORDER BY CASE t.status WHEN 'live' THEN 1 WHEN 'open' THEN 2 WHEN 'full' THEN 3 ELSE 4 END, t.date DESC
    `).all(userId);

    const formatted = myTournaments.map(t => ({
      ...t,
      room_id: t.is_room_released ? t.room_id : null,
      room_password: t.is_room_released ? t.room_password : null,
      scoring_rules: t.scoring_rules ? JSON.parse(t.scoring_rules) : {}
    }));

    res.json({ tournaments: formatted });
  } catch (error) {
    console.error('My tournaments error:', error);
    res.status(500).json({ error: 'Failed to retrieve your tournaments' });
  }
});

export default router;

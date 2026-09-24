import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply requireAdmin middleware to all routes in this router
router.use(requireAdmin);

// HELPER: AUDIT LOGGER
function logAdminAction(adminUser, action, entityType, entityId, details, req) {
  try {
    db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, admin_username, action, entity_type, entity_id, details_json, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      adminUser.id,
      adminUser.username,
      action,
      entityType,
      entityId ? String(entityId) : null,
      JSON.stringify(details || {}),
      req ? (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') : '127.0.0.1'
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// 1. ADMIN DASHBOARD STATS & ANALYTICS
router.get('/dashboard-stats', (req, res) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'player'").get().count;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'player' AND is_banned = 0").get().count;

    const totalDeposits = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM deposit_requests WHERE status = 'approved'
    `).get().total;

    const pendingDepositsCount = db.prepare("SELECT COUNT(*) as count FROM deposit_requests WHERE status = 'pending'").get().count;
    const pendingDepositsAmount = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM deposit_requests WHERE status = 'pending'").get().total;

    const totalCashouts = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM cashout_requests WHERE status = 'paid'
    `).get().total;

    const pendingCashoutsCount = db.prepare("SELECT COUNT(*) as count FROM cashout_requests WHERE status = 'pending'").get().count;
    const pendingCashoutsAmount = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cashout_requests WHERE status = 'pending'").get().total;

    const activeTournaments = db.prepare("SELECT COUNT(*) as count FROM tournaments WHERE status IN ('open', 'live')").get().count;
    const completedTournaments = db.prepare("SELECT COUNT(*) as count FROM tournaments WHERE status = 'completed'").get().count;
    const totalPrizeMoney = db.prepare("SELECT COALESCE(SUM(prize_pool), 0) as total FROM tournaments WHERE status = 'completed'").get().total;

    // Platform Net Revenue Estimate: (Total Entry Fees Collected) - (Total Prizes Distributed) + Cashout Fees
    const totalEntryFees = db.prepare(`
      SELECT COALESCE(ABS(SUM(amount)), 0) as total
      FROM transactions WHERE type = 'tournament_entry' AND status = 'completed'
    `).get().total;

    const totalPrizesGiven = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'prize_credit' AND status = 'completed'
    `).get().total;

    const cashoutFeesCollected = db.prepare(`
      SELECT COALESCE(SUM(fee_amount), 0) as total
      FROM cashout_requests WHERE status = 'paid'
    `).get().total;

    const platformRevenue = Math.max(0, (totalEntryFees - totalPrizesGiven) + cashoutFeesCollected);

    // Recent Audit Logs
    const recentAudits = db.prepare('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 10').all();

    // Chart Data: Last 7 Days Financial Flows
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      days.push(d);
    }

    const chartData = {
      labels: days.map(d => d.slice(5)), // MM-DD
      deposits: days.map(day => {
        return db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM deposit_requests
          WHERE status = 'approved' AND date(created_at) = ?
        `).get(day).total;
      }),
      cashouts: days.map(day => {
        return db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM cashout_requests
          WHERE status = 'paid' AND date(created_at) = ?
        `).get(day).total;
      }),
      registrations: days.map(day => {
        return db.prepare(`
          SELECT COUNT(*) as count
          FROM tournament_registrations
          WHERE date(created_at) = ?
        `).get(day).count;
      })
    };

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalDeposits,
        pendingDepositsCount,
        pendingDepositsAmount,
        totalCashouts,
        pendingCashoutsCount,
        pendingCashoutsAmount,
        activeTournaments,
        completedTournaments,
        totalPrizeMoney,
        platformRevenue
      },
      chartData,
      recentAudits
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to compute dashboard metrics' });
  }
});

// 2. USER MANAGEMENT
router.get('/users', (req, res) => {
  try {
    const { search, status, limit = 50, offset = 0 } = req.query;
    let query = "SELECT id, name, username, email, phone, free_fire_uid, in_game_name, avatar, wallet_balance, pending_balance, role, is_banned, total_earnings, total_wins, total_matches, created_at FROM users WHERE role = 'player'";
    const params = [];

    if (status === 'banned') {
      query += ' AND is_banned = 1';
    } else if (status === 'active') {
      query += ' AND is_banned = 0';
    }

    if (search) {
      query += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ? OR free_fire_uid LIKE ? OR in_game_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const users = db.prepare(query).all(...params);
    const total = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'player'").get().count;

    res.json({ users, total });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET DETAILED USER PROFILE WITH ALL ASSOCIATED DATA
router.get('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, name, username, email, phone, free_fire_uid, in_game_name, avatar, wallet_balance, pending_balance, role, is_banned, total_earnings, total_wins, total_matches, total_kills, created_at FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(id);
    const deposits = db.prepare('SELECT * FROM deposit_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(id);
    const cashouts = db.prepare('SELECT * FROM cashout_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(id);
    const tournaments = db.prepare(`
      SELECT tr.*, t.name as tournament_name, t.mode, t.date, t.start_time
      FROM tournament_registrations tr
      JOIN tournaments t ON tr.tournament_id = t.id
      WHERE tr.user_id = ?
      ORDER BY tr.created_at DESC LIMIT 15
    `).all(id);

    res.json({ user, transactions, deposits, cashouts, tournaments });
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// BAN / UNBAN USER
router.put('/users/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    const banState = isBanned ? 1 : 0;

    db.prepare("UPDATE users SET is_banned = ?, updated_at = datetime('now') WHERE id = ?").run(banState, id);

    logAdminAction(req.user, banState ? 'USER_BANNED' : 'USER_UNBANNED', 'USER', id, { isBanned: banState }, req);

    res.json({ message: `User account has been ${banState ? 'suspended' : 'reactivated'}.` });
  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// MANUAL WALLET BALANCE ADJUSTMENT (LEDGER-BACKED ONLY - NEVER SILENT MODIFICATION)
router.post('/users/:id/adjust-balance', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, referenceNote } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return res.status(400).json({ error: 'Please enter a non-zero adjustment amount.' });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'A clear audit reason is required for manual balance adjustments.' });
    }

    const adjustTx = db.transaction(() => {
      const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(id);
      if (!user) throw new Error('User not found');

      const balanceBefore = user.wallet_balance;
      const balanceAfter = balanceBefore + numAmount;

      if (balanceAfter < 0) {
        throw new Error(`Cannot adjust balance below zero. Current: ₹${balanceBefore.toFixed(2)}, Proposed: ₹${balanceAfter.toFixed(2)}`);
      }

      db.prepare("UPDATE users SET wallet_balance = ?, updated_at = datetime('now') WHERE id = ?").run(balanceAfter, id);

      const txId = `tx-adj-${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, status, description, admin_id)
        VALUES (?, ?, 'admin_adjustment', ?, ?, ?, ?, 'completed', ?, ?)
      `).run(
        txId,
        id,
        numAmount,
        balanceBefore,
        balanceAfter,
        referenceNote || `ADMIN-ADJ-${req.user.username}`,
        `Admin Balance Adjustment: ${reason.trim()}`,
        req.user.id
      );

      // Notify User
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
        VALUES (?, ?, ?, ?, 'system', 0, '/wallet')
      `).run(
        uuidv4(),
        id,
        '⚖️ Wallet Balance Adjusted',
        `An administrator adjusted your wallet balance by ${numAmount > 0 ? '+₹' : '-₹'}${Math.abs(numAmount).toFixed(2)}. Reason: ${reason}`
      );

      return { balanceBefore, balanceAfter, txId };
    });

    const result = adjustTx();

    logAdminAction(req.user, 'MANUAL_BALANCE_ADJUSTMENT', 'WALLET', id, {
      amount: numAmount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      reason,
      transactionId: result.txId
    }, req);

    res.json({
      message: 'Wallet balance adjusted and recorded in immutable ledger.',
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter
    });
  } catch (error) {
    console.error('Adjust balance error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to adjust balance' });
  }
});

// 3. DEPOSIT REQUESTS MANAGEMENT
router.get('/deposits', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT dr.*, u.name as user_name, u.username, u.email, u.phone, u.free_fire_uid, u.wallet_balance
      FROM deposit_requests dr
      JOIN users u ON dr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND dr.status = ?';
      params.push(status);
    }

    query += " ORDER BY CASE dr.status WHEN 'pending' THEN 1 ELSE 2 END, dr.created_at DESC";

    const deposits = db.prepare(query).all(...params);
    res.json({ deposits });
  } catch (error) {
    console.error('Admin deposits fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// APPROVE DEPOSIT (CREDIT WALLET & WRITE TRANSACTION LEDGER)
router.post('/deposits/:id/approve', (req, res) => {
  try {
    const { id } = req.params;

    const approveTx = db.transaction(() => {
      const deposit = db.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(id);
      if (!deposit) throw new Error('Deposit request not found');

      if (deposit.status !== 'pending') {
        throw new Error(`This deposit request has already been ${deposit.status.toUpperCase()}`);
      }

      const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(deposit.user_id);
      if (!user) throw new Error('User account not found');

      const balanceBefore = user.wallet_balance;
      const balanceAfter = balanceBefore + deposit.amount;

      // 1. Credit wallet
      db.prepare("UPDATE users SET wallet_balance = ?, updated_at = datetime('now') WHERE id = ?")
        .run(balanceAfter, deposit.user_id);

      // 2. Insert immutable transaction ledger
      const txId = `tx-dep-${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, status, description, admin_id)
        VALUES (?, ?, 'deposit', ?, ?, ?, ?, 'completed', ?, ?)
      `).run(
        txId,
        deposit.user_id,
        deposit.amount,
        balanceBefore,
        balanceAfter,
        deposit.transaction_id,
        `Deposit Approved (Method: ${deposit.payment_method.toUpperCase()}, Ref: ${deposit.transaction_id})`,
        req.user.id
      );

      // 3. Update deposit request status
      db.prepare(`
        UPDATE deposit_requests
        SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now')
        WHERE id = ?
      `).run(req.user.username, id);

      // 4. Send notification to player
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
        VALUES (?, ?, ?, ?, 'deposit', 0, '/wallet')
      `).run(
        uuidv4(),
        deposit.user_id,
        '✅ Deposit Approved!',
        `Your deposit of ₹${deposit.amount.toFixed(2)} (UTR: ${deposit.transaction_id}) has been approved and credited to your wallet balance.`
      );

      return { deposit, balanceAfter };
    });

    const result = approveTx();

    logAdminAction(req.user, 'DEPOSIT_APPROVED', 'DEPOSIT', id, {
      amount: result.deposit.amount,
      utr: result.deposit.transaction_id,
      userId: result.deposit.user_id
    }, req);

    res.json({ message: `Deposit of ₹${result.deposit.amount.toFixed(2)} approved and credited successfully!` });
  } catch (error) {
    console.error('Approve deposit error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to approve deposit' });
  }
});

// REJECT DEPOSIT
router.post('/deposits/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a reason for rejecting the deposit.' });
    }

    const deposit = db.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(id);
    if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: `This deposit request has already been ${deposit.status.toUpperCase()}` });
    }

    db.prepare(`
      UPDATE deposit_requests
      SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(reason.trim(), req.user.username, id);

    // Notify player
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
      VALUES (?, ?, ?, ?, 'deposit', 0, '/wallet')
    `).run(
      uuidv4(),
      deposit.user_id,
      '❌ Deposit Request Rejected',
      `Your deposit request for ₹${deposit.amount.toFixed(2)} (UTR: ${deposit.transaction_id}) was rejected. Reason: ${reason.trim()}`
    );

    logAdminAction(req.user, 'DEPOSIT_REJECTED', 'DEPOSIT', id, {
      amount: deposit.amount,
      utr: deposit.transaction_id,
      reason: reason.trim()
    }, req);

    res.json({ message: 'Deposit request marked as rejected.' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Failed to reject deposit request' });
  }
});

// 4. CASHOUT REQUESTS MANAGEMENT
router.get('/cashouts', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT cr.*, u.name as user_name, u.username, u.email, u.phone, u.free_fire_uid, u.wallet_balance, u.pending_balance
      FROM cashout_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND cr.status = ?';
      params.push(status);
    }

    query += " ORDER BY CASE cr.status WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 ELSE 3 END, cr.created_at DESC";

    const cashouts = db.prepare(query).all(...params);
    res.json({ cashouts });
  } catch (error) {
    console.error('Admin cashouts error:', error);
    res.status(500).json({ error: 'Failed to fetch cashout requests' });
  }
});

// MARK CASHOUT AS PROCESSING
router.post('/cashouts/:id/process', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE cashout_requests SET status = 'processing', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ? AND status = 'pending'").run(req.user.username, id);
    res.json({ message: 'Cashout request marked as Processing' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cashout status' });
  }
});

// MARK CASHOUT AS PAID (PERMANENT DEDUCTION & COMPLETE LEDGER TRANSACTION)
router.post('/cashouts/:id/mark-paid', (req, res) => {
  try {
    const { id } = req.params;
    const { transactionReference, adminNote } = req.body;

    const payTx = db.transaction(() => {
      const cashout = db.prepare('SELECT * FROM cashout_requests WHERE id = ?').get(id);
      if (!cashout) throw new Error('Cashout request not found');

      if (cashout.status === 'paid' || cashout.status === 'rejected') {
        throw new Error(`This cashout is already ${cashout.status.toUpperCase()}`);
      }

      const user = db.prepare('SELECT wallet_balance, pending_balance FROM users WHERE id = ?').get(cashout.user_id);
      if (!user) throw new Error('User not found');

      // Deduct from pending_balance permanently
      const newPending = Math.max(0, (user.pending_balance || 0) - cashout.amount);
      db.prepare("UPDATE users SET pending_balance = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newPending, cashout.user_id);

      // Insert transaction ledger record
      const txId = `tx-cash-${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, status, description, admin_id)
        VALUES (?, ?, 'cashout', ?, ?, ?, ?, 'completed', ?, ?)
      `).run(
        txId,
        cashout.user_id,
        -cashout.amount,
        user.wallet_balance + cashout.amount,
        user.wallet_balance,
        transactionReference || `CASHOUT-${id.substring(0, 8)}`,
        `Cashout of ₹${cashout.net_amount.toFixed(2)} sent to ${cashout.payout_identifier} (Ref: ${transactionReference || 'N/A'})`,
        req.user.id
      );

      // Update cashout request
      db.prepare(`
        UPDATE cashout_requests
        SET status = 'paid', transaction_reference = ?, admin_note = ?, reviewed_by = ?, reviewed_at = datetime('now')
        WHERE id = ?
      `).run(transactionReference || 'PAID_MANUAL', adminNote || null, req.user.username, id);

      // Notify player
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
        VALUES (?, ?, ?, ?, 'cashout', 0, '/wallet')
      `).run(
        uuidv4(),
        cashout.user_id,
        '💸 Cashout Paid Successfully!',
        `Your withdrawal of ₹${cashout.amount.toFixed(2)} (Net: ₹${cashout.net_amount.toFixed(2)}) has been transferred to ${cashout.payout_identifier}. Reference: ${transactionReference || 'Completed'}`
      );

      return cashout;
    });

    const result = payTx();

    logAdminAction(req.user, 'CASHOUT_PAID', 'CASHOUT', id, {
      amount: result.amount,
      netAmount: result.netAmount,
      payoutTo: result.payout_identifier,
      ref: transactionReference
    }, req);

    res.json({ message: `Cashout of ₹${result.net_amount.toFixed(2)} marked as Paid successfully!` });
  } catch (error) {
    console.error('Mark cashout paid error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to complete cashout' });
  }
});

// REJECT CASHOUT (UNLOCK RESERVED FUNDS BACK TO USER'S AVAILABLE BALANCE)
router.post('/cashouts/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a reason for rejecting the cashout request.' });
    }

    const rejectCashTx = db.transaction(() => {
      const cashout = db.prepare('SELECT * FROM cashout_requests WHERE id = ?').get(id);
      if (!cashout) throw new Error('Cashout request not found');

      if (cashout.status === 'paid' || cashout.status === 'rejected') {
        throw new Error(`This cashout is already ${cashout.status.toUpperCase()}`);
      }

      const user = db.prepare('SELECT wallet_balance, pending_balance FROM users WHERE id = ?').get(cashout.user_id);
      if (!user) throw new Error('User not found');

      // Revert funds: release from pending_balance back to wallet_balance
      const newAvailable = user.wallet_balance + cashout.amount;
      const newPending = Math.max(0, (user.pending_balance || 0) - cashout.amount);

      db.prepare("UPDATE users SET wallet_balance = ?, pending_balance = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newAvailable, newPending, cashout.user_id);

      db.prepare(`
        UPDATE cashout_requests
        SET status = 'rejected', admin_note = ?, reviewed_by = ?, reviewed_at = datetime('now')
        WHERE id = ?
      `).run(reason.trim(), req.user.username, id);

      // Notify player
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
        VALUES (?, ?, ?, ?, 'cashout', 0, '/wallet')
      `).run(
        uuidv4(),
        cashout.user_id,
        '❌ Cashout Request Rejected',
        `Your withdrawal request for ₹${cashout.amount.toFixed(2)} was rejected. Reserved funds (₹${cashout.amount.toFixed(2)}) have been returned to your available balance. Reason: ${reason.trim()}`
      );

      return { cashout, newAvailable };
    });

    const result = rejectCashTx();

    logAdminAction(req.user, 'CASHOUT_REJECTED', 'CASHOUT', id, {
      amount: result.cashout.amount,
      reason: reason.trim()
    }, req);

    res.json({ message: 'Cashout request rejected. Reserved funds have been returned to player wallet.' });
  } catch (error) {
    console.error('Reject cashout error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to reject cashout' });
  }
});

// 5. TOURNAMENT MANAGEMENT (CREATE / EDIT / CANCEL / DELETE)
router.post('/tournaments', (req, res) => {
  try {
    const {
      name, mode, team_size, entry_fee, prize_pool, first_prize, second_prize, third_prize, kill_bounty,
      max_slots, date, start_time, registration_deadline, map, rules, scoring_rules, room_id, room_password,
      room_release_time, status, banner_img
    } = req.body;

    if (!name || !mode || !date || !start_time) {
      return res.status(400).json({ error: 'Name, mode, date, and start time are required.' });
    }

    const id = `tourn-${mode === 'battle_royale' ? 'br' : mode === 'clash_squad' ? 'cs' : 'lw'}-${uuidv4().substring(0, 8)}`;
    const slotsCount = mode === 'battle_royale' ? 50 : (parseInt(max_slots, 10) || 16);

    const defaultScoring = mode === 'battle_royale' 
      ? JSON.stringify({ 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, kill: 1 })
      : JSON.stringify({ win: 10, kill: 1 });

    db.prepare(`
      INSERT INTO tournaments (
        id, name, mode, team_size, entry_fee, prize_pool, first_prize, second_prize, third_prize, kill_bounty,
        max_slots, filled_slots, date, start_time, registration_deadline, map, rules, scoring_rules,
        room_id, room_password, room_release_time, is_room_released, status, banner_img
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, 0, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 0, ?, ?
      )
    `).run(
      id,
      name.trim(),
      mode,
      parseInt(team_size, 10) || 1,
      parseFloat(entry_fee) || 0,
      parseFloat(prize_pool) || 0,
      parseFloat(first_prize) || 0,
      parseFloat(second_prize) || 0,
      parseFloat(third_prize) || 0,
      parseFloat(kill_bounty) || 0,
      slotsCount,
      date,
      start_time,
      registration_deadline || null,
      map || 'Bermuda',
      rules || 'Standard Competitive Rules apply.',
      scoring_rules ? (typeof scoring_rules === 'string' ? scoring_rules : JSON.stringify(scoring_rules)) : defaultScoring,
      room_id || '',
      room_password || '',
      room_release_time || null,
      status || 'open',
      banner_img || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'
    );

    logAdminAction(req.user, 'TOURNAMENT_CREATED', 'TOURNAMENT', id, { name, mode, entry_fee, prize_pool }, req);

    res.status(201).json({ message: 'Tournament created successfully!', id });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// UPDATE TOURNAMENT
router.put('/tournaments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, mode, team_size, entry_fee, prize_pool, first_prize, second_prize, third_prize, kill_bounty,
      max_slots, date, start_time, registration_deadline, map, rules, scoring_rules, room_id, room_password,
      room_release_time, is_room_released, status, banner_img
    } = req.body;

    const existing = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Tournament not found' });

    db.prepare(`
      UPDATE tournaments SET
        name = COALESCE(?, name),
        mode = COALESCE(?, mode),
        team_size = COALESCE(?, team_size),
        entry_fee = COALESCE(?, entry_fee),
        prize_pool = COALESCE(?, prize_pool),
        first_prize = COALESCE(?, first_prize),
        second_prize = COALESCE(?, second_prize),
        third_prize = COALESCE(?, third_prize),
        kill_bounty = COALESCE(?, kill_bounty),
        max_slots = COALESCE(?, max_slots),
        date = COALESCE(?, date),
        start_time = COALESCE(?, start_time),
        registration_deadline = COALESCE(?, registration_deadline),
        map = COALESCE(?, map),
        rules = COALESCE(?, rules),
        scoring_rules = COALESCE(?, scoring_rules),
        room_id = COALESCE(?, room_id),
        room_password = COALESCE(?, room_password),
        room_release_time = COALESCE(?, room_release_time),
        is_room_released = COALESCE(?, is_room_released),
        status = COALESCE(?, status),
        banner_img = COALESCE(?, banner_img),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name, mode, team_size, entry_fee, prize_pool, first_prize, second_prize, third_prize, kill_bounty,
      max_slots, date, start_time, registration_deadline, map, rules,
      scoring_rules ? (typeof scoring_rules === 'string' ? scoring_rules : JSON.stringify(scoring_rules)) : null,
      room_id, room_password, room_release_time, is_room_released !== undefined ? (is_room_released ? 1 : 0) : null,
      status, banner_img, id
    );

    logAdminAction(req.user, 'TOURNAMENT_UPDATED', 'TOURNAMENT', id, { name, status }, req);

    res.json({ message: 'Tournament updated successfully!' });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

// RELEASE ROOM ID & PASSWORD (INSTANT BROADCAST TO JOINED PLAYERS)
router.post('/tournaments/:id/release-room', (req, res) => {
  try {
    const { id } = req.params;
    const { roomId, roomPassword } = req.body;

    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    const finalRoomId = roomId || tournament.room_id;
    const finalRoomPass = roomPassword || tournament.room_password;

    if (!finalRoomId || !finalRoomPass) {
      return res.status(400).json({ error: 'Please enter a valid Room ID and Room Password before releasing.' });
    }

    db.prepare(`
      UPDATE tournaments
      SET room_id = ?, room_password = ?, is_room_released = 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(finalRoomId, finalRoomPass, id);

    // Get all registered players and send push notification
    const participants = db.prepare("SELECT user_id, player_ign FROM tournament_registrations WHERE tournament_id = ? AND status = 'registered'").all(id);

    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
      VALUES (?, ?, ?, ?, 'match', 0, ?)
    `);

    for (const p of participants) {
      insertNotif.run(
        uuidv4(),
        p.user_id,
        '🚨 Room ID & Password Released!',
        `Match Room details for "${tournament.name}" are now live! Room ID: ${finalRoomId} | Password: ${finalRoomPass}. Join Free Fire room immediately!`,
        `/tournaments/${id}`
      );
    }

    logAdminAction(req.user, 'ROOM_CREDENTIALS_RELEASED', 'TOURNAMENT', id, { roomId: finalRoomId, participantCount: participants.length }, req);

    res.json({
      message: `Room credentials released! ${participants.length} registered players have been notified.`,
      roomId: finalRoomId,
      roomPassword: finalRoomPass
    });
  } catch (error) {
    console.error('Release room error:', error);
    res.status(500).json({ error: 'Failed to release room credentials' });
  }
});

// CANCEL TOURNAMENT & AUTOMATICALLY REFUND ALL PARTICIPANTS
router.post('/tournaments/:id/cancel-refund', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cancelTx = db.transaction(() => {
      const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
      if (!tournament) throw new Error('Tournament not found');

      if (tournament.status === 'cancelled') {
        throw new Error('Tournament is already cancelled');
      }

      // Mark tournament cancelled
      db.prepare("UPDATE tournaments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);

      // Refund all registered players
      const registrations = db.prepare("SELECT * FROM tournament_registrations WHERE tournament_id = ? AND status = 'registered'").all(id);
      let refundCount = 0;

      for (const reg of registrations) {
        const fee = reg.entry_fee_paid || 0;
        if (fee > 0) {
          const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(reg.user_id);
          if (user) {
            const balanceBefore = user.wallet_balance;
            const balanceAfter = balanceBefore + fee;

            db.prepare("UPDATE users SET wallet_balance = ?, updated_at = datetime('now') WHERE id = ?").run(balanceAfter, reg.user_id);

            db.prepare(`
              INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, status, description, admin_id)
              VALUES (?, ?, 'refund', ?, ?, ?, ?, 'completed', ?, ?)
            `).run(
              `tx-ref-${uuidv4().substring(0, 8)}`,
              reg.user_id,
              fee,
              balanceBefore,
              balanceAfter,
              id,
              `Refund: Tournament "${tournament.name}" Cancelled (${reason || 'Admin Cancellation'})`,
              req.user.id
            );
          }
        }

        db.prepare("UPDATE tournament_registrations SET status = 'refunded' WHERE id = ?").run(reg.id);

        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
          VALUES (?, ?, ?, ?, 'tournament', 0, '/wallet')
        `).run(
          uuidv4(),
          reg.user_id,
          '⚠️ Tournament Cancelled — Entry Fee Refunded',
          `"${tournament.name}" was cancelled. ₹${(reg.entry_fee_paid || 0).toFixed(2)} has been refunded to your wallet balance. Reason: ${reason || 'Event Cancelled'}`
        );

        refundCount++;
      }

      return { tournament, refundCount };
    });

    const result = cancelTx();

    logAdminAction(req.user, 'TOURNAMENT_CANCELLED_REFUNDED', 'TOURNAMENT', id, {
      refundedPlayersCount: result.refundCount,
      reason
    }, req);

    res.json({ message: `Tournament cancelled. ${result.refundCount} participants refunded successfully!` });
  } catch (error) {
    console.error('Cancel tournament error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to cancel tournament' });
  }
});

// DELETE TOURNAMENT
router.delete('/tournaments/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
    logAdminAction(req.user, 'TOURNAMENT_DELETED', 'TOURNAMENT', id, {}, req);
    res.json({ message: 'Tournament deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

// 6. RESULTS & PRIZE DISTRIBUTION ENGINE
router.post('/tournaments/:id/results', (req, res) => {
  try {
    const { id } = req.params;
    const { results, isFinalizeAndPayout } = req.body; // Array of { userId, playerName, ffUid, position, kills, prizeAmount }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Please provide match results array.' });
    }

    const resultsTx = db.transaction(() => {
      const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
      if (!tournament) throw new Error('Tournament not found');

      // Delete prior temporary results for this tournament
      db.prepare('DELETE FROM match_results WHERE tournament_id = ?').run(id);

      const scoring = tournament.scoring_rules ? JSON.parse(tournament.scoring_rules) : {};
      const rankPtsTable = scoring.rankPoints || scoring || { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 };
      const killPointVal = scoring.killPoints || scoring.kill || 1;

      const insertRes = db.prepare(`
        INSERT INTO match_results (
          id, tournament_id, user_id, player_name, player_ff_uid, position, kills,
          placement_points, kill_points, total_points, prize_amount, is_prize_credited
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const row of results) {
        const pos = parseInt(row.position, 10) || 0;
        const kills = parseInt(row.kills, 10) || 0;
        const placePts = rankPtsTable[pos] || 0;
        const killPts = kills * killPointVal;
        const totalPts = placePts + killPts;
        const prize = parseFloat(row.prizeAmount) || 0;

        const isCredited = isFinalizeAndPayout ? 1 : 0;

        insertRes.run(
          uuidv4(),
          id,
          row.userId || null,
          row.playerName || 'Player',
          row.ffUid || null,
          pos,
          kills,
          placePts,
          killPts,
          totalPts,
          prize,
          isCredited
        );

        // Update player career kills & stats if registered user
        if (row.userId && !row.userId.startsWith('bot-')) {
          db.prepare('UPDATE users SET total_kills = total_kills + ? WHERE id = ?').run(kills, row.userId);

          // If final payout is checked, credit wallet & career earnings
          if (isFinalizeAndPayout && prize > 0) {
            const user = db.prepare('SELECT wallet_balance, total_earnings, total_wins FROM users WHERE id = ?').get(row.userId);
            if (user) {
              const balanceBefore = user.wallet_balance;
              const balanceAfter = balanceBefore + prize;
              const isWin = pos === 1 ? 1 : 0;

              db.prepare(`
                UPDATE users
                SET wallet_balance = ?,
                    total_earnings = total_earnings + ?,
                    total_wins = total_wins + ?,
                    updated_at = datetime('now')
                WHERE id = ?
              `).run(balanceAfter, prize, isWin, row.userId);

              // Immutable Ledger
              db.prepare(`
                INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, status, description, admin_id)
                VALUES (?, ?, 'prize_credit', ?, ?, ?, ?, 'completed', ?, ?)
              `).run(
                `tx-prz-${uuidv4().substring(0, 8)}`,
                row.userId,
                prize,
                balanceBefore,
                balanceAfter,
                id,
                `🏆 Prize Winnings: Rank #${pos} in "${tournament.name}"`,
                req.user.id
              );

              // Notify winner
              db.prepare(`
                INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
                VALUES (?, ?, ?, ?, 'prize', 0, '/wallet')
              `).run(
                uuidv4(),
                row.userId,
                `🏆 Prize Credited: ₹${prize.toFixed(2)}`,
                `Congratulations! You placed #${pos} in "${tournament.name}". ₹${prize.toFixed(2)} has been credited to your wallet!`
              );
            }
          }
        }
      }

      if (isFinalizeAndPayout) {
        db.prepare("UPDATE tournaments SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(id);
      }

      return { isFinalizeAndPayout, resultsCount: results.length };
    });

    const output = resultsTx();

    logAdminAction(req.user, output.isFinalizeAndPayout ? 'RESULTS_FINALIZED_PRIZES_PAID' : 'RESULTS_SAVED_DRAFT', 'TOURNAMENT', id, { count: output.resultsCount }, req);

    res.json({
      message: output.isFinalizeAndPayout
        ? 'Results finalized! Winners credited and tournament marked completed.'
        : 'Match results saved successfully.'
    });
  } catch (error) {
    console.error('Results submission error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to submit match results' });
  }
});

// 7. ALL TRANSACTIONS INSPECTOR
router.get('/transactions', (req, res) => {
  try {
    const { type, search, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT t.*, u.name as user_name, u.username, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'all') {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (u.username LIKE ? OR u.name LIKE ? OR t.description LIKE ? OR t.reference_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const transactions = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;

    res.json({ transactions, total });
  } catch (error) {
    console.error('Admin transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch platform transactions' });
  }
});

// 8. SUPPORT TICKETS MANAGEMENT
router.get('/support-tickets', (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT st.*, u.name as user_name, u.username, u.email, u.phone
      FROM support_tickets st
      JOIN users u ON st.user_id = u.id
      ORDER BY CASE st.status WHEN 'open' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END, st.created_at DESC
    `).all();

    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

router.post('/support-tickets/:id/reply', (req, res) => {
  try {
    const { id } = req.params;
    const { reply, status } = req.body;

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    db.prepare(`
      UPDATE support_tickets
      SET admin_reply = ?, status = ?, resolved_at = ${status === 'resolved' ? "datetime('now')" : "resolved_at"}
      WHERE id = ?
    `).run(reply || ticket.admin_reply, status || ticket.status, id);

    // Notify user
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
      VALUES (?, ?, ?, ?, 'system', 0, '/support')
    `).run(
      uuidv4(),
      ticket.user_id,
      `💬 Support Ticket Update (${ticket.id})`,
      `Admin replied to your ticket: "${(reply || '').substring(0, 80)}..."`
    );

    res.json({ message: 'Reply sent and ticket status updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// 9. PLATFORM & PAYMENT SETTINGS
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM platform_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', (req, res) => {
  try {
    const { settings } = req.body; // Object with key-value pairs
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    const updateStmt = db.prepare("INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");

    for (const [key, value] of Object.entries(settings)) {
      updateStmt.run(key, String(value));
    }

    logAdminAction(req.user, 'PLATFORM_SETTINGS_UPDATED', 'SETTINGS', 'SYSTEM', settings, req);

    res.json({ message: 'Platform settings updated successfully!' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 10. AUDIT LOGS
router.get('/audit-logs', (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = db.prepare('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(limit, 10), parseInt(offset, 10));
    const total = db.prepare('SELECT COUNT(*) as count FROM admin_audit_logs').get().count;
    res.json({ logs, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;

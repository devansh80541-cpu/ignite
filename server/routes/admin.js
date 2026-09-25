import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply requireAdmin middleware to all routes in this router
router.use(requireAdmin);

// HELPER: AUDIT LOGGER
async function logAdminAction(adminUser, action, entityType, entityId, details, req) {
  try {
    await db.prepare(`
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
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalUsersRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'player'").get();
    const activeUsersRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'player' AND is_banned = 0").get();

    const totalDepositsRes = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM deposit_requests WHERE status = 'approved'
    `).get();

    const pendingDepositsCountRes = await db.prepare("SELECT COUNT(*) as count FROM deposit_requests WHERE status = 'pending'").get();
    const pendingDepositsAmountRes = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM deposit_requests WHERE status = 'pending'").get();

    const totalCashoutsRes = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM cashout_requests WHERE status = 'paid'
    `).get();

    const pendingCashoutsCountRes = await db.prepare("SELECT COUNT(*) as count FROM cashout_requests WHERE status = 'pending'").get();
    const pendingCashoutsAmountRes = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cashout_requests WHERE status = 'pending'").get();

    const activeTournamentsRes = await db.prepare("SELECT COUNT(*) as count FROM tournaments WHERE status IN ('open', 'live')").get();
    const completedTournamentsRes = await db.prepare("SELECT COUNT(*) as count FROM tournaments WHERE status = 'completed'").get();
    const totalPrizeMoneyRes = await db.prepare("SELECT COALESCE(SUM(prize_pool), 0) as total FROM tournaments WHERE status = 'completed'").get();

    const totalUsers = parseInt(totalUsersRes?.count || 0);
    const activeUsers = parseInt(activeUsersRes?.count || 0);
    const totalDeposits = parseFloat(totalDepositsRes?.total || 0);
    const pendingDepositsCount = parseInt(pendingDepositsCountRes?.count || 0);
    const pendingDepositsAmount = parseFloat(pendingDepositsAmountRes?.total || 0);
    const totalCashouts = parseFloat(totalCashoutsRes?.total || 0);
    const pendingCashoutsCount = parseInt(pendingCashoutsCountRes?.count || 0);
    const pendingCashoutsAmount = parseFloat(pendingCashoutsAmountRes?.total || 0);
    const activeTournaments = parseInt(activeTournamentsRes?.count || 0);
    const completedTournaments = parseInt(completedTournamentsRes?.count || 0);
    const totalPrizeMoney = parseFloat(totalPrizeMoneyRes?.total || 0);

    // Platform Net Revenue Estimate: (Total Entry Fees Collected) - (Total Prizes Distributed) + Cashout Fees
    const totalEntryFeesRes = await db.prepare(`
      SELECT COALESCE(ABS(SUM(amount)), 0) as total
      FROM transactions WHERE type = 'tournament_entry' AND status = 'completed'
    `).get();

    const totalPrizesGivenRes = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'prize_credit' AND status = 'completed'
    `).get();

    const cashoutFeesCollectedRes = await db.prepare(`
      SELECT COALESCE(SUM(fee_amount), 0) as total
      FROM cashout_requests WHERE status = 'paid'
    `).get();

    const totalEntryFees = parseFloat(totalEntryFeesRes?.total || 0);
    const totalPrizesGiven = parseFloat(totalPrizesGivenRes?.total || 0);
    const cashoutFeesCollected = parseFloat(cashoutFeesCollectedRes?.total || 0);

    const platformRevenue = Math.max(0, (totalEntryFees - totalPrizesGiven) + cashoutFeesCollected);

    // Recent Audit Logs
    const recentAudits = await db.prepare('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 10').all();

    // Chart Data: Last 7 Days Financial Flows
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      days.push(d);
    }

    const depositsList = [];
    const cashoutsList = [];
    const registrationsList = [];

    for (const day of days) {
      const dep = await db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM deposit_requests
        WHERE status = 'approved' AND DATE(created_at) = ?
      `).get(day);
      depositsList.push(parseFloat(dep?.total || 0));

      const cash = await db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM cashout_requests
        WHERE status = 'paid' AND DATE(created_at) = ?
      `).get(day);
      cashoutsList.push(parseFloat(cash?.total || 0));

      const reg = await db.prepare(`
        SELECT COUNT(*) as count
        FROM tournament_registrations
        WHERE DATE(created_at) = ?
      `).get(day);
      registrationsList.push(parseInt(reg?.count || 0));
    }

    const chartData = {
      labels: days.map(d => d.slice(5)), // MM-DD
      deposits: depositsList,
      cashouts: cashoutsList,
      registrations: registrationsList
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
router.get('/users', async (req, res) => {
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

    const users = await db.prepare(query).all(...params);
    const totalRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'player'").get();
    const total = parseInt(totalRes?.count || 0);

    res.json({ users, total });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET DETAILED USER PROFILE WITH ALL ASSOCIATED DATA
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.prepare('SELECT id, name, username, email, phone, free_fire_uid, in_game_name, avatar, wallet_balance, pending_balance, role, is_banned, total_earnings, total_wins, total_matches, total_kills, created_at FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(id);
    const deposits = await db.prepare('SELECT * FROM deposit_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(id);
    const cashouts = await db.prepare('SELECT * FROM cashout_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(id);
    const tournaments = await db.prepare(`
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
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    const banState = isBanned ? 1 : 0;

    await db.prepare("UPDATE users SET is_banned = ?, updated_at = NOW() WHERE id = ?").run(banState, id);

    await logAdminAction(req.user, banState ? 'USER_BANNED' : 'USER_UNBANNED', 'USER', id, { isBanned: banState }, req);

    res.json({ message: `User account has been ${banState ? 'suspended' : 'reactivated'}.` });
  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// MANUAL WALLET BALANCE ADJUSTMENT (LEDGER-BACKED ONLY - NEVER SILENT MODIFICATION)
router.post('/users/:id/adjust-balance', async (req, res) => {
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

    const adjustTx = db.transaction(async (txDb) => {
      const user = await txDb.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(id);
      if (!user) throw new Error('User not found');

      const balanceBefore = user.wallet_balance;
      const balanceAfter = balanceBefore + numAmount;

      if (balanceAfter < 0) {
        throw new Error(`Cannot adjust balance below zero. Current: ₹${balanceBefore.toFixed(2)}, Proposed: ₹${balanceAfter.toFixed(2)}`);
      }

      await txDb.prepare("UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?").run(balanceAfter, id);

      const txId = `tx-adj-${uuidv4().substring(0, 8)}`;
      await txDb.prepare(`
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
      await txDb.prepare(`
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

    const result = await adjustTx();

    await logAdminAction(req.user, 'MANUAL_BALANCE_ADJUSTMENT', 'WALLET', id, {
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
router.get('/deposits', async (req, res) => {
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

    const deposits = await db.prepare(query).all(...params);
    res.json({ deposits });
  } catch (error) {
    console.error('Admin deposits fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// APPROVE DEPOSIT (CREDIT WALLET & WRITE TRANSACTION LEDGER)
router.post('/deposits/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const approveTx = db.transaction(async (txDb) => {
      const deposit = await txDb.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(id);
      if (!deposit) throw new Error('Deposit request not found');

      if (deposit.status !== 'pending') {
        throw new Error(`This deposit request has already been ${deposit.status.toUpperCase()}`);
      }

      const user = await txDb.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(deposit.user_id);
      if (!user) throw new Error('User account not found');

      const balanceBefore = user.wallet_balance;
      const balanceAfter = balanceBefore + deposit.amount;

      // 1. Credit wallet
      await txDb.prepare("UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?")
        .run(balanceAfter, deposit.user_id);

      // 2. Insert immutable transaction ledger
      const txId = `tx-dep-${uuidv4().substring(0, 8)}`;
      await txDb.prepare(`
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
      await txDb.prepare(`
        UPDATE deposit_requests
        SET status = 'approved', reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ?
      `).run(req.user.username, id);

      // 4. Send notification to player
      await txDb.prepare(`
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

    const result = await approveTx();

    await logAdminAction(req.user, 'DEPOSIT_APPROVED', 'DEPOSIT', id, {
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
router.post('/deposits/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a reason for rejecting the deposit.' });
    }

    const deposit = await db.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(id);
    if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: `This deposit request has already been ${deposit.status.toUpperCase()}` });
    }

    await db.prepare(`
      UPDATE deposit_requests
      SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
      WHERE id = ?
    `).run(reason.trim(), req.user.username, id);

    // Notify player
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
      VALUES (?, ?, ?, ?, 'deposit', 0, '/wallet')
    `).run(
      uuidv4(),
      deposit.user_id,
      '❌ Deposit Request Rejected',
      `Your deposit request for ₹${deposit.amount.toFixed(2)} (UTR: ${deposit.transaction_id}) was rejected. Reason: ${reason.trim()}`
    );

    await logAdminAction(req.user, 'DEPOSIT_REJECTED', 'DEPOSIT', id, {
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
router.get('/cashouts', async (req, res) => {
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

    const cashouts = await db.prepare(query).all(...params);
    res.json({ cashouts });
  } catch (error) {
    console.error('Admin cashouts error:', error);
    res.status(500).json({ error: 'Failed to fetch cashout requests' });
  }
});

// MARK CASHOUT AS PROCESSING
router.post('/cashouts/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare("UPDATE cashout_requests SET status = 'processing', reviewed_by = ?, reviewed_at = NOW() WHERE id = ? AND status = 'pending'").run(req.user.username, id);
    res.json({ message: 'Cashout request marked as Processing' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cashout status' });
  }
});

// MARK CASHOUT AS PAID (PERMANENT DEDUCTION & COMPLETE LEDGER TRANSACTION)
router.post('/cashouts/:id/mark-paid', async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionReference, adminNote } = req.body;

    const payTx = db.transaction(async (txDb) => {
      const cashout = await txDb.prepare('SELECT * FROM cashout_requests WHERE id = ?').get(id);
      if (!cashout) throw new Error('Cashout request not found');

      if (cashout.status === 'paid' || cashout.status === 'rejected') {
        throw new Error(`This cashout is already ${cashout.status.toUpperCase()}`);
      }

      const user = await txDb.prepare('SELECT wallet_balance, pending_balance FROM users WHERE id = ?').get(cashout.user_id);
      if (!user) throw new Error('User not found');

      // Deduct from pending_balance permanently
      const newPending = Math.max(0, (user.pending_balance || 0) - cashout.amount);
      await txDb.prepare("UPDATE users SET pending_balance = ?, updated_at = NOW() WHERE id = ?")
        .run(newPending, cashout.user_id);

      // Insert transaction ledger record
      const txId = `tx-cash-${uuidv4().substring(0, 8)}`;
      await txDb.prepare(`
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
      await txDb.prepare(`
        UPDATE cashout_requests
        SET status = 'paid', transaction_reference = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ?
      `).run(transactionReference || 'PAID_MANUAL', adminNote || null, req.user.username, id);

      // Notify player
      await txDb.prepare(`
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

    const result = await payTx();

    await logAdminAction(req.user, 'CASHOUT_PAID', 'CASHOUT', id, {
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
router.post('/cashouts/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a reason for rejecting the cashout request.' });
    }

    const rejectCashTx = db.transaction(async (txDb) => {
      const cashout = await txDb.prepare('SELECT * FROM cashout_requests WHERE id = ?').get(id);
      if (!cashout) throw new Error('Cashout request not found');

      if (cashout.status === 'paid' || cashout.status === 'rejected') {
        throw new Error(`This cashout is already ${cashout.status.toUpperCase()}`);
      }

      const user = await txDb.prepare('SELECT wallet_balance, pending_balance FROM users WHERE id = ?').get(cashout.user_id);
      if (!user) throw new Error('User not found');

      // Revert funds: release from pending_balance back to wallet_balance
      const newAvailable = user.wallet_balance + cashout.amount;
      const newPending = Math.max(0, (user.pending_balance || 0) - cashout.amount);

      await txDb.prepare("UPDATE users SET wallet_balance = ?, pending_balance = ?, updated_at = NOW() WHERE id = ?")
        .run(newAvailable, newPending, cashout.user_id);

      await txDb.prepare(`
        UPDATE cashout_requests
        SET status = 'rejected', admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ?
      `).run(reason.trim(), req.user.username, id);

      // Notify player
      await txDb.prepare(`
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

    const result = await rejectCashTx();

    await logAdminAction(req.user, 'CASHOUT_REJECTED', 'CASHOUT', id, {
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
router.post('/tournaments', async (req, res) => {
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

    await db.prepare(`
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

    await logAdminAction(req.user, 'TOURNAMENT_CREATED', 'TOURNAMENT', id, { name, mode, entry_fee, prize_pool }, req);

    res.status(201).json({ message: 'Tournament created successfully!', id });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// UPDATE TOURNAMENT
router.put('/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, mode, team_size, entry_fee, prize_pool, first_prize, second_prize, third_prize, kill_bounty,
      max_slots, date, start_time, registration_deadline, map, rules, scoring_rules, room_id, room_password,
      room_release_time, is_room_released, status, banner_img
    } = req.body;

    const existing = await db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Tournament not found' });

    await db.prepare(`
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
        updated_at = NOW()
      WHERE id = ?
    `).run(
      name, mode, team_size, entry_fee, prize_pool, first_prize, second_prize, third_prize, kill_bounty,
      max_slots, date, start_time, registration_deadline, map, rules,
      scoring_rules ? (typeof scoring_rules === 'string' ? scoring_rules : JSON.stringify(scoring_rules)) : null,
      room_id, room_password, room_release_time, is_room_released !== undefined ? (is_room_released ? 1 : 0) : null,
      status, banner_img, id
    );

    await logAdminAction(req.user, 'TOURNAMENT_UPDATED', 'TOURNAMENT', id, { name, status }, req);

    res.json({ message: 'Tournament updated successfully!' });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

// RELEASE ROOM ID & PASSWORD (INSTANT BROADCAST TO JOINED PLAYERS)
router.post('/tournaments/:id/release-room', async (req, res) => {
  try {
    const { id } = req.params;
    const { roomId, roomPassword } = req.body;

    const tournament = await db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    const finalRoomId = roomId || tournament.room_id;
    const finalRoomPass = roomPassword || tournament.room_password;

    if (!finalRoomId || !finalRoomPass) {
      return res.status(400).json({ error: 'Please enter a valid Room ID and Room Password before releasing.' });
    }

    await db.prepare(`
      UPDATE tournaments
      SET room_id = ?, room_password = ?, is_room_released = 1, updated_at = NOW()
      WHERE id = ?
    `).run(finalRoomId, finalRoomPass, id);

    // Get all registered players and send push notification
    const participants = await db.prepare("SELECT user_id, player_ign FROM tournament_registrations WHERE tournament_id = ? AND status = 'registered'").all(id);

    for (const p of participants) {
      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
        VALUES (?, ?, ?, ?, 'match', 0, ?)
      `).run(
        uuidv4(),
        p.user_id,
        '🚨 Room ID & Password Released!',
        `Match Room details for "${tournament.name}" are now live! Room ID: ${finalRoomId} | Password: ${finalRoomPass}. Join Free Fire room immediately!`,
        `/tournaments/${id}`
      );
    }

    await logAdminAction(req.user, 'ROOM_CREDENTIALS_RELEASED', 'TOURNAMENT', id, { roomId: finalRoomId, participantCount: participants.length }, req);

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
router.post('/tournaments/:id/cancel-refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cancelTx = db.transaction(async (txDb) => {
      const tournament = await txDb.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
      if (!tournament) throw new Error('Tournament not found');

      if (tournament.status === 'cancelled') {
        throw new Error('Tournament is already cancelled');
      }

      // Mark tournament cancelled
      await txDb.prepare("UPDATE tournaments SET status = 'cancelled', updated_at = NOW() WHERE id = ?").run(id);

      // Refund all registered players
      const registrations = await txDb.prepare("SELECT * FROM tournament_registrations WHERE tournament_id = ? AND status = 'registered'").all(id);
      let refundCount = 0;

      for (const reg of registrations) {
        const fee = reg.entry_fee_paid || 0;
        if (fee > 0) {
          const user = await txDb.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(reg.user_id);
          if (user) {
            const balanceBefore = user.wallet_balance;
            const balanceAfter = balanceBefore + fee;

            await txDb.prepare("UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?").run(balanceAfter, reg.user_id);

            await txDb.prepare(`
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

        await txDb.prepare("UPDATE tournament_registrations SET status = 'refunded' WHERE id = ?").run(reg.id);

        await txDb.prepare(`
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

    const result = await cancelTx();

    await logAdminAction(req.user, 'TOURNAMENT_CANCELLED_REFUNDED', 'TOURNAMENT', id, {
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
router.delete('/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
    await logAdminAction(req.user, 'TOURNAMENT_DELETED', 'TOURNAMENT', id, {}, req);
    res.json({ message: 'Tournament deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

// 6. RESULTS & PRIZE DISTRIBUTION ENGINE
router.post('/tournaments/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const { results, isFinalizeAndPayout } = req.body; // Array of { userId, playerName, ffUid, position, kills, prizeAmount }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Please provide match results array.' });
    }

    const resultsTx = db.transaction(async (txDb) => {
      const tournament = await txDb.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
      if (!tournament) throw new Error('Tournament not found');

      // Delete prior temporary results for this tournament
      await txDb.prepare('DELETE FROM match_results WHERE tournament_id = ?').run(id);

      const scoring = tournament.scoring_rules ? JSON.parse(tournament.scoring_rules) : {};
      const rankPtsTable = scoring.rankPoints || scoring || { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 };
      const killPointVal = scoring.killPoints || scoring.kill || 1;

      for (const row of results) {
        const pos = parseInt(row.position, 10) || 0;
        const kills = parseInt(row.kills, 10) || 0;
        const placePts = rankPtsTable[pos] || 0;
        const killPts = kills * killPointVal;
        const totalPts = placePts + killPts;
        const prize = parseFloat(row.prizeAmount) || 0;

        const isCredited = isFinalizeAndPayout ? 1 : 0;

        await txDb.prepare(`
          INSERT INTO match_results (
            id, tournament_id, user_id, player_name, player_ff_uid, position, kills,
            placement_points, kill_points, total_points, prize_amount, is_prize_credited
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
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
          await txDb.prepare('UPDATE users SET total_kills = total_kills + ? WHERE id = ?').run(kills, row.userId);

          // If final payout is checked, credit wallet & career earnings
          if (isFinalizeAndPayout && prize > 0) {
            const user = await txDb.prepare('SELECT wallet_balance, total_earnings, total_wins FROM users WHERE id = ?').get(row.userId);
            if (user) {
              const balanceBefore = user.wallet_balance;
              const balanceAfter = balanceBefore + prize;
              const isWin = pos === 1 ? 1 : 0;

              await txDb.prepare(`
                UPDATE users
                SET wallet_balance = ?,
                    total_earnings = total_earnings + ?,
                    total_wins = total_wins + ?,
                    updated_at = NOW()
                WHERE id = ?
              `).run(balanceAfter, prize, isWin, row.userId);

              // Immutable Ledger
              await txDb.prepare(`
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
              await txDb.prepare(`
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
        await txDb.prepare("UPDATE tournaments SET status = 'completed', updated_at = NOW() WHERE id = ?").run(id);
      }

      return { isFinalizeAndPayout, resultsCount: results.length };
    });

    const output = await resultsTx();

    await logAdminAction(req.user, output.isFinalizeAndPayout ? 'RESULTS_FINALIZED_PRIZES_PAID' : 'RESULTS_SAVED_DRAFT', 'TOURNAMENT', id, { count: output.resultsCount }, req);

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
router.get('/transactions', async (req, res) => {
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

    const transactions = await db.prepare(query).all(...params);
    const totalRes = await db.prepare('SELECT COUNT(*) as count FROM transactions').get();
    const total = parseInt(totalRes?.count || 0);

    res.json({ transactions, total });
  } catch (error) {
    console.error('Admin transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch platform transactions' });
  }
});

// 8. SUPPORT TICKETS MANAGEMENT
router.get('/support-tickets', async (req, res) => {
  try {
    const tickets = await db.prepare(`
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

router.post('/support-tickets/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, status } = req.body;

    const ticket = await db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const resolvedClause = status === 'resolved' ? 'NOW()' : 'resolved_at';
    await db.prepare(`
      UPDATE support_tickets
      SET admin_reply = ?, status = ?, resolved_at = ${resolvedClause}
      WHERE id = ?
    `).run(reply || ticket.admin_reply, status || ticket.status, id);

    // Notify user
    await db.prepare(`
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
router.get('/settings', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT key, value FROM platform_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body; // Object with key-value pairs
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    const updateStmt = db.prepare("INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()");

    for (const [key, value] of Object.entries(settings)) {
      await updateStmt.run(key, String(value));
    }

    await logAdminAction(req.user, 'PLATFORM_SETTINGS_UPDATED', 'SETTINGS', 'SYSTEM', settings, req);

    res.json({ message: 'Platform settings updated successfully!' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 10. AUDIT LOGS
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = await db.prepare('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(limit, 10), parseInt(offset, 10));
    const totalRes = await db.prepare('SELECT COUNT(*) as count FROM admin_audit_logs').get();
    const total = parseInt(totalRes?.count || 0);
    res.json({ logs, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;

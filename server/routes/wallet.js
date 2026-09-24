import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET WALLET SUMMARY & STATS
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.prepare('SELECT wallet_balance, pending_balance, total_earnings FROM users WHERE id = ?').get(userId);

    // Aggregate totals from transactions
    const totalDeposited = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND type = 'deposit' AND status = 'completed'
    `).get(userId).total;

    const totalWinnings = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND type = 'prize_credit' AND status = 'completed'
    `).get(userId).total;

    const totalWithdrawn = db.prepare(`
      SELECT COALESCE(ABS(SUM(amount)), 0) as total
      FROM transactions
      WHERE user_id = ? AND type = 'cashout' AND status = 'completed'
    `).get(userId).total;

    const pendingDeposits = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM deposit_requests
      WHERE user_id = ? AND status = 'pending'
    `).get(userId).total;

    // Fetch platform payment settings (UPI, QR, Min/Max)
    const settingsRows = db.prepare('SELECT key, value FROM platform_settings').all();
    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    res.json({
      availableBalance: user.wallet_balance || 0,
      pendingBalance: user.pending_balance || 0,
      totalDeposited,
      totalWinnings: totalWinnings || user.total_earnings || 0,
      totalWithdrawn,
      pendingDeposits,
      settings: {
        upiId: settings.upi_id || 'esportsignite@okaxis',
        upiQrUrl: settings.upi_qr_url || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=esportsignite@okaxis&pn=IgniteEsports&cu=INR',
        minDeposit: parseFloat(settings.min_deposit || '50'),
        maxDeposit: parseFloat(settings.max_deposit || '10000'),
        minCashout: parseFloat(settings.min_cashout || '100'),
        cashoutFeePercent: parseFloat(settings.cashout_fee_percent || '2'),
        isRealMoneyEnabled: settings.is_real_money_enabled === 'true',
        currencySymbol: settings.currency_symbol || '₹'
      }
    });
  } catch (error) {
    console.error('Wallet summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve wallet information' });
  }
});

// SUBMIT ADD MONEY / DEPOSIT REQUEST (REQUIRES MANUAL ADMIN APPROVAL)
router.post('/deposit', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod, transactionId, proofImage } = req.body;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid deposit amount.' });
    }

    // Check min / max settings
    const minDepRow = db.prepare("SELECT value FROM platform_settings WHERE key = 'min_deposit'").get();
    const maxDepRow = db.prepare("SELECT value FROM platform_settings WHERE key = 'max_deposit'").get();
    const minDep = minDepRow ? parseFloat(minDepRow.value) : 50;
    const maxDep = maxDepRow ? parseFloat(maxDepRow.value) : 10000;

    if (numAmount < minDep) {
      return res.status(400).json({ error: `Minimum deposit amount is ₹${minDep}.` });
    }
    if (numAmount > maxDep) {
      return res.status(400).json({ error: `Maximum deposit per request is ₹${maxDep}.` });
    }

    if (!transactionId || transactionId.trim().length < 6) {
      return res.status(400).json({ error: 'Please provide a valid UTR / Payment Transaction ID.' });
    }

    const cleanUtr = transactionId.trim();

    // Check if this UTR has already been submitted
    const existingReq = db.prepare('SELECT id, status FROM deposit_requests WHERE transaction_id = ?').get(cleanUtr);
    if (existingReq) {
      return res.status(400).json({ error: `This UTR (${cleanUtr}) has already been submitted (Status: ${existingReq.status.toUpperCase()}).` });
    }

    const requestId = uuidv4();
    db.prepare(`
      INSERT INTO deposit_requests (id, user_id, amount, payment_method, transaction_id, proof_image, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(requestId, userId, numAmount, paymentMethod || 'upi', cleanUtr, proofImage || null);

    // Create Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
      VALUES (?, ?, ?, ?, 'deposit', 0, '/wallet')
    `).run(
      uuidv4(),
      userId,
      '⏳ Deposit Request Submitted',
      `Your deposit of ₹${numAmount.toFixed(2)} (UTR: ${cleanUtr}) has been submitted and is currently pending verification by our finance team.`
    );

    res.status(201).json({
      message: 'Deposit request submitted successfully! Your wallet will be credited once verified by the admin.',
      deposit: {
        id: requestId,
        amount: numAmount,
        transactionId: cleanUtr,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ error: 'Failed to submit deposit request.' });
  }
});

// SUBMIT CASHOUT / WITHDRAWAL REQUEST
router.post('/cashout', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, payoutIdentifier, accountName } = req.body;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid cashout amount.' });
    }

    if (!payoutIdentifier || payoutIdentifier.trim().length < 5) {
      return res.status(400).json({ error: 'Please enter a valid UPI ID or Bank Account.' });
    }

    if (!accountName || accountName.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter the registered account holder name.' });
    }

    // ATOMIC CASHOUT REQUEST TRANSACTION
    const cashoutTx = db.transaction(() => {
      const user = db.prepare('SELECT wallet_balance, pending_balance FROM users WHERE id = ?').get(userId);

      const minCashRow = db.prepare("SELECT value FROM platform_settings WHERE key = 'min_cashout'").get();
      const feeRow = db.prepare("SELECT value FROM platform_settings WHERE key = 'cashout_fee_percent'").get();
      const minCash = minCashRow ? parseFloat(minCashRow.value) : 100;
      const feePercent = feeRow ? parseFloat(feeRow.value) : 2;

      if (numAmount < minCash) {
        throw new Error(`Minimum withdrawal amount is ₹${minCash}.`);
      }

      if (user.wallet_balance < numAmount) {
        throw new Error(`Insufficient available balance. Available: ₹${user.wallet_balance.toFixed(2)}, Requested: ₹${numAmount.toFixed(2)}`);
      }

      const feeAmount = (numAmount * feePercent) / 100;
      const netAmount = numAmount - feeAmount;

      // Deduct from available balance and lock in pending balance
      const newAvailable = user.wallet_balance - numAmount;
      const newPending = (user.pending_balance || 0) + numAmount;

      db.prepare("UPDATE users SET wallet_balance = ?, pending_balance = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newAvailable, newPending, userId);

      const requestId = uuidv4();
      db.prepare(`
        INSERT INTO cashout_requests (id, user_id, amount, fee_amount, net_amount, payout_identifier, account_name, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(requestId, userId, numAmount, feeAmount, netAmount, payoutIdentifier.trim(), accountName.trim());

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
        VALUES (?, ?, ?, ?, 'cashout', 0, '/wallet')
      `).run(
        uuidv4(),
        userId,
        '⏳ Cashout Request Placed',
        `Your withdrawal request for ₹${numAmount.toFixed(2)} (Net: ₹${netAmount.toFixed(2)}) is being processed. Funds are reserved.`
      );

      return {
        requestId,
        newAvailable,
        newPending,
        netAmount,
        feeAmount
      };
    });

    const result = cashoutTx();

    res.status(201).json({
      message: 'Cashout request placed successfully. Admin will process your payout.',
      availableBalance: result.newAvailable,
      pendingBalance: result.newPending,
      netAmount: result.netAmount
    });
  } catch (error) {
    console.error('Cashout error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to place cashout request' });
  }
});

// GET USER'S DEPOSITS AND CASHOUTS LIST
router.get('/requests', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const deposits = db.prepare('SELECT * FROM deposit_requests WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    const cashouts = db.prepare('SELECT * FROM cashout_requests WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    res.json({ deposits, cashouts });
  } catch (error) {
    console.error('Wallet requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve deposit and cashout requests' });
  }
});

// GET IMMUTABLE TRANSACTION HISTORY WITH FILTERING & SEARCH
router.get('/transactions', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { type, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (description LIKE ? OR reference_id LIKE ? OR id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const transactions = db.prepare(query).all(...params);

    const totalCountQuery = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?' + (type && type !== 'all' ? ' AND type = ?' : '');
    const countParams = type && type !== 'all' ? [userId, type] : [userId];
    const totalCount = db.prepare(totalCountQuery).get(...countParams).count;

    res.json({
      transactions,
      total: totalCount,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

export default router;

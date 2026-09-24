import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET PUBLIC PLATFORM SETTINGS & LEGAL POLICIES
router.get('/public', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM platform_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });

    res.json({
      platformName: settings.platform_name || 'IGNITE FREE FIRE ESPORTS',
      currencySymbol: settings.currency_symbol || '₹',
      contactEmail: settings.contact_email || 'support@ignite-esports.gg',
      supportPhone: settings.support_phone || '+91 8000-FF-PRO',
      upiId: settings.upi_id || 'esportsignite@okaxis',
      upiQrUrl: settings.upi_qr_url || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=esportsignite@okaxis&pn=IgniteEsports&cu=INR',
      minDeposit: parseFloat(settings.min_deposit || '50'),
      maxDeposit: parseFloat(settings.max_deposit || '10000'),
      minCashout: parseFloat(settings.min_cashout || '100'),
      cashoutFeePercent: parseFloat(settings.cashout_fee_percent || '2'),
      isRealMoneyEnabled: settings.is_real_money_enabled === 'true',
      responsibleGaming: settings.responsible_gaming_info || 'Skill-based competitive esports for eligible players aged 18+.',
      fairPlayRules: settings.fair_play_rules || '1. No emulators unless explicitly allowed.\n2. No third party tools, aimbots, or injectors.\n3. Room ID & Password released before start.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public settings' });
  }
});

export default router;

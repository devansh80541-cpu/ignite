import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

export async function seedDatabase() {
  await initDatabase();

  const result = await db.prepare('SELECT COUNT(*) as count FROM users').get();
  const userCount = result.count;
  if (userCount > 0) {
    console.log('Database already populated. Skipping seed.');
    return;
  }

  console.log('Seeding fresh database with admin account and platform settings...');

  const adminPasswordHash = await bcrypt.hash('IgniteXsolofx7', 10);

  // Admin account only — zero balance, no demo data
  await db.prepare(`
    INSERT INTO users (id, name, username, email, password_hash, phone, free_fire_uid, in_game_name, wallet_balance, pending_balance, role, is_banned, must_change_password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'admin-001',
    'Platform Administrator',
    'Igniteesports',
    'admin@fftournaments.pro',
    adminPasswordHash,
    '+91 9876543210',
    'FF-ADMIN-999',
    '👑 SERVER_ADMIN',
    0.00,
    0.00,
    'admin',
    0,
    1
  );

  // Platform Settings
  const settings = [
    ['platform_name', 'IGNITE FREE FIRE ESPORTS'],
    ['currency_symbol', '₹'],
    ['contact_email', 'support@ignite-esports.gg'],
    ['support_phone', '+91 8000-FF-PRO'],
    ['upi_id', 'esportsignite@okaxis'],
    ['upi_qr_url', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=esportsignite@okaxis&pn=IgniteEsports&cu=INR'],
    ['min_deposit', '50'],
    ['max_deposit', '10000'],
    ['min_cashout', '100'],
    ['cashout_fee_percent', '2'],
    ['is_real_money_enabled', 'true'],
    ['default_scoring_rules', JSON.stringify({
      rankPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
      killPoints: 1
    })],
    ['responsible_gaming_info', 'Play responsibly. Players must be 18+ and adhere to local skill gaming regulations.'],
    ['fair_play_rules', '1. No emulators unless explicitly allowed in tournament title.\n2. No third-party scripts, crosshairs, or hacks. Violation results in permanent ban and prize forfeit.\n3. Room ID & Password will be released 15 minutes before match start.\n4. Screen recording is recommended in case of disputes.']
  ];

  for (const [key, val] of settings) {
    await db.prepare(`INSERT INTO platform_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`).run(key, val);
  }

  console.log('✅ Fresh database ready! Admin account created. No demo data.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

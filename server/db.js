import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tournament.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance and concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      free_fire_uid TEXT,
      in_game_name TEXT,
      avatar TEXT,
      wallet_balance REAL DEFAULT 0.00,
      pending_balance REAL DEFAULT 0.00,
      role TEXT DEFAULT 'player', -- 'player' or 'admin'
      is_banned INTEGER DEFAULT 0,
      total_earnings REAL DEFAULT 0.00,
      total_wins INTEGER DEFAULT 0,
      total_matches INTEGER DEFAULT 0,
      total_kills INTEGER DEFAULT 0,
      must_change_password INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- TOURNAMENTS TABLE
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mode TEXT NOT NULL, -- 'battle_royale', 'clash_squad', 'lone_wolf'
      team_size INTEGER DEFAULT 1, -- 1 for solo/LW, 2 for duo, 4 for squad
      entry_fee REAL DEFAULT 0.00,
      prize_pool REAL DEFAULT 0.00,
      first_prize REAL DEFAULT 0.00,
      second_prize REAL DEFAULT 0.00,
      third_prize REAL DEFAULT 0.00,
      kill_bounty REAL DEFAULT 0.00,
      max_slots INTEGER DEFAULT 50,
      filled_slots INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      registration_deadline TEXT,
      map TEXT DEFAULT 'Bermuda', -- 'Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nexterra'
      rules TEXT,
      scoring_rules TEXT, -- JSON string for placement points & kill points
      room_id TEXT DEFAULT '',
      room_password TEXT DEFAULT '',
      room_release_time TEXT,
      is_room_released INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open', -- 'draft', 'open', 'full', 'live', 'completed', 'cancelled'
      banner_img TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- TOURNAMENT REGISTRATIONS TABLE
    CREATE TABLE IF NOT EXISTS tournament_registrations (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      slot_number INTEGER NOT NULL,
      team_id TEXT,
      team_name TEXT,
      player_ff_uid TEXT,
      player_ign TEXT,
      entry_fee_paid REAL DEFAULT 0.00,
      payment_transaction_id TEXT,
      status TEXT DEFAULT 'registered', -- 'registered', 'cancelled', 'refunded'
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(tournament_id, slot_number),
      UNIQUE(tournament_id, user_id)
    );

    -- TEAMS TABLE
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      name TEXT NOT NULL,
      captain_id TEXT NOT NULL,
      team_size INTEGER DEFAULT 4,
      members_json TEXT, -- JSON array of {ign, ff_uid, user_id}
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- FINANCIAL TRANSACTIONS LEDGER (IMMUTABLE)
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'deposit', 'tournament_entry', 'prize_credit', 'cashout', 'refund', 'admin_adjustment'
      amount REAL NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      reference_id TEXT,
      status TEXT DEFAULT 'completed', -- 'completed', 'pending', 'reversed'
      description TEXT NOT NULL,
      admin_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- DEPOSIT REQUESTS TABLE (ADMIN APPROVAL REQUIRED)
    CREATE TABLE IF NOT EXISTS deposit_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'upi', -- 'upi', 'qr', 'bank'
      transaction_id TEXT NOT NULL, -- UTR / Payment Ref
      proof_image TEXT,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      rejection_reason TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- CASHOUT REQUESTS TABLE (ADMIN APPROVAL REQUIRED)
    CREATE TABLE IF NOT EXISTS cashout_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      fee_amount REAL DEFAULT 0.00,
      net_amount REAL NOT NULL,
      payout_identifier TEXT NOT NULL, -- UPI ID or Bank details
      account_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'paid', 'rejected'
      admin_note TEXT,
      transaction_reference TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- MATCHES TABLE
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      match_number INTEGER DEFAULT 1,
      round_name TEXT DEFAULT 'Round 1',
      room_id TEXT,
      password TEXT,
      release_time TEXT,
      is_released INTEGER DEFAULT 0,
      status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed'
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );

    -- RESULTS TABLE
    CREATE TABLE IF NOT EXISTS match_results (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      match_id TEXT,
      user_id TEXT,
      team_id TEXT,
      player_name TEXT NOT NULL,
      player_ff_uid TEXT,
      position INTEGER,
      kills INTEGER DEFAULT 0,
      placement_points INTEGER DEFAULT 0,
      kill_points INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      prize_amount REAL DEFAULT 0.00,
      is_prize_credited INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );

    -- NOTIFICATIONS TABLE
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system', -- 'deposit', 'cashout', 'tournament', 'match', 'prize', 'system'
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- SUPPORT TICKETS TABLE
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT DEFAULT 'general', -- 'payment', 'tournament', 'fairplay', 'account', 'other'
      description TEXT NOT NULL,
      attachment TEXT,
      status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
      admin_reply TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ADMIN AUDIT LOGS TABLE
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      admin_username TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- PLATFORM SETTINGS TABLE (KEY-VALUE)
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export default db;

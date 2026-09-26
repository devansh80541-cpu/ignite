import pg from 'pg';

const { Pool } = pg;

// Use DATABASE_URL from Render's PostgreSQL, fallback for local dev
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Helper: Convert SQLite ? placeholders to PostgreSQL $1, $2, ... 
// Also convert datetime('now') to NOW() and other SQLite-isms
function convertSQL(sql) {
  let idx = 0;
  let converted = sql
    .replace(/datetime\('now'\)/gi, 'NOW()')
    .replace(/INTEGER DEFAULT 0/gi, 'INTEGER DEFAULT 0')
    .replace(/REAL DEFAULT/gi, 'DOUBLE PRECISION DEFAULT')
    .replace(/\?/g, () => `$${++idx}`);
  return { sql: converted, paramCount: idx };
}

// Wrapper that mimics better-sqlite3's synchronous .prepare().run/.get/.all API
// but uses async pg under the hood. Since Express route handlers can be async, 
// we make these methods return sync-looking results via a proxy pattern.
// ACTUALLY: we use a simpler approach - make the db object return chainable promises.

const db = {
  prepare(rawSql) {
    const { sql } = convertSQL(rawSql);
    return {
      run(...params) {
        return pool.query(sql, params).then(res => ({
          changes: res.rowCount,
          lastInsertRowid: null
        }));
      },
      get(...params) {
        return pool.query(sql, params).then(res => res.rows[0] || null);
      },
      all(...params) {
        return pool.query(sql, params).then(res => res.rows);
      }
    };
  },
  
  // Transaction support
  transaction(fn) {
    return async (...args) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Create a transaction-scoped db proxy
        const txDb = {
          prepare(rawSql) {
            const { sql } = convertSQL(rawSql);
            return {
              async run(...params) {
                const res = await client.query(sql, params);
                return { changes: res.rowCount, lastInsertRowid: null };
              },
              async get(...params) {
                const res = await client.query(sql, params);
                return res.rows[0] || null;
              },
              async all(...params) {
                const res = await client.query(sql, params);
                return res.rows;
              }
            };
          }
        };
        
        const result = await fn(txDb, ...args);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    };
  },

  // Direct query for schema operations
  async exec(sql) {
    await pool.query(sql);
  },

  // For direct queries
  async query(sql, params = []) {
    const result = await pool.query(sql, params);
    return result;
  }
};

export async function initDatabase() {
  // PostgreSQL requires each statement to be run separately
  // (no multi-statement support in pg driver by default)

  await pool.query(`
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
      wallet_balance DOUBLE PRECISION DEFAULT 0.00,
      pending_balance DOUBLE PRECISION DEFAULT 0.00,
      role TEXT DEFAULT 'player',
      is_banned INTEGER DEFAULT 0,
      total_earnings DOUBLE PRECISION DEFAULT 0.00,
      total_wins INTEGER DEFAULT 0,
      total_matches INTEGER DEFAULT 0,
      total_kills INTEGER DEFAULT 0,
      must_change_password INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mode TEXT NOT NULL,
      team_size INTEGER DEFAULT 1,
      entry_fee DOUBLE PRECISION DEFAULT 0.00,
      prize_pool DOUBLE PRECISION DEFAULT 0.00,
      first_prize DOUBLE PRECISION DEFAULT 0.00,
      second_prize DOUBLE PRECISION DEFAULT 0.00,
      third_prize DOUBLE PRECISION DEFAULT 0.00,
      kill_bounty DOUBLE PRECISION DEFAULT 0.00,
      max_slots INTEGER DEFAULT 50,
      filled_slots INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      registration_deadline TEXT,
      map TEXT DEFAULT 'Bermuda',
      rules TEXT,
      scoring_rules TEXT,
      room_id TEXT DEFAULT '',
      room_password TEXT DEFAULT '',
      room_release_time TEXT,
      is_room_released INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open',
      banner_img TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournament_registrations (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slot_number INTEGER NOT NULL,
      team_id TEXT,
      team_name TEXT,
      player_ff_uid TEXT,
      player_ign TEXT,
      entry_fee_paid DOUBLE PRECISION DEFAULT 0.00,
      payment_transaction_id TEXT,
      status TEXT DEFAULT 'registered',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tournament_id, slot_number),
      UNIQUE(tournament_id, user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      captain_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      team_size INTEGER DEFAULT 4,
      members_json TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      balance_before DOUBLE PRECISION NOT NULL,
      balance_after DOUBLE PRECISION NOT NULL,
      reference_id TEXT,
      status TEXT DEFAULT 'completed',
      description TEXT NOT NULL,
      admin_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS deposit_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL,
      payment_method TEXT DEFAULT 'upi',
      transaction_id TEXT NOT NULL,
      proof_image TEXT,
      status TEXT DEFAULT 'pending',
      rejection_reason TEXT,
      reviewed_by TEXT,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cashout_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL,
      fee_amount DOUBLE PRECISION DEFAULT 0.00,
      net_amount DOUBLE PRECISION NOT NULL,
      payout_identifier TEXT NOT NULL,
      account_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      admin_note TEXT,
      transaction_reference TEXT,
      reviewed_by TEXT,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      match_number INTEGER DEFAULT 1,
      round_name TEXT DEFAULT 'Round 1',
      room_id TEXT,
      password TEXT,
      release_time TEXT,
      is_released INTEGER DEFAULT 0,
      status TEXT DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS match_results (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
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
      prize_amount DOUBLE PRECISION DEFAULT 0.00,
      is_prize_credited INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      description TEXT NOT NULL,
      attachment TEXT,
      status TEXT DEFAULT 'open',
      admin_reply TEXT,
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      admin_username TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export default db;

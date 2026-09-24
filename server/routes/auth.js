import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { generateToken, authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// PLAYER SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, username, email, password, phone, free_fire_uid, in_game_name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'Name, username, email, and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      if (existing.username === cleanUsername) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;

    db.prepare(`
      INSERT INTO users (id, name, username, email, password_hash, phone, free_fire_uid, in_game_name, avatar, wallet_balance, pending_balance, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 'player')
    `).run(userId, name.trim(), cleanUsername, cleanEmail, password_hash, phone || '', free_fire_uid || '', in_game_name || cleanUsername, avatar);

    // Initial welcome notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
      VALUES (?, ?, ?, ?, 'system', 0, ?)
    `).run(uuidv4(), userId, 'Welcome to Ignite Esports! 🔥', 'Your account is ready. Add your Free Fire UID and enter your first tournament.', '/profile');

    const newUser = db.prepare('SELECT id, name, username, email, phone, free_fire_uid, in_game_name, avatar, wallet_balance, pending_balance, role, total_earnings, total_wins, total_matches, total_kills, created_at FROM users WHERE id = ?').get(userId);
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// PLAYER LOGIN
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // username or email

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(cleanIdentifier, cleanIdentifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been banned. Please contact platform support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ADMIN DEDICATED LOGIN (/admin/login)
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Admin username and password are required.' });
    }

    const cleanUsername = username.trim();
    const adminUser = db.prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'").get(cleanUsername);

    if (!adminUser) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    const isMatch = await bcrypt.compare(password, adminUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    // Log admin login
    db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, admin_username, action, entity_type, entity_id, details_json, ip_address)
      VALUES (?, ?, ?, 'ADMIN_LOGIN', 'SESSION', ?, ?, ?)
    `).run(uuidv4(), adminUser.id, adminUser.username, adminUser.id, JSON.stringify({ time: new Date().toISOString() }), req.ip || '127.0.0.1');

    const token = generateToken(adminUser);
    const { password_hash, ...safeAdmin } = adminUser;

    res.json({
      message: 'Administrator authenticated successfully',
      token,
      user: safeAdmin,
      mustChangePassword: !!adminUser.must_change_password
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin authentication failed.' });
  }
});

// GET CURRENT USER PROFILE
router.get('/me', authenticateToken, (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// UPDATE PROFILE
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, free_fire_uid, in_game_name, avatar } = req.body;
    const userId = req.user.id;

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          free_fire_uid = COALESCE(?, free_fire_uid),
          in_game_name = COALESCE(?, in_game_name),
          avatar = COALESCE(?, avatar),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name || null, phone || null, free_fire_uid || null, in_game_name || null, avatar || null, userId);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const { password_hash, ...safeUser } = updated;

    res.json({ message: 'Profile updated successfully', user: safeUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// CHANGE PASSWORD (Supports both Player & Admin force change)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    if (!user.must_change_password) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 0, updated_at = datetime('now')
      WHERE id = ?
    `).run(newHash, user.id);

    if (user.role === 'admin') {
      db.prepare(`
        INSERT INTO admin_audit_logs (id, admin_id, admin_username, action, entity_type, entity_id, details_json)
        VALUES (?, ?, ?, 'ADMIN_PASSWORD_CHANGED', 'USER', ?, ?)
      `).run(uuidv4(), user.id, user.username, user.id, JSON.stringify({ message: 'Admin updated their master password' }));
    }

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

export default router;

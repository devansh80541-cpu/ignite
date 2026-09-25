import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET MY TICKETS
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await db.prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json({ tickets });
  } catch (error) {
    console.error('Support tickets fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// SUBMIT NEW TICKET
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, category, description, attachment } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required.' });
    }

    const ticketId = `TICK-${uuidv4().substring(0, 8).toUpperCase()}`;
    await db.prepare(`
      INSERT INTO support_tickets (id, user_id, subject, category, description, attachment, status)
      VALUES (?, ?, ?, ?, ?, ?, 'open')
    `).run(ticketId, userId, subject.trim(), category || 'general', description.trim(), attachment || null);

    res.status(201).json({
      message: 'Support ticket submitted successfully. Our team will review and reply promptly.',
      ticketId
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

export default router;

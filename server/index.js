import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';

import authRoutes from './routes/auth.js';
import tournamentRoutes from './routes/tournaments.js';
import walletRoutes from './routes/wallet.js';
import leaderboardRoutes from './routes/leaderboard.js';
import notificationRoutes from './routes/notifications.js';
import supportRoutes from './routes/support.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && !req.path.startsWith('/static')) {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API Server is running. In development, open the Vite dev server at http://localhost:5173');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize Database, Seed, then Start Server
async function boot() {
  try {
    await initDatabase();
    console.log('✅ PostgreSQL database initialized');
  } catch (err) {
    console.error('❌ FATAL: Database initialization failed:', err.message);
    process.exit(1);
  }

  try {
    await seedDatabase();
    console.log('✅ Database seeded');
  } catch (err) {
    console.error('⚠️ Seed warning (non-fatal):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 IGNITE ESPORTS BACKEND RUNNING ON PORT: ${PORT}`);
    console.log(`👑 ADMIN LOGIN: /admin/login (User: Igniteesports)`);
    console.log(`🎮 API ENDPOINT: http://localhost:${PORT}/api`);
    console.log(`=================================================\n`);
  });
}

boot();


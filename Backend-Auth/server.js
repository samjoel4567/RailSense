import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rail_sense_auth';


// ── Middlewares ──────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for audit trails
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[RAIL//AI AUTH] ${timestamp} | ${req.method} ${req.originalUrl}`);
  next();
});

// ── Health Check ─────────────────────────────────────────
app.get(['/', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'RAIL//AI Operator Authentication Service',
    version: '1.0.0',
    compliance: 'SIL-4',
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

// ── Mount Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found on authentication server.`
  });
});

// ── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[RAIL//AI Auth Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ── Database Connection & Server Boot ────────────────────
async function startServer() {
  try {
    console.log('[RAIL//AI] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[RAIL//AI] ✓ Connected to MongoDB at ${MONGO_URI.split('@').pop()}`);
  } catch (err) {
    console.warn(`[RAIL//AI] ⚠ MongoDB connection failed (${err.message}).`);
    console.warn('[RAIL//AI] Note: Server will start, but MongoDB is required for persistent database operations.');
  }

  app.listen(PORT, () => {
    console.log(`[RAIL//AI] 🚀 Authentication Microservice running on http://localhost:${PORT}`);
    console.log(`[RAIL//AI] Endpoints mounted:`);
    console.log(`          POST http://localhost:${PORT}/api/auth/signup`);
    console.log(`          POST http://localhost:${PORT}/api/auth/login`);
    console.log(`          POST http://localhost:${PORT}/api/auth/logout`);
    console.log(`          GET  http://localhost:${PORT}/api/auth/me`);
  });
}

startServer();

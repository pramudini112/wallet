require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const connectDB = require('./config/db');

// ── Routes ──────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const aiRoutes          = require('./routes/ai');
const profileRoutes     = require('./routes/profile');

// ── Connect to MongoDB ───────────────────────────────────────
connectDB();

// ── Express App ─────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/profile',      profileRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT} (accessible on LAN)`);
});

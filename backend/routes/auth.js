const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return sendError(res, 400, 'Name, email and password are required.');

    if (password.length < 6)
      return sendError(res, 400, 'Password must be at least 6 characters.');

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return sendError(res, 409, 'An account with this email already exists.');

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      success : true,
      message : 'Account created successfully.',
      token,
      user    : { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return sendError(res, 400, 'Email and password are required.');

    // Re-select password (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
    if (!user)
      return sendError(res, 401, 'Invalid email or password.');

    // Check if account is currently locked
    if (user.isLocked) {
      const lockRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return sendError(res, 429, `Account is temporarily locked. Please try again in ${lockRemaining} minute(s).`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        // Lock for 15 minutes
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }
      await user.save({ validateBeforeSave: false });
      return sendError(res, 401, 'Invalid email or password.');
    }

    // Reset login attempts & update last login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    res.status(200).json({
      success : true,
      message : 'Logged in successfully.',
      token,
      user    : { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
// Validate JWT and return current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return sendError(res, 401, 'No authorization token provided.');

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return sendError(res, 401, 'Invalid or expired token.');
    }

    const user = await User.findById(payload.id);
    if (!user) return sendError(res, 401, 'Invalid token.');

    res.status(200).json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error('/auth/me error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

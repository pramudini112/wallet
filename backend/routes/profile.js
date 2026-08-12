const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ── GET /api/profile ──────────────────────────────────────────────────────────
// Get current user's profile
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        vision: user.vision,
        university: user.university,
        studentId: user.studentId,
        yearOfStudy: user.yearOfStudy,
        currency: user.currency,
        monthlyAllowance: user.monthlyAllowance,
        dailyLimit: user.dailyLimit,
        budgetLimits: user.budgetLimits,
        healthScore: user.healthScore,
        notifications: user.notifications,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// ── PUT /api/profile ──────────────────────────────────────────────────────────
// Update current user's profile
router.put('/', async (req, res) => {
  try {
    const allowedFields = [
      'name', 'profilePicture', 'vision', 'university', 'studentId',
      'yearOfStudy', 'currency', 'monthlyAllowance', 'dailyLimit',
      'budgetLimits', 'notifications',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        vision: user.vision,
        university: user.university,
        studentId: user.studentId,
        yearOfStudy: user.yearOfStudy,
        currency: user.currency,
        monthlyAllowance: user.monthlyAllowance,
        dailyLimit: user.dailyLimit,
        budgetLimits: user.budgetLimits,
        healthScore: user.healthScore,
        notifications: user.notifications,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;

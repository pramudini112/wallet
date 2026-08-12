const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Gather user's financial context for personalized advice
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [recentTransactions, categoryBreakdown] = await Promise.all([
      Transaction.find({ userId: req.user._id, isDeleted: false })
        .sort({ date: -1 })
        .limit(10)
        .lean(),
      Transaction.spendingByCategory(req.user._id, startOfMonth, now),
    ]);

    const context = {
      userName: req.user.name,
      monthlyAllowance: req.user.monthlyAllowance,
      currency: req.user.currency || 'LKR',
      recentTransactions: recentTransactions.map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
      })),
      categoryBreakdown,
    };

    const reply = await aiService.chatWithAdvisor(message, context);
    res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: 'AI service error.', error: error.message });
  }
});

router.post('/categorize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required.' });
    }

    const categoryData = await aiService.categorizeExpense(text);
    res.status(200).json({ success: true, data: categoryData });
  } catch (error) {
    console.error('AI categorize error:', error);
    res.status(500).json({ success: false, message: 'AI service error.', error: error.message });
  }
});

module.exports = router;

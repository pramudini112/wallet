const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ── GET /api/transactions ─────────────────────────────────────────────────────
// Fetch user's transactions with optional filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = { userId: req.user._id, isDeleted: false };

    if (category) query.category = category;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

// ── GET /api/transactions/summary ─────────────────────────────────────────────
// Dashboard summary: balance, total spent this month, daily spent, category breakdown
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    // Date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Total income all time
    const incomeResult = await Transaction.aggregate([
      { $match: { userId, type: 'income', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalIncome = incomeResult[0]?.total || 0;

    // Total expense all time
    const expenseResult = await Transaction.aggregate([
      { $match: { userId, type: 'expense', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpense = expenseResult[0]?.total || 0;

    // Monthly spending
    const monthlyResult = await Transaction.totalSpent(userId, startOfMonth, now);
    const monthlySpent = monthlyResult[0]?.total || 0;

    // Daily spending
    const dailyResult = await Transaction.totalSpent(userId, startOfDay, endOfDay);
    const dailySpent = dailyResult[0]?.total || 0;

    // Category breakdown this month
    const categoryBreakdown = await Transaction.spendingByCategory(userId, startOfMonth, now);

    // Dynamic Health Score Calculation
    let healthScore = req.user.healthScore || 100;
    const allowance = req.user.monthlyAllowance || 0;
    
    if (allowance > 0) {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      
      const expectedSpendRatio = currentDay / daysInMonth;
      const actualSpendRatio = monthlySpent / allowance;
      
      if (actualSpendRatio <= expectedSpendRatio) {
        // If they are on track or under budget, they still lose a few points as they spend 
        // (to give visual feedback), mapping 0% spend -> 100 score, expected spend -> 85 score.
        const onTrackPenalty = (actualSpendRatio / expectedSpendRatio) * 15;
        healthScore = Math.max(85, Math.floor(100 - onTrackPenalty));
      } else {
        // Penalty of 100 points for every 50% they are over the expected ratio
        const diff = actualSpendRatio - expectedSpendRatio;
        const penalty = 15 + Math.floor(diff * 200); // Start at 85 and drop fast
        healthScore = Math.max(0, 100 - penalty);
      }
    } else if (monthlySpent > 0) {
       // If no allowance is set but they are spending, slight penalty to encourage setting a budget
       healthScore = 80;
    }

    // Balance = monthlyAllowance + total income - total expense
    // Or simply total income - total expense
    const balance = (req.user.monthlyAllowance || 0) + totalIncome - totalExpense;

    res.status(200).json({
      success: true,
      data: {
        balance,
        monthlyAllowance: req.user.monthlyAllowance || 0,
        totalIncome,
        totalExpense,
        monthlySpent,
        dailySpent,
        dailyLimit: req.user.dailyLimit || 0,
        healthScore,
        categoryBreakdown,
      },
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch summary.' });
  }
});

// ── POST /api/transactions ────────────────────────────────────────────────────
// Create a new transaction
router.post('/', async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      subcategory,
      description,
      date,
      paymentMethod,
      source,
      tags,
    } = req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Type and amount are required.',
      });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount,
      currency: req.user.currency || 'LKR',
      category: category || 'other',
      subcategory,
      description,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'cash',
      source: source || 'manual',
      tags: tags || [],
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully.',
      data: transaction,
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ success: false, message: 'Failed to create transaction.' });
  }
});

// ── PUT /api/transactions/:id ─────────────────────────────────────────────────
// Update a transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    const allowedFields = [
      'type', 'amount', 'category', 'subcategory',
      'description', 'date', 'paymentMethod', 'tags',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        transaction[field] = req.body[field];
      }
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated.',
      data: transaction,
    });
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ success: false, message: 'Failed to update transaction.' });
  }
});

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────
// Soft-delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted.',
    });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete transaction.' });
  }
});

module.exports = router;

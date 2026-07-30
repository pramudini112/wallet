const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await aiService.chatWithAdvisor(message);
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categorize', async (req, res) => {
  try {
    const { text } = req.body;
    const categoryData = await aiService.categorizeExpense(text);
    res.status(200).json(categoryData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

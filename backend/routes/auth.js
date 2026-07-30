const express = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
  res.status(201).json({ message: 'User registered' });
});

router.post('/login', async (req, res) => {
  res.status(200).json({ token: 'mock-jwt-token' });
});

module.exports = router;

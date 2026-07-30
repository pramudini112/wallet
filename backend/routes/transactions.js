const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.status(200).json([]);
});

router.post('/', async (req, res) => {
  res.status(201).json({ message: 'Transaction created' });
});

module.exports = router;

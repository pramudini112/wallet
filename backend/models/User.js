const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  monthlyIncome: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  budgetLimits: { type: Map, of: Number, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

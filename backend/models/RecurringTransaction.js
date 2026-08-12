const mongoose = require('mongoose');

/**
 * RecurringTransaction – template for auto-generated transactions
 * e.g. "Monthly allowance from parents", "Weekly bus pass"
 */
const recurringSchema = new mongoose.Schema({
  // ── Ownership ─────────────────────────────────────────
  userId       : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // ── Template Fields ───────────────────────────────────
  name         : { type: String, required: true, trim: true, maxlength: 120 },
  type         : { type: String, enum: ['income', 'expense'], required: true },
  amount       : { type: Number, required: true, min: 0.01 },
  category     : { type: String, required: true },
  description  : { type: String, trim: true, maxlength: 255 },
  paymentMethod: { type: String, enum: ['cash', 'mobile_wallet', 'bank_transfer', 'card', 'other'], default: 'cash' },

  // ── Schedule ──────────────────────────────────────────
  frequency    : {
    type   : String,
    enum   : ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    required: true,
  },
  startDate    : { type: Date, required: true },
  endDate      : { type: Date },                     // null = runs forever
  nextRunDate  : { type: Date, required: true },     // when to create next transaction
  lastRunDate  : { type: Date },

  // ── Control ───────────────────────────────────────────
  isActive     : { type: Boolean, default: true, index: true },
  runCount     : { type: Number, default: 0 },       // how many times executed

}, { timestamps: true });

recurringSchema.index({ nextRunDate: 1, isActive: 1 });  // for cron jobs

module.exports = mongoose.model('RecurringTransaction', recurringSchema);

const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  // ── Ownership ─────────────────────────────────────────
  userId          : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // ── Goal Details ──────────────────────────────────────
  name            : { type: String, required: true, trim: true, maxlength: 120 },
  description     : { type: String, trim: true, maxlength: 500 },
  emoji           : { type: String, default: '🎯', maxlength: 4 },   // display icon

  // ── Financial ─────────────────────────────────────────
  targetAmount    : { type: Number, required: true, min: 1 },
  currentProgress : { type: Number, default: 0, min: 0 },
  currency        : { type: String, default: 'LKR', uppercase: true, maxlength: 3 },

  // ── Timeline ──────────────────────────────────────────
  startDate       : { type: Date, default: Date.now },
  deadline        : { type: Date, required: true },

  // ── Auto-save rule (optional) ─────────────────────────
  autoSaveAmount  : { type: Number, default: 0, min: 0 },   // amount to auto-save
  autoSavePeriod  : { type: String, enum: ['daily', 'weekly', 'monthly', 'none'], default: 'none' },

  // ── Status ────────────────────────────────────────────
  status          : {
    type   : String,
    enum   : ['active', 'completed', 'paused', 'cancelled'],
    default: 'active',
    index  : true,
  },
  completedAt     : { type: Date },

  // ── Category link (what is it for?) ──────────────────
  category        : {
    type   : String,
    enum   : ['education', 'travel', 'gadget', 'emergency', 'clothing', 'event', 'other'],
    default: 'other',
  },

  // ── Linked transactions (deposits toward this goal) ───
  contributions   : [{
    transactionId : { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    amount        : { type: Number, required: true },
    date          : { type: Date, default: Date.now },
    note          : { type: String, trim: true, maxlength: 255 },
    _id           : false,
  }],

}, { timestamps: true });

/* ── Indexes ── */
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, deadline: 1 });

/* ── Virtual: percentage complete ── */
goalSchema.virtual('progressPercent').get(function () {
  if (this.targetAmount === 0) return 0;
  return Math.min(Math.round((this.currentProgress / this.targetAmount) * 100), 100);
});

/* ── Virtual: days remaining ── */
goalSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const diff = this.deadline - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

/* ── Auto-mark complete when progress >= target ── */
goalSchema.pre('save', function (next) {
  if (this.currentProgress >= this.targetAmount && this.status === 'active') {
    this.status      = 'completed';
    this.completedAt = new Date();
  }
  next();
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);

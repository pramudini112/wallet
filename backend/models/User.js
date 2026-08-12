const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/* ── Budget Limit sub-schema ── */
const budgetLimitSchema = new mongoose.Schema({
  category : { type: String, required: true },
  amount   : { type: Number, required: true, min: 0 },
  period   : { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
}, { _id: false });

/* ── Notification Preferences sub-schema ── */
const notifPrefSchema = new mongoose.Schema({
  budgetAlerts  : { type: Boolean, default: true },  // alert when near limit
  weeklyReport  : { type: Boolean, default: true },  // weekly summary
  aiTips        : { type: Boolean, default: true },  // AI finance tips
  goalReminders : { type: Boolean, default: true },  // goal deadline reminders
}, { _id: false });

/* ── Main User Schema ── */
const userSchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────
  name            : { type: String, required: true, trim: true, maxlength: 100 },
  email           : { type: String, required: true, unique: true, lowercase: true, trim: true },
  password        : { type: String, required: true, minlength: 6, select: false },
  profilePicture  : { type: String, default: '' },
  vision          : { type: String, default: '', trim: true, maxlength: 150 },

  // ── Student Profile ───────────────────────────────────
  university      : { type: String, default: '', trim: true },
  studentId       : { type: String, default: '', trim: true },
  yearOfStudy     : { type: Number, min: 1, max: 10, default: 1 },

  // ── Finance Settings ──────────────────────────────────
  currency        : { type: String, default: 'LKR', uppercase: true, maxlength: 3 },
  monthlyAllowance: { type: Number, default: 0, min: 0 },
  dailyLimit      : { type: Number, default: 0,  min: 0 },  // overall daily spend cap

  // ── Category Budget Limits (array) ───────────────────
  budgetLimits    : { type: [budgetLimitSchema], default: [] },

  // ── Health Score (0-100, computed by AI) ─────────────
  healthScore     : { type: Number, default: 100, min: 0, max: 100 },

  // ── Auth ──────────────────────────────────────────────
  refreshToken    : { type: String, select: false },
  isEmailVerified : { type: Boolean, default: false },
  lastLoginAt     : { type: Date },
  loginAttempts   : { type: Number, required: true, default: 0 },
  lockUntil       : { type: Date },

  // ── Preferences ───────────────────────────────────────
  notifications   : { type: notifPrefSchema, default: () => ({}) },
  isActive        : { type: Boolean, default: true },

}, { timestamps: true });

userSchema.index({ createdAt: -1 });

/* ── Hash password before save ── */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* ── Compare password helper ── */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── Virtual for account lockout ── */
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/* ── Omit sensitive fields from JSON ── */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

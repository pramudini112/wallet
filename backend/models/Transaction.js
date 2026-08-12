const mongoose = require('mongoose');

/* ── Valid student expense categories ── */
const CATEGORIES = [
  'canteen',    // campus food & drinks
  'transport',  // bus, train, tuktuk
  'education',  // books, printing, stationery
  'health',     // medicine, clinic
  'mobile',     // data, top-up
  'social',     // outings, events
  'clothing',   // uniform, casual
  'utilities',  // electricity, water (hostel)
  'savings',    // money set aside
  'other',
];

/* ── Receipt / Attachment sub-schema ── */
const receiptSchema = new mongoose.Schema({
  url       : { type: String },           // cloud storage URL
  filename  : { type: String },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

/* ── Main Transaction Schema ── */
const transactionSchema = new mongoose.Schema({
  // ── Ownership ─────────────────────────────────────────
  userId      : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // ── Core Fields ───────────────────────────────────────
  type        : { type: String, enum: ['income', 'expense', 'transfer'], required: true },
  amount      : { type: Number, required: true, min: 0.01 },
  currency    : { type: String, default: 'LKR', uppercase: true, maxlength: 3 },

  // ── Classification ────────────────────────────────────
  category    : { type: String, enum: CATEGORIES, default: 'other', required: true },
  subcategory : { type: String, trim: true, maxlength: 50 },   // e.g. "Rice & Curry", "138 Bus"
  description : { type: String, trim: true, maxlength: 255 },

  // ── Timing ────────────────────────────────────────────
  date        : { type: Date, default: Date.now },              // when it happened
  isRecurring : { type: Boolean, default: false },
  recurringId : { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringTransaction' },

  // ── Payment ───────────────────────────────────────────
  paymentMethod: {
    type   : String,
    enum   : ['cash', 'mobile_wallet', 'bank_transfer', 'card', 'other'],
    default: 'cash',
  },

  // ── Source ────────────────────────────────────────────
  source       : {
    type   : String,
    enum   : ['manual', 'quick_entry', 'ai_parsed', 'recurring', 'import'],
    default: 'manual',
  },

  // ── Attachments / receipts ────────────────────────────
  receipt     : { type: receiptSchema },

  // ── Tags (free-form) ──────────────────────────────────
  tags        : { type: [String], default: [] },

  // ── Soft delete ───────────────────────────────────────
  isDeleted   : { type: Boolean, default: false, index: true },
  deletedAt   : { type: Date },

}, { timestamps: true });

/* ── Compound indexes for fast dashboard queries ── */
transactionSchema.index({ userId: 1, date: -1 });                  // user timeline
transactionSchema.index({ userId: 1, category: 1, date: -1 });    // per-category reports
transactionSchema.index({ userId: 1, type: 1, date: -1 });        // income vs expense
transactionSchema.index({ userId: 1, isDeleted: 1, date: -1 });   // active transactions

/* ── Static: total spent in a date range for a user ── */
transactionSchema.statics.totalSpent = function (userId, from, to) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', isDeleted: false, date: { $gte: from, $lte: to } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
};

/* ── Static: spending by category in a date range ── */
transactionSchema.statics.spendingByCategory = function (userId, from, to) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', isDeleted: false, date: { $gte: from, $lte: to } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;

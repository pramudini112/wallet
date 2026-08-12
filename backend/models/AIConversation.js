const mongoose = require('mongoose');

/**
 * AIConversation – stores chat history between the student and the AI advisor.
 * Used for context-aware follow-up responses.
 */
const messageSchema = new mongoose.Schema({
  role      : { type: String, enum: ['user', 'assistant'], required: true },
  content   : { type: String, required: true, maxlength: 4000 },
  timestamp : { type: Date, default: Date.now },
  // Optional: financial context snapshot when message was sent
  contextSnapshot: {
    balance     : Number,
    dailySpent  : Number,
    monthSpent  : Number,
    topCategory : String,
  },
}, { _id: false });

const aiConversationSchema = new mongoose.Schema({
  // ── Ownership ─────────────────────────────────────────
  userId      : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // ── Session ───────────────────────────────────────────
  sessionTitle: { type: String, default: 'Finance Chat', maxlength: 100 },
  messages    : { type: [messageSchema], default: [] },

  // ── Metadata ──────────────────────────────────────────
  isActive    : { type: Boolean, default: true },
  totalTokens : { type: Number, default: 0 },   // track API usage
  model       : { type: String, default: 'gemini-2.0-flash' },

}, { timestamps: true });

aiConversationSchema.index({ userId: 1, updatedAt: -1 });
aiConversationSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);

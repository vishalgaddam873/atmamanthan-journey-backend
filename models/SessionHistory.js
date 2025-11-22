const mongoose = require('mongoose');

const sessionHistorySchema = new mongoose.Schema({
  ageGroup: {
    type: String,
    enum: ['KIDS', 'PRE-TEEN', 'TEEN+'],
    required: true
  },
  mood: {
    type: String,
    enum: ['ANXIETY', 'SAD', 'ANGRY', 'HAPPY', 'LOVE', 'CONFUSED'],
    required: true
  },
  category: {
    type: String,
    enum: ['NEGATIVE', 'POSITIVE', 'NEUTRAL'],
    required: true
  },
  pran: {
    type: Number,
    min: 1,
    max: 12,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
sessionHistorySchema.index({ ageGroup: 1, createdAt: -1 });
sessionHistorySchema.index({ mood: 1, createdAt: -1 });
sessionHistorySchema.index({ category: 1, createdAt: -1 });
sessionHistorySchema.index({ pran: 1, createdAt: -1 });
sessionHistorySchema.index({ completedAt: -1 });

module.exports = mongoose.model('SessionHistory', sessionHistorySchema);

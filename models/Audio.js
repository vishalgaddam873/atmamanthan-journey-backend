const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['COMMON', 'NEGATIVE', 'POSITIVE', 'NEUTRAL', 'PRAN'],
    required: true
  },
  sequence: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  scriptText: {
    type: String,
    default: ''
  },
  cuePoint: {
    type: String,
    enum: ['NONE', 'MIRROR_FADE', 'SHOW_NEG_IMAGES', 'SHOW_POS_IMAGES', 'MOOD_SELECTION', 'PRAN_SELECTION', 'ENDING'],
    default: 'NONE'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique sequence per category
audioSchema.index({ category: 1, sequence: 1 }, { unique: true });

module.exports = mongoose.model('Audio', audioSchema);


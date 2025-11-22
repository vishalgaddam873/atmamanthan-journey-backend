const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['NEGATIVE', 'POSITIVE', 'NEUTRAL'],
    required: true
  },
  ageGroup: {
    type: String,
    enum: ['4-9', '9-14', '15+'],
    required: true
  },
  type: {
    type: String,
    enum: ['NEG-EMOTION', 'POS-EMOTION', 'TRANSITION', 'PRAN', 'ENDING'],
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
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);


const mongoose = require('mongoose');

const pranSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 12
  },
  category: {
    type: String,
    enum: ['NEGATIVE', 'POSITIVE', 'NEUTRAL'],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  }
}, {
  timestamps: true
});

// Ensure unique sequence within category
pranSchema.index({ category: 1, sequence: 1 }, { unique: true });

module.exports = mongoose.model('Pran', pranSchema);


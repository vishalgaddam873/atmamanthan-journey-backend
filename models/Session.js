const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    default: 'LIVE',
    unique: true,
    required: true
  },
  ageGroup: {
    type: String,
    enum: {
      values: ['KIDS', 'PRE-TEEN', 'TEEN+', null],
      message: '{VALUE} is not a valid age group'
    },
    default: null,
    required: false,
    validate: {
      validator: function(v) {
        return v === null || ['KIDS', 'PRE-TEEN', 'TEEN+'].includes(v);
      },
      message: '{VALUE} is not a valid age group'
    }
  },
  mood: {
    type: String,
    enum: {
      values: ['ANXIETY', 'SAD', 'ANGRY', 'HAPPY', 'LOVE', 'CONFUSED', null],
      message: '{VALUE} is not a valid mood'
    },
    default: null,
    required: false,
    validate: {
      validator: function(v) {
        return v === null || ['ANXIETY', 'SAD', 'ANGRY', 'HAPPY', 'LOVE', 'CONFUSED'].includes(v);
      },
      message: '{VALUE} is not a valid mood'
    }
  },
  category: {
    type: String,
    enum: {
      values: ['NEGATIVE', 'POSITIVE', 'NEUTRAL', null],
      message: '{VALUE} is not a valid category'
    },
    default: null,
    required: false,
    validate: {
      validator: function(v) {
        return v === null || ['NEGATIVE', 'POSITIVE', 'NEUTRAL'].includes(v);
      },
      message: '{VALUE} is not a valid category'
    }
  },
  pran: {
    type: Number,
    min: 1,
    max: 12,
    default: null,
    required: false
  },
  currentPhase: {
    type: String,
    enum: ['INIT', 'AGE_SELECTION', 'COMMON_FLOW', 'MOOD_SELECTION', 'CATEGORY_FLOW', 'PRAN_SELECTION', 'ENDING'],
    default: 'INIT'
  },
  currentAudio: {
    type: String,
    default: null
  },
  currentCue: {
    type: Number,
    default: 0
  },
  audioState: {
    type: String,
    enum: ['PLAYING', 'PAUSED', 'STOPPED'],
    default: 'STOPPED'
  }
}, {
  timestamps: true
});

// Ensure only one session exists
sessionSchema.statics.getLiveSession = async function() {
  let session = await this.findOne({ sessionId: 'LIVE' });
  if (!session) {
    // Create session with only required fields
    session = await this.create({ 
      sessionId: 'LIVE',
      ageGroup: null,
      mood: null,
      category: null,
      pran: null
    });
  }
  return session;
};

// Pre-save hook to handle null enum values
sessionSchema.pre('save', function(next) {
  // Allow null values for optional enum fields
  if (this.ageGroup === null || this.ageGroup === undefined) {
    this.ageGroup = null;
  }
  if (this.mood === null || this.mood === undefined) {
    this.mood = null;
  }
  if (this.category === null || this.category === undefined) {
    this.category = null;
  }
  if (this.pran === null || this.pran === undefined) {
    this.pran = null;
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);


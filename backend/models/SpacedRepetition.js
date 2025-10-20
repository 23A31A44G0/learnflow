const mongoose = require('mongoose');

const spacedRepetitionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  easinessFactor: {
    type: Number,
    default: 2.5,
    min: 1.3
  },
  interval: {
    type: Number,
    default: 1 // days
  },
  repetitions: {
    type: Number,
    default: 0
  },
  nextReviewDate: {
    type: Date,
    default: Date.now
  },
  lastReviewed: {
    type: Date
  },
  difficulty: {
    type: Number, // 0-5 scale (0=easiest, 5=hardest)
    min: 0,
    max: 5
  },
  masteryLevel: {
    type: String,
    enum: ['new', 'learning', 'reviewing', 'mastered'],
    default: 'new'
  }
}, {
  timestamps: true
});

// Index for efficient queries
spacedRepetitionSchema.index({ user: 1, nextReviewDate: 1 });
spacedRepetitionSchema.index({ user: 1, masteryLevel: 1 });

module.exports = mongoose.model('SpacedRepetition', spacedRepetitionSchema);
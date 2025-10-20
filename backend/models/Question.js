const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studySession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudySession',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['flashcard', 'multiple-choice', 'fill-blank', 'comprehension'],
    default: 'flashcard'
  },
  // Spaced Repetition Fields (SM-2 Algorithm)
  easinessFactor: {
    type: Number,
    default: 2.5,
    min: 1.3
  },
  interval: {
    type: Number,
    default: 1 // days until next review
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
  quality: {
    type: Number,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  correctReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for spaced repetition queries
questionSchema.index({ user: 1, nextReviewDate: 1 });
questionSchema.index({ user: 1, interval: 1 });

module.exports = mongoose.model('Question', questionSchema);

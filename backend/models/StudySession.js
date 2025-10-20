const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalText: {
    type: String,
    required: true
  },
  generatedQuestions: [{
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
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }],
  sessionDuration: {
    type: Number, // in minutes
    default: 0
  },
  completedQuestions: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
studySessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
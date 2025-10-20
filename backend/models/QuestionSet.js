const mongoose = require('mongoose');

const questionSetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Question Set'
  },
  sourceText: {
    type: String,
    required: true
  },
  sourceType: {
    type: String,
    enum: ['text', 'pdf', 'url'],
    default: 'text'
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: false // Make it optional since AI might not always provide it
    },
    type: {
      type: String,
      enum: ['flashcard', 'multiple-choice', 'fill-blank', 'comprehension', 'short-answer', 'true-false'],
      default: 'short-answer'
    },
    options: [String], // For multiple choice questions
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }],
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  studyCount: {
    type: Number,
    default: 0
  },
  lastStudied: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
questionSetSchema.index({ userId: 1, createdAt: -1 });
questionSetSchema.index({ userId: 1, tags: 1 });
questionSetSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('QuestionSet', questionSetSchema);

const mongoose = require('mongoose');

const PracticeSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answers: [{
    questionIndex: Number,
    userAnswer: String,
    isCorrect: Boolean,
    timeTaken: Number // in seconds
  }],
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PracticeSession', PracticeSessionSchema);

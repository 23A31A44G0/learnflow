const mongoose = require('mongoose');

const MetacognitiveReflectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promptType: {
    type: String,
    required: true,
    enum: ['post-practice', 'post-study', 'weekly-review', 'difficulty-encountered', 'concept-mastery']
  },
  prompt: {
    type: String,
    required: true
  },
  userResponse: {
    type: String,
    required: true
  },
  aiAnalysis: {
    insights: String,
    learningPatterns: [String],
    suggestions: [String],
    metacognitiveScore: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  context: {
    sessionType: String, // 'practice', 'study', 'quiz'
    conceptsStudied: [String],
    performanceScore: Number,
    timeSpent: Number,
    difficultyLevel: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

MetacognitiveReflectionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('MetacognitiveReflection', MetacognitiveReflectionSchema);

const mongoose = require('mongoose');

// Feedback Schema (moved from routes/feedback.js)
const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedback: {
    firstImpression: String,
    difficulty: String,
    missingFeatures: String,
    overallRating: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    wouldRecommend: {
      type: Boolean,
      required: true
    },
    additionalComments: String
  },
  usage: {
    questionsGenerated: { type: Number, default: 0 },
    practiceSessionsCompleted: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    featuresUsed: [String],
    sessionDuration: { type: Number, default: 0 }, // in seconds
    totalVisits: { type: Number, default: 0 }
  },
  testPhase: {
    type: String,
    enum: ['alpha', 'beta', 'production'],
    default: 'alpha'
  },
  deviceInfo: {
    userAgent: String,
    screen: String,
    browser: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);

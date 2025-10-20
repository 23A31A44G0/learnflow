const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');

// Alpha Tester Schema
const AlphaTesterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  invitedBy: String,
  status: {
    type: String,
    enum: ['invited', 'active', 'completed', 'dropped'],
    default: 'invited'
  },
  testingPeriod: {
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    expectedDuration: { type: Number, default: 7 } // days
  },
  metrics: {
    loginCount: { type: Number, default: 0 },
    lastActiveDate: Date,
    questionsGenerated: { type: Number, default: 0 },
    practiceSessionsCompleted: { type: Number, default: 0 },
    feedbackSubmitted: { type: Boolean, default: false }
  }
});

const AlphaTester = mongoose.model('AlphaTester', AlphaTesterSchema);

// Submit feedback
router.post('/feedback', auth, async (req, res) => {
  try {
    const { feedback, usage, deviceInfo } = req.body;

    const newFeedback = new Feedback({
      user: req.user._id,
      feedback,
      usage,
      deviceInfo,
      testPhase: 'alpha'
    });

    await newFeedback.save();

    // Update alpha tester record
    await AlphaTester.findOneAndUpdate(
      { user: req.user._id },
      { 
        'metrics.feedbackSubmitted': true,
        'status': 'completed'
      }
    );

    res.json({
      success: true,
      message: 'Thank you for your feedback! Your input is invaluable for improving LearnFlow.'
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    });
  }
});

// Get alpha test analytics (admin only)
router.get('/alpha-analytics', auth, async (req, res) => {
  try {
    // Simple admin check (you can enhance this)
    if (req.user.email !== 'admin@learnflow.app') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalTesters = await AlphaTester.countDocuments();
    const activeTesters = await AlphaTester.countDocuments({ status: 'active' });
    const completedTesters = await AlphaTester.countDocuments({ status: 'completed' });
    
    const feedbackStats = await Feedback.aggregate([
      { $match: { testPhase: 'alpha' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$feedback.overallRating' },
          totalFeedback: { $sum: 1 },
          wouldRecommendCount: {
            $sum: { $cond: [{ $eq: ['$feedback.wouldRecommend', true] }, 1, 0] }
          }
        }
      }
    ]);

    const usageStats = await Feedback.aggregate([
      { $match: { testPhase: 'alpha' } },
      {
        $group: {
          _id: null,
          avgQuestionsGenerated: { $avg: '$usage.questionsGenerated' },
          avgPracticeSessions: { $avg: '$usage.practiceSessionsCompleted' },
          avgAccuracy: { $avg: '$usage.averageAccuracy' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        testers: {
          total: totalTesters,
          active: activeTesters,
          completed: completedTesters,
          retentionRate: totalTesters > 0 ? (activeTesters + completedTesters) / totalTesters : 0
        },
        feedback: feedbackStats[0] || {},
        usage: usageStats[0] || {}
      }
    });

  } catch (error) {
    console.error('Alpha analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alpha analytics'
    });
  }
});

// Track user activity (for retention analysis)
router.post('/track-activity', auth, async (req, res) => {
  try {
    const { action, data } = req.body;

    // Update alpha tester metrics
    const updateData = {
      'metrics.lastActiveDate': new Date()
    };

    if (action === 'login') {
      updateData['$inc'] = { 'metrics.loginCount': 1 };
    } else if (action === 'generate_questions') {
      updateData['$inc'] = { 'metrics.questionsGenerated': data.count || 1 };
    } else if (action === 'complete_practice') {
      updateData['$inc'] = { 'metrics.practiceSessionsCompleted': 1 };
    }

    await AlphaTester.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { upsert: true }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Activity tracking error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Question = require('../models/Question');
const PracticeSession = require('../models/PracticeSession');
const auth = require('../middleware/auth');

// Middleware to check admin access
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all alpha testers with detailed metrics
router.get('/alpha-testers', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ isAlphaTester: true });
    
    const alphaTestersData = await Promise.all(
      users.map(async (user) => {
        // Get user's questions
        const questions = await Question.find({ userId: user._id });
        
        // Get user's practice sessions
        const practiceSessions = await PracticeSession.find({ userId: user._id });
        
        // Get user's feedback
        const feedback = await Feedback.findOne({ userId: user._id });
        
        // Calculate retention metrics
        const now = new Date();
        const joinDate = new Date(user.createdAt);
        const daysDiff = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
        
        // Calculate session metrics
        const totalSessions = practiceSessions.length;
        const totalSessionDuration = practiceSessions.reduce((sum, session) => {
          if (session.endTime && session.startTime) {
            return sum + (session.endTime - session.startTime) / (1000 * 60); // in minutes
          }
          return sum;
        }, 0);
        
        const averageSessionDuration = totalSessions > 0 ? totalSessionDuration / totalSessions : 0;
        
        // Calculate retention based on activity
        const retentionDay1 = daysDiff >= 1 ? user.lastLogin >= new Date(joinDate.getTime() + 24 * 60 * 60 * 1000) : false;
        const retentionDay3 = daysDiff >= 3 ? user.lastLogin >= new Date(joinDate.getTime() + 3 * 24 * 60 * 60 * 1000) : false;
        const retentionDay7 = daysDiff >= 7 ? user.lastLogin >= new Date(joinDate.getTime() + 7 * 24 * 60 * 60 * 1000) : false;
        
        // Determine user status
        let status = 'active';
        const daysSinceLastLogin = Math.floor((now - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24));
        if (daysSinceLastLogin > 7) {
          status = 'churned';
        } else if (feedback && feedback.completed) {
          status = 'completed';
        }
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          userType: user.alphaTesterType || 'casual_user',
          joinedAt: user.createdAt,
          lastActive: user.lastLogin,
          totalSessions,
          questionsGenerated: questions.length,
          practiceSessionsCompleted: practiceSessions.filter(s => s.completed).length,
          averageSessionDuration,
          retentionDay1,
          retentionDay3,
          retentionDay7,
          feedbackGiven: !!feedback,
          npsScore: feedback?.npsScore,
          status
        };
      })
    );
    
    res.json(alphaTestersData);
  } catch (error) {
    console.error('Error fetching alpha testers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get daily analytics data
router.get('/analytics/daily', auth, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const dailyData = [];
    
    for (let i = parseInt(days); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Count active users (users who logged in that day)
      const activeUsers = await User.countDocuments({
        isAlphaTester: true,
        lastLogin: { $gte: date, $lt: nextDate }
      });
      
      // Count new signups
      const newSignups = await User.countDocuments({
        isAlphaTester: true,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      // Count questions generated
      const questionsGenerated = await Question.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      // Count practice sessions completed
      const practiceSessionsCompleted = await PracticeSession.countDocuments({
        completed: true,
        endTime: { $gte: date, $lt: nextDate }
      });
      
      // Calculate average session duration
      const sessions = await PracticeSession.find({
        startTime: { $gte: date, $lt: nextDate },
        endTime: { $exists: true }
      });
      
      const totalDuration = sessions.reduce((sum, session) => {
        return sum + (session.endTime - session.startTime) / (1000 * 60); // in minutes
      }, 0);
      
      const averageSessionDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        activeUsers,
        newSignups,
        questionsGenerated,
        practiceSessionsCompleted,
        averageSessionDuration: Math.round(averageSessionDuration * 100) / 100
      });
    }
    
    res.json(dailyData);
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feature usage analytics
router.get('/analytics/features', auth, requireAdmin, async (req, res) => {
  try {
    const alphaTesters = await User.find({ isAlphaTester: true });
    const alphaTesterIds = alphaTesters.map(user => user._id);
    
    // Question generation feature
    const questionGenUsers = await Question.distinct('userId', { userId: { $in: alphaTesterIds } });
    
    // Practice mode feature
    const practiceUsers = await PracticeSession.distinct('userId', { userId: { $in: alphaTesterIds } });
    
    // PDF upload feature (assuming we track this in questions with a pdfUploaded field)
    const pdfUsers = await Question.distinct('userId', { 
      userId: { $in: alphaTesterIds },
      source: 'pdf'
    });
    
    // Spaced repetition feature (users who have multiple practice sessions)
    const spacedRepetitionUsers = await PracticeSession.aggregate([
      { $match: { userId: { $in: alphaTesterIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } }
    ]);
    
    const totalUsers = alphaTesters.length;
    
    const featureUsage = [
      {
        feature: 'Question Generation',
        usage: questionGenUsers.length,
        adoptionRate: Math.round((questionGenUsers.length / totalUsers) * 100)
      },
      {
        feature: 'Practice Mode',
        usage: practiceUsers.length,
        adoptionRate: Math.round((practiceUsers.length / totalUsers) * 100)
      },
      {
        feature: 'PDF Upload',
        usage: pdfUsers.length,
        adoptionRate: Math.round((pdfUsers.length / totalUsers) * 100)
      },
      {
        feature: 'Spaced Repetition',
        usage: spacedRepetitionUsers.length,
        adoptionRate: Math.round((spacedRepetitionUsers.length / totalUsers) * 100)
      }
    ];
    
    res.json(featureUsage);
  } catch (error) {
    console.error('Error fetching feature analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed user analytics
router.get('/user/:userId/analytics', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const questions = await Question.find({ userId }).sort({ createdAt: -1 });
    const practiceSessions = await PracticeSession.find({ userId }).sort({ startTime: -1 });
    const feedback = await Feedback.findOne({ userId });
    
    // Calculate learning progress
    const totalQuestions = questions.length;
    const completedSessions = practiceSessions.filter(s => s.completed).length;
    const averageScore = practiceSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions || 0;
    
    // Calculate retention curve
    const retentionData = [];
    const joinDate = new Date(user.createdAt);
    for (let day = 1; day <= 14; day++) {
      const targetDate = new Date(joinDate);
      targetDate.setDate(targetDate.getDate() + day);
      
      const wasActive = user.lastLogin >= targetDate;
      retentionData.push({
        day,
        active: wasActive,
        date: targetDate.toISOString().split('T')[0]
      });
    }
    
    // Calculate study streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    const sessionDates = [...new Set(practiceSessions.map(s => 
      s.startTime.toISOString().split('T')[0]
    ))].sort();
    
    for (let i = 0; i < sessionDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sessionDates[i - 1]);
        const currDate = new Date(sessionDates[i]);
        const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);
    
    // Current streak calculation
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (sessionDates.includes(today)) {
      currentStreak = tempStreak;
    } else if (sessionDates.includes(yesterdayStr)) {
      currentStreak = tempStreak;
    }
    
    res.json({
      user: {
        name: user.name,
        email: user.email,
        joinedAt: user.createdAt,
        lastActive: user.lastLogin,
        userType: user.alphaTesterType || 'casual_user'
      },
      metrics: {
        totalQuestions,
        completedSessions,
        averageScore: Math.round(averageScore * 100) / 100,
        totalStudyTime: practiceSessions.reduce((sum, s) => {
          if (s.endTime && s.startTime) {
            return sum + (s.endTime - s.startTime) / (1000 * 60);
          }
          return sum;
        }, 0),
        currentStreak,
        maxStreak
      },
      retentionData,
      recentActivity: {
        questions: questions.slice(0, 10),
        sessions: practiceSessions.slice(0, 10)
      },
      feedback: feedback ? {
        rating: feedback.rating,
        npsScore: feedback.npsScore,
        comments: feedback.comments,
        submittedAt: feedback.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export alpha test data
router.get('/export/alpha-data', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ isAlphaTester: true });
    const questions = await Question.find().populate('userId', 'name email');
    const practiceSessions = await PracticeSession.find().populate('userId', 'name email');
    const feedback = await Feedback.find().populate('userId', 'name email');
    
    const exportData = {
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.alphaTesterType,
        joinedAt: user.createdAt,
        lastLogin: user.lastLogin
      })),
      questions: questions.map(q => ({
        id: q._id,
        userId: q.userId._id,
        userName: q.userId.name,
        text: q.text,
        source: q.source,
        createdAt: q.createdAt
      })),
      practiceSessions: practiceSessions.map(s => ({
        id: s._id,
        userId: s.userId._id,
        userName: s.userId.name,
        score: s.score,
        completed: s.completed,
        startTime: s.startTime,
        endTime: s.endTime,
        questionsAnswered: s.questionsAnswered.length
      })),
      feedback: feedback.map(f => ({
        userId: f.userId._id,
        userName: f.userId.name,
        rating: f.rating,
        npsScore: f.npsScore,
        comments: f.comments,
        submittedAt: f.createdAt
      }))
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting alpha data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update alpha tester status
router.put('/alpha-testers/:userId/status', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, userType } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userType) {
      user.alphaTesterType = userType;
    }
    
    // You might want to add a status field to the User model
    // For now, we'll use activity to determine status
    
    await user.save();
    
    res.json({ message: 'Alpha tester status updated successfully' });
  } catch (error) {
    console.error('Error updating alpha tester status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message to alpha testers
router.post('/alpha-testers/message', auth, requireAdmin, async (req, res) => {
  try {
    const { message, targetType, userIds } = req.body;
    
    let targetUsers;
    
    if (userIds && userIds.length > 0) {
      // Send to specific users
      targetUsers = await User.find({ _id: { $in: userIds }, isAlphaTester: true });
    } else if (targetType) {
      // Send to users of specific type
      targetUsers = await User.find({ isAlphaTester: true, alphaTesterType: targetType });
    } else {
      // Send to all alpha testers
      targetUsers = await User.find({ isAlphaTester: true });
    }
    
    // Here you would integrate with your messaging system
    // For now, we'll just log the action
    console.log(`Sending message to ${targetUsers.length} alpha testers:`, message);
    
    // You could also create a notifications system in your database
    // or integrate with email services like SendGrid, Mailgun, etc.
    
    res.json({ 
      message: 'Message sent successfully', 
      recipientCount: targetUsers.length 
    });
  } catch (error) {
    console.error('Error sending message to alpha testers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alpha test summary report
router.get('/summary-report', auth, requireAdmin, async (req, res) => {
  try {
    const totalTesters = await User.countDocuments({ isAlphaTester: true });
    const activeTesters = await User.countDocuments({ 
      isAlphaTester: true,
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    const totalQuestions = await Question.countDocuments();
    const totalPracticeSessions = await PracticeSession.countDocuments();
    const completedSessions = await PracticeSession.countDocuments({ completed: true });
    const totalFeedback = await Feedback.countDocuments();
    
    // Calculate average scores
    const avgScores = await PracticeSession.aggregate([
      { $match: { completed: true, score: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    
    const avgScore = avgScores.length > 0 ? avgScores[0].avgScore : 0;
    
    // Calculate NPS
    const npsScores = await Feedback.find({ npsScore: { $exists: true } });
    const nps = calculateNPS(npsScores.map(f => f.npsScore));
    
    // Top features by usage
    const powerUsers = await User.find({ alphaTesterType: 'power_user', isAlphaTester: true });
    const casualUsers = await User.find({ alphaTesterType: 'casual_user', isAlphaTester: true });
    
    const report = {
      overview: {
        totalTesters,
        activeTesters,
        retentionRate: Math.round((activeTesters / totalTesters) * 100),
        averageScore: Math.round(avgScore * 100) / 100,
        nps: Math.round(nps * 10) / 10
      },
      usage: {
        totalQuestions,
        totalPracticeSessions,
        completionRate: Math.round((completedSessions / totalPracticeSessions) * 100),
        avgQuestionsPerUser: Math.round(totalQuestions / totalTesters),
        avgSessionsPerUser: Math.round(totalPracticeSessions / totalTesters)
      },
      feedback: {
        totalResponses: totalFeedback,
        responseRate: Math.round((totalFeedback / totalTesters) * 100)
      },
      segments: {
        powerUsers: powerUsers.length,
        casualUsers: casualUsers.length
      },
      generatedAt: new Date()
    };
    
    res.json(report);
  } catch (error) {
    console.error('Error generating summary report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate NPS
function calculateNPS(scores) {
  if (scores.length === 0) return 0;
  
  const promoters = scores.filter(score => score >= 9).length;
  const detractors = scores.filter(score => score <= 6).length;
  const total = scores.length;
  
  return ((promoters - detractors) / total) * 100;
}

module.exports = router;

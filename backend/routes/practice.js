const express = require('express');
const { body, validationResult } = require('express-validator');
const PracticeSession = require('../models/PracticeSession');
const QuestionSet = require('../models/QuestionSet');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { GamificationService } = require('../services/gamificationService');

const router = express.Router();

// Improved answer similarity checking function
function checkAnswerSimilarity(correctAnswer, userAnswer) {
  if (!correctAnswer || !userAnswer) return false;
  
  // Normalize both answers
  const normalize = (text) => text.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
  
  const normalizedCorrect = normalize(correctAnswer);
  const normalizedUser = normalize(userAnswer);
  
  // Direct match
  if (normalizedCorrect === normalizedUser) {
    return true;
  }
  
  // Extract key concepts (important words, ignoring common words)
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'any', 'from', 'list', 'three', 'two', 'one', 'four', 'five', 'management', 'complexity'];
  
  const extractKeyTerms = (text) => {
    return text.split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.replace(/s$/, '')); // Remove plural 's'
  };
  
  const correctTerms = extractKeyTerms(normalizedCorrect);
  const userTerms = extractKeyTerms(normalizedUser);
  
  // Check for concept matching (handles cases like "time" matching "time management complexity")
  const conceptMatches = correctTerms.filter(correctTerm => {
    return userTerms.some(userTerm => {
      // Direct match or partial match
      return correctTerm.includes(userTerm) || userTerm.includes(correctTerm) ||
             // Handle synonyms/related terms
             (correctTerm === 'time' && userTerm === 'time') ||
             (correctTerm === 'cost' && userTerm === 'cost') ||
             (correctTerm === 'quality' && (userTerm === 'quality' || userTerm === 'risk')) ||
             (correctTerm === 'risk' && userTerm === 'risk') ||
             // Technical terms
             (correctTerm === 'euclidean' && userTerm === 'euclidean') ||
             (correctTerm === 'manhattan' && userTerm === 'manhattan') ||
             (correctTerm === 'minkowski' && userTerm === 'minkowski');
    });
  });
  
  // Calculate similarity based on concept overlap
  const conceptSimilarity = conceptMatches.length / Math.max(correctTerms.length, 1);
  
  // Also check word overlap for general matching
  const wordMatches = correctTerms.filter(word => 
    userTerms.some(userWord => userWord.includes(word) || word.includes(userWord))
  );
  const wordSimilarity = wordMatches.length / Math.max(correctTerms.length, 1);
  
  // Check containment
  const containmentMatch = normalizedCorrect.includes(normalizedUser) || 
                          normalizedUser.includes(normalizedCorrect);
  
  // Accept if high concept similarity OR word similarity OR containment
  return conceptSimilarity >= 0.6 || wordSimilarity >= 0.7 || containmentMatch;
}

// Submit practice session
router.post('/submit', auth, [
  body('questionId').notEmpty().withMessage('Question ID is required'),
  body('answers').isArray().withMessage('Answers must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { questionId, answers } = req.body;

    // Find the question set
    const questionSet = await QuestionSet.findOne({ 
      _id: questionId, 
      userId: req.user._id 
    });

    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = questionSet.questions[answer.questionIndex];
      if (!question) {
        return {
          ...answer,
          isCorrect: false
        };
      }

      // Improved answer checking algorithm
      const isCorrect = checkAnswerSimilarity(
        question.answer, 
        answer.userAnswer
      );
      
      if (isCorrect) correctAnswers++;

      return {
        ...answer,
        isCorrect
      };
    });

    const score = Math.round((correctAnswers / questionSet.questions.length) * 100);

    // Save practice session
    const practiceSession = new PracticeSession({
      userId: req.user._id,
      questionId,
      answers: processedAnswers,
      score
    });

    await practiceSession.save();

    // Update user stats
    const updatedUser = await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'stats.totalQuestions': questionSet.questions.length,
        'stats.correctAnswers': correctAnswers
      },
      $set: {
        'stats.masteryScore': Math.round(
          ((req.user.stats.correctAnswers + correctAnswers) / 
           (req.user.stats.totalQuestions + questionSet.questions.length)) * 100
        )
      }
    }, { new: true });

    // Process gamification
    const perfectSession = score === 100;
    const timeSpentMinutes = Math.ceil(
      answers.reduce((total, answer) => total + (answer.timeTaken || 30), 0) / 60
    );

    // Award points and check badges
    const gamificationResults = {
      pointsAwarded: [],
      newBadges: [],
      streakUpdate: null,
      levelUp: false
    };

    // Award points for correct answers
    if (correctAnswers > 0) {
      const correctAnswerPoints = await GamificationService.awardPoints(
        req.user._id, 
        'CORRECT_ANSWER', 
        correctAnswers
      );
      if (correctAnswerPoints) gamificationResults.pointsAwarded.push(correctAnswerPoints);
    }

    // Award points for completing session
    const sessionPoints = await GamificationService.awardPoints(
      req.user._id, 
      'PRACTICE_SESSION_COMPLETED'
    );
    if (sessionPoints) gamificationResults.pointsAwarded.push(sessionPoints);

    // Award bonus for perfect session
    if (perfectSession) {
      const perfectPoints = await GamificationService.awardPoints(
        req.user._id, 
        'PERFECT_PRACTICE_SESSION'
      );
      if (perfectPoints) gamificationResults.pointsAwarded.push(perfectPoints);
      
      // Award perfect session badge
      const perfectBadge = await GamificationService.awardBadge(req.user._id, 'perfect_session');
      if (perfectBadge) {
        gamificationResults.newBadges.push(perfectBadge);
      }
    }

    // Update daily progress
    await GamificationService.updateDailyProgress(req.user._id, 'questions', questionSet.questions.length);
    await GamificationService.updateDailyProgress(req.user._id, 'studyTime', timeSpentMinutes);

    // Update streak
    gamificationResults.streakUpdate = await GamificationService.updateStreak(req.user._id);

    // Check for milestone badges
    const milestoneBadges = await GamificationService.checkAndAwardBadges(req.user._id);
    gamificationResults.newBadges.push(...milestoneBadges);

    res.json({
      sessionId: practiceSession._id,
      score,
      correctAnswers,
      totalQuestions: questionSet.questions.length,
      answers: processedAnswers,
      message: 'Practice session completed!',
      gamification: gamificationResults
    });

  } catch (error) {
    console.error('Practice submission error:', error);
    res.status(500).json({ message: 'Failed to submit practice session' });
  }
});

// Get practice history
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await PracticeSession.find({ userId: req.user._id })
      .populate('questionId', 'sourceText createdAt')
      .sort({ completedAt: -1 })
      .limit(20);

    res.json(sessions);
  } catch (error) {
    console.error('Practice history error:', error);
    res.status(500).json({ message: 'Failed to fetch practice history' });
  }
});

// Get analytics/stats
router.get('/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const recentSessions = await PracticeSession.find({ userId: req.user._id })
      .sort({ completedAt: -1 })
      .limit(10);

    const analytics = {
      totalQuestions: user.stats.totalQuestions,
      correctAnswers: user.stats.correctAnswers,
      masteryScore: user.stats.masteryScore,
      recentScores: recentSessions.map(session => ({
        score: session.score,
        date: session.completedAt
      })),
      totalSessions: recentSessions.length
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

module.exports = router;

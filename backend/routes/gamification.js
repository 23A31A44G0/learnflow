const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GamificationService, BADGES } = require('../services/gamificationService');

// Get user's gamification stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await GamificationService.getUserStats(req.user.id);
    if (!stats) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { timeframe = 'all', limit = 10 } = req.query;
    const leaderboard = await GamificationService.getLeaderboard(timeframe, parseInt(limit));

    res.json({
      success: true,
      leaderboard,
      timeframe
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available badges
router.get('/badges', auth, async (req, res) => {
  try {
    const userStats = await GamificationService.getUserStats(req.user.id);
    const availableBadges = Object.values(BADGES).map(badge => ({
      ...badge,
      unlocked: userStats.badges.some(b => b.id === badge.id),
      unlockedAt: userStats.badges.find(b => b.id === badge.id)?.unlockedAt || null
    }));

    res.json({
      success: true,
      badges: availableBadges
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manual point award (for testing or admin purposes)
router.post('/award-points', auth, async (req, res) => {
  try {
    const { pointType, multiplier = 1 } = req.body;
    
    const result = await GamificationService.awardPoints(req.user.id, pointType, multiplier);
    if (!result) {
      return res.status(400).json({ message: 'Invalid point type or user not found' });
    }

    // Check for new badges
    const newBadges = await GamificationService.checkAndAwardBadges(req.user.id);

    res.json({
      success: true,
      pointsAwarded: result,
      newBadges
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update daily progress
router.post('/daily-progress', auth, async (req, res) => {
  try {
    const { progressType, amount = 1 } = req.body;
    
    const result = await GamificationService.updateDailyProgress(req.user.id, progressType, amount);
    if (!result) {
      return res.status(400).json({ message: 'Invalid progress type or user not found' });
    }

    // Update streak if applicable
    let streakUpdate = null;
    if (progressType === 'questions' || progressType === 'studyTime' || progressType === 'reflections') {
      streakUpdate = await GamificationService.updateStreak(req.user.id);
    }

    // Check for new badges
    const newBadges = await GamificationService.checkAndAwardBadges(req.user.id);

    res.json({
      success: true,
      dailyProgress: result,
      streakUpdate,
      newBadges
    });
  } catch (error) {
    console.error('Error updating daily progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process gamification for completed practice session
router.post('/practice-completed', auth, async (req, res) => {
  try {
    const { 
      questionsAnswered, 
      correctAnswers, 
      timeSpentMinutes, 
      perfectSession = false 
    } = req.body;

    const results = {
      pointsAwarded: [],
      newBadges: [],
      streakUpdate: null,
      levelUp: false
    };

    // Award points for correct answers
    if (correctAnswers > 0) {
      const correctAnswerPoints = await GamificationService.awardPoints(
        req.user.id, 
        'CORRECT_ANSWER', 
        correctAnswers
      );
      results.pointsAwarded.push(correctAnswerPoints);
    }

    // Award points for completing session
    const sessionPoints = await GamificationService.awardPoints(
      req.user.id, 
      'PRACTICE_SESSION_COMPLETED'
    );
    results.pointsAwarded.push(sessionPoints);

    // Award bonus for perfect session
    if (perfectSession) {
      const perfectPoints = await GamificationService.awardPoints(
        req.user.id, 
        'PERFECT_PRACTICE_SESSION'
      );
      results.pointsAwarded.push(perfectPoints);
      
      // Award perfect session badge
      const perfectBadge = await GamificationService.awardBadge(req.user.id, 'perfect_session');
      if (perfectBadge) {
        results.newBadges.push(perfectBadge);
      }
    }

    // Update daily progress
    await GamificationService.updateDailyProgress(req.user.id, 'questions', questionsAnswered);
    await GamificationService.updateDailyProgress(req.user.id, 'studyTime', timeSpentMinutes);

    // Update streak
    results.streakUpdate = await GamificationService.updateStreak(req.user.id);

    // Check for milestone badges
    const milestoneBadges = await GamificationService.checkAndAwardBadges(req.user.id);
    results.newBadges.push(...milestoneBadges);

    res.json({
      success: true,
      gamificationResults: results
    });
  } catch (error) {
    console.error('Error processing practice gamification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process gamification for completed reflection
router.post('/reflection-completed', auth, async (req, res) => {
  try {
    const { qualityScore = 0 } = req.body;

    const results = {
      pointsAwarded: [],
      newBadges: []
    };

    // Award points for reflection
    const basePoints = await GamificationService.awardPoints(req.user.id, 'REFLECTION_COMPLETED');
    results.pointsAwarded.push(basePoints);

    // Award bonus points for high-quality reflection
    if (qualityScore >= 8) {
      const bonusPoints = await GamificationService.awardPoints(req.user.id, 'HIGH_QUALITY_REFLECTION');
      results.pointsAwarded.push(bonusPoints);
    }

    // Update daily progress
    await GamificationService.updateDailyProgress(req.user.id, 'reflections', 1);

    // Award first reflection badge
    const firstReflectionBadge = await GamificationService.awardBadge(req.user.id, 'first_reflection');
    if (firstReflectionBadge) {
      results.newBadges.push(firstReflectionBadge);
    }

    // Check for other reflection badges (would need to count total reflections)
    const reflectionBadges = await GamificationService.checkAndAwardBadges(req.user.id);
    results.newBadges.push(...reflectionBadges);

    res.json({
      success: true,
      gamificationResults: results
    });
  } catch (error) {
    console.error('Error processing reflection gamification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process gamification for Learn Space usage
router.post('/learn-space-used', auth, async (req, res) => {
  try {
    const { activityType, timeSpentMinutes = 0 } = req.body; // 'explanation', 'concept_map'

    const results = {
      pointsAwarded: [],
      newBadges: []
    };

    // Award points for using Learn Space
    const learnSpacePoints = await GamificationService.awardPoints(req.user.id, 'LEARN_SPACE_USAGE');
    results.pointsAwarded.push(learnSpacePoints);

    // Award additional points for concept mapping
    if (activityType === 'concept_map') {
      const conceptMapPoints = await GamificationService.awardPoints(req.user.id, 'CONCEPT_MAP_CREATED');
      results.pointsAwarded.push(conceptMapPoints);

      // Award concept mapper badge
      const conceptMapperBadge = await GamificationService.awardBadge(req.user.id, 'concept_mapper');
      if (conceptMapperBadge) {
        results.newBadges.push(conceptMapperBadge);
      }
    }

    // Award explorer badge for first Learn Space usage
    const explorerBadge = await GamificationService.awardBadge(req.user.id, 'explorer');
    if (explorerBadge) {
      results.newBadges.push(explorerBadge);
    }

    // Update study time
    if (timeSpentMinutes > 0) {
      await GamificationService.updateDailyProgress(req.user.id, 'studyTime', timeSpentMinutes);
    }

    res.json({
      success: true,
      gamificationResults: results
    });
  } catch (error) {
    console.error('Error processing Learn Space gamification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

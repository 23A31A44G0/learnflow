const User = require('../models/User');

// Badge definitions with unlock conditions
const BADGES = {
  FIRST_QUESTION: {
    id: 'first_question',
    name: 'First Step',
    description: 'Answered your first question',
    icon: '🌟',
    category: 'milestone',
    condition: (user) => user.stats.totalQuestions >= 1
  },
  FIVE_QUESTIONS: {
    id: 'five_questions',
    name: 'Getting Started',
    description: 'Answered 5 questions',
    icon: '🎯',
    category: 'milestone',
    condition: (user) => user.stats.totalQuestions >= 5
  },
  TWENTY_FIVE_QUESTIONS: {
    id: 'twenty_five_questions',
    name: 'Question Master',
    description: 'Answered 25 questions',
    icon: '🏆',
    category: 'milestone',
    condition: (user) => user.stats.totalQuestions >= 25
  },
  HUNDRED_QUESTIONS: {
    id: 'hundred_questions',
    name: 'Centurion',
    description: 'Answered 100 questions',
    icon: '👑',
    category: 'milestone',
    condition: (user) => user.stats.totalQuestions >= 100
  },
  HIGH_ACCURACY: {
    id: 'high_accuracy',
    name: 'Precision Expert',
    description: 'Maintain 85%+ accuracy with 10+ questions',
    icon: '🎪',
    category: 'performance',
    condition: (user) => {
      const accuracy = user.stats.totalQuestions > 0 ? (user.stats.correctAnswers / user.stats.totalQuestions) * 100 : 0;
      return accuracy >= 85 && user.stats.totalQuestions >= 10;
    }
  },
  PERFECT_SESSION: {
    id: 'perfect_session',
    name: 'Flawless Victory',
    description: 'Complete a practice session with 100% accuracy',
    icon: '💎',
    category: 'performance',
    condition: null // Will be checked during practice submission
  },
  THREE_DAY_STREAK: {
    id: 'three_day_streak',
    name: 'Consistent Learner',
    description: '3-day learning streak',
    icon: '🔥',
    category: 'streak',
    condition: (user) => user.gamification.streakCount >= 3
  },
  SEVEN_DAY_STREAK: {
    id: 'seven_day_streak',
    name: 'Week Warrior',
    description: '7-day learning streak',
    icon: '⚡',
    category: 'streak',
    condition: (user) => user.gamification.streakCount >= 7
  },
  THIRTY_DAY_STREAK: {
    id: 'thirty_day_streak',
    name: 'Dedication Master',
    description: '30-day learning streak',
    icon: '🌟',
    category: 'streak',
    condition: (user) => user.gamification.streakCount >= 30
  },
  FIRST_REFLECTION: {
    id: 'first_reflection',
    name: 'Self-Aware',
    description: 'Complete your first reflection',
    icon: '🧠',
    category: 'metacognitive',
    condition: null // Will be checked during reflection submission
  },
  REFLECTION_ENTHUSIAST: {
    id: 'reflection_enthusiast',
    name: 'Deep Thinker',
    description: 'Complete 10 reflections',
    icon: '🤔',
    category: 'metacognitive',
    condition: null // Will be checked during reflection submission
  },
  EXPLORER: {
    id: 'explorer',
    name: 'Knowledge Explorer',
    description: 'Use the Learn Space feature',
    icon: '🗺️',
    category: 'feature',
    condition: null // Will be checked when using Learn Space
  },
  CONCEPT_MAPPER: {
    id: 'concept_mapper',
    name: 'Mind Mapper',
    description: 'Create your first concept map',
    icon: '🕸️',
    category: 'feature',
    condition: null // Will be checked during concept mapping
  }
};

// Points system
const POINTS = {
  CORRECT_ANSWER: 10,
  PRACTICE_SESSION_COMPLETED: 25,
  PERFECT_PRACTICE_SESSION: 50,
  DAILY_GOAL_ACHIEVED: 100,
  STREAK_BONUS_PER_DAY: 5,
  REFLECTION_COMPLETED: 15,
  HIGH_QUALITY_REFLECTION: 25, // Score >= 8
  LEARN_SPACE_USAGE: 20,
  CONCEPT_MAP_CREATED: 30,
  BADGE_UNLOCKED: 100
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000, 25000, 35000, 50000, 75000, 100000
];

class GamificationService {
  // Award points to a user
  static async awardPoints(userId, pointType, multiplier = 1) {
    try {
      const points = POINTS[pointType] * multiplier;
      const user = await User.findById(userId);
      if (!user) return null;

      user.gamification.points += points;
      
      // Check for level up
      const newLevel = this.calculateLevel(user.gamification.points);
      const leveledUp = newLevel > user.gamification.level;
      user.gamification.level = newLevel;

      await user.save();

      return {
        pointsAwarded: points,
        totalPoints: user.gamification.points,
        newLevel: user.gamification.level,
        leveledUp,
        pointType
      };
    } catch (error) {
      console.error('Error awarding points:', error);
      return null;
    }
  }

  // Calculate user level based on points
  static calculateLevel(points) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // Update daily streak
  static async updateStreak(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActivity = user.gamification.lastActivityDate;
      let streakUpdated = false;

      if (!lastActivity) {
        // First activity ever
        user.gamification.streakCount = 1;
        user.gamification.lastActivityDate = today;
        streakUpdated = true;
      } else {
        const lastActivityDate = new Date(lastActivity);
        lastActivityDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day - increment streak
          user.gamification.streakCount += 1;
          user.gamification.lastActivityDate = today;
          streakUpdated = true;
        } else if (daysDiff > 1) {
          // Streak broken - reset to 1
          user.gamification.streakCount = 1;
          user.gamification.lastActivityDate = today;
          streakUpdated = true;
        }
        // If daysDiff === 0, it's the same day, no update needed
      }

      if (streakUpdated) {
        // Award streak bonus points
        const streakBonus = await this.awardPoints(userId, 'STREAK_BONUS_PER_DAY', user.gamification.streakCount);
        await user.save();
        
        return {
          streakCount: user.gamification.streakCount,
          streakUpdated,
          streakBonus
        };
      }

      return {
        streakCount: user.gamification.streakCount,
        streakUpdated: false
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      return null;
    }
  }

  // Check and award badges
  static async checkAndAwardBadges(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return [];

      const newBadges = [];
      const existingBadgeIds = user.gamification.badges.map(b => b.id);

      // Check each badge condition
      for (const [key, badge] of Object.entries(BADGES)) {
        if (!existingBadgeIds.includes(badge.id) && badge.condition && badge.condition(user)) {
          // Award the badge
          user.gamification.badges.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            category: badge.category,
            unlockedAt: new Date()
          });

          // Award bonus points for unlocking badge
          await this.awardPoints(userId, 'BADGE_UNLOCKED');
          
          newBadges.push(badge);
        }
      }

      if (newBadges.length > 0) {
        await user.save();
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  // Award specific badge (for event-based badges)
  static async awardBadge(userId, badgeId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const badge = Object.values(BADGES).find(b => b.id === badgeId);
      if (!badge) return null;

      const existingBadge = user.gamification.badges.find(b => b.id === badgeId);
      if (existingBadge) return null; // Badge already awarded

      user.gamification.badges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        unlockedAt: new Date()
      });

      await this.awardPoints(userId, 'BADGE_UNLOCKED');
      await user.save();

      return badge;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return null;
    }
  }

  // Update daily progress
  static async updateDailyProgress(userId, progressType, amount = 1) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Reset daily progress if it's a new day
      const progressDate = new Date(user.gamification.todayProgress.date);
      progressDate.setHours(0, 0, 0, 0);

      if (today.getTime() !== progressDate.getTime()) {
        user.gamification.todayProgress = {
          date: today,
          questionsAnswered: 0,
          studyTimeMinutes: 0,
          reflectionsCompleted: 0
        };
      }

      // Update the specific progress type
      switch (progressType) {
        case 'questions':
          user.gamification.todayProgress.questionsAnswered += amount;
          break;
        case 'studyTime':
          user.gamification.todayProgress.studyTimeMinutes += amount;
          break;
        case 'reflections':
          user.gamification.todayProgress.reflectionsCompleted += amount;
          break;
      }

      // Check if daily goals are met
      const dailyGoalsMet = this.checkDailyGoals(user);
      
      await user.save();

      return {
        todayProgress: user.gamification.todayProgress,
        dailyGoals: user.gamification.dailyGoals,
        dailyGoalsMet
      };
    } catch (error) {
      console.error('Error updating daily progress:', error);
      return null;
    }
  }

  // Check if daily goals are met
  static checkDailyGoals(user) {
    const progress = user.gamification.todayProgress;
    const goals = user.gamification.dailyGoals;

    return {
      questions: progress.questionsAnswered >= goals.questionsTarget,
      studyTime: progress.studyTimeMinutes >= goals.studyTimeTarget,
      reflections: progress.reflectionsCompleted >= goals.reflectionsTarget,
      allMet: progress.questionsAnswered >= goals.questionsTarget &&
              progress.studyTimeMinutes >= goals.studyTimeTarget &&
              progress.reflectionsCompleted >= goals.reflectionsTarget
    };
  }

  // Get leaderboard data
  static async getLeaderboard(timeframe = 'all', limit = 10) {
    try {
      let matchCondition = {};
      
      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchCondition = { 'gamification.lastActivityDate': { $gte: weekAgo } };
      } else if (timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchCondition = { 'gamification.lastActivityDate': { $gte: monthAgo } };
      }

      const leaderboard = await User.aggregate([
        { $match: matchCondition },
        {
          $project: {
            name: 1,
            points: '$gamification.points',
            level: '$gamification.level',
            streakCount: '$gamification.streakCount',
            badgeCount: { $size: '$gamification.badges' },
            lastActivity: '$gamification.lastActivityDate'
          }
        },
        { $sort: { points: -1 } },
        { $limit: limit }
      ]);

      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Get user's gamification stats
  static async getUserStats(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const rank = await User.countDocuments({
        'gamification.points': { $gt: user.gamification.points }
      }) + 1;

      return {
        points: user.gamification.points,
        level: user.gamification.level,
        streakCount: user.gamification.streakCount,
        badges: user.gamification.badges,
        rank,
        todayProgress: user.gamification.todayProgress,
        dailyGoals: user.gamification.dailyGoals,
        dailyGoalsMet: this.checkDailyGoals(user)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }
}

module.exports = {
  GamificationService,
  BADGES,
  POINTS,
  LEVEL_THRESHOLDS
};

/**
 * Spaced Repetition Algorithm - SM-2 Algorithm Implementation
 * Calculates optimal review intervals based on user performance
 */

class SpacedRepetitionAlgorithm {
  /**
   * Calculate next review based on user performance
   * @param {Object} cardData - Current spaced repetition data
   * @param {Number} quality - User performance (0-5 scale)
   * @returns {Object} Updated spaced repetition data
   */
  static calculateNextReview(cardData, quality) {
    let { easinessFactor, interval, repetitions } = cardData;
    
    // SM-2 Algorithm implementation
    if (quality >= 3) {
      // Correct response
      repetitions += 1;
      
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easinessFactor);
      }
    } else {
      // Incorrect response - reset
      repetitions = 0;
      interval = 1;
    }
    
    // Update easiness factor
    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easinessFactor = Math.max(1.3, easinessFactor); // Minimum EF is 1.3
    
    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    // Determine mastery level
    let masteryLevel = 'new';
    if (repetitions >= 8 && easinessFactor >= 2.5) {
      masteryLevel = 'mastered';
    } else if (repetitions >= 3) {
      masteryLevel = 'reviewing';
    } else if (repetitions >= 1) {
      masteryLevel = 'learning';
    }
    
    return {
      easinessFactor,
      interval,
      repetitions,
      nextReviewDate,
      lastReviewed: new Date(),
      masteryLevel
    };
  }
  
  /**
   * Get due cards for review
   * @param {String} userId - User ID
   * @returns {Array} Due cards for review
   */
  static async getDueCards(userId) {
    const SpacedRepetition = require('../models/SpacedRepetition');
    
    const now = new Date();
    return await SpacedRepetition.find({
      user: userId,
      nextReviewDate: { $lte: now }
    }).populate('question').sort({ nextReviewDate: 1 });
  }
  
  /**
   * Get learning statistics
   * @param {String} userId - User ID
   * @returns {Object} Learning statistics
   */
  static async getLearningStats(userId) {
    const SpacedRepetition = require('../models/SpacedRepetition');
    
    const stats = await SpacedRepetition.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$masteryLevel',
          count: { $sum: 1 },
          avgEasinessFactor: { $avg: '$easinessFactor' },
          avgInterval: { $avg: '$interval' }
        }
      }
    ]);
    
    const dueToday = await SpacedRepetition.countDocuments({
      user: userId,
      nextReviewDate: { $lte: new Date() }
    });
    
    return {
      masteryDistribution: stats,
      dueToday,
      totalCards: stats.reduce((sum, stat) => sum + stat.count, 0)
    };
  }
}

module.exports = SpacedRepetitionAlgorithm;
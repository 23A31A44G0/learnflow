const express = require('express');
const router = express.Router();
const Question = require('../../../models/Question');
const auth = require('../../../middleware/auth');

// SM-2 Algorithm Implementation
function calculateSM2(card, quality) {
  let { easinessFactor, interval, repetitions } = card;
  
  // Update repetitions and interval
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
  
  return {
    easinessFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastReviewed: new Date()
  };
}

// POST /api/v1/submit-review
router.post('/', auth, async (req, res) => {
  try {
    const { questionId, quality, timeTaken } = req.body;
    
    // Validate quality score (0-5 scale)
    if (quality < 0 || quality > 5 || !Number.isInteger(quality)) {
      return res.status(400).json({
        success: false,
        message: 'Quality must be an integer between 0 and 5'
      });
    }

    const card = await Question.findOne({
      _id: questionId,
      user: req.user.userId
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Run SM-2 algorithm
    const updatedData = calculateSM2(card, quality);
    
    // Update the card with new algorithm data
    const updatedCard = await Question.findByIdAndUpdate(
      questionId,
      {
        ...updatedData,
        quality,
        totalReviews: card.totalReviews + 1,
        correctReviews: card.correctReviews + (quality >= 3 ? 1 : 0)
      },
      { new: true }
    );

    // Calculate performance metrics
    const accuracyRate = (updatedCard.correctReviews / updatedCard.totalReviews) * 100;
    
    res.json({
      success: true,
      data: {
        updatedCard: {
          id: updatedCard._id,
          easinessFactor: updatedCard.easinessFactor,
          interval: updatedCard.interval,
          repetitions: updatedCard.repetitions,
          nextReviewDate: updatedCard.nextReviewDate,
          accuracyRate: Math.round(accuracyRate)
        },
        feedback: {
          message: quality >= 3 ? 'Correct! Well done.' : 'Incorrect. Review this concept.',
          nextReview: `Next review in ${updatedData.interval} day${updatedData.interval !== 1 ? 's' : ''}`,
          isCorrect: quality >= 3
        }
      }
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing review submission'
    });
  }
});

module.exports = router;
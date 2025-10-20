const express = require('express');
const router = express.Router();
const Question = require('../../../models/Question');
const auth = require('../../../middleware/auth');

// GET /api/v1/get-next-card
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentTime = new Date();

    // Find the next due card based on nextReviewDate
    const nextCard = await Question.findOne({
      user: userId,
      nextReviewDate: { $lte: currentTime }
    })
    .sort({ nextReviewDate: 1 }) // Oldest due cards first
    .populate('studySession', 'originalText createdAt');

    if (!nextCard) {
      // No cards due, get the next upcoming card
      const upcomingCard = await Question.findOne({
        user: userId
      })
      .sort({ nextReviewDate: 1 })
      .populate('studySession', 'originalText createdAt');

      return res.json({
        success: true,
        data: {
          card: upcomingCard,
          isDue: false,
          nextDueTime: upcomingCard ? upcomingCard.nextReviewDate : null,
          message: upcomingCard ? 'No cards due now. Next review available.' : 'No cards available.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        card: nextCard,
        isDue: true,
        dueCardsCount: await Question.countDocuments({
          user: userId,
          nextReviewDate: { $lte: currentTime }
        })
      }
    });

  } catch (error) {
    console.error('Error fetching next card:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching next card'
    });
  }
});

module.exports = router;
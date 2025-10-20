const express = require('express');
const router = express.Router();
const SpacedRepetition = require('../models/SpacedRepetition');
const Question = require('../models/Question');
const SpacedRepetitionAlgorithm = require('../utils/spacedRepetitionAlgorithm');
const auth = require('../middleware/auth');

// Get due cards for review
router.get('/due', auth, async (req, res) => {
  try {
    const dueCards = await SpacedRepetitionAlgorithm.getDueCards(req.user.userId);
    
    res.json({
      success: true,
      data: {
        cards: dueCards,
        count: dueCards.length
      }
    });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching due cards'
    });
  }
});

// Submit review result
router.post('/review/:cardId', auth, async (req, res) => {
  try {
    const { cardId } = req.params;
    const { quality } = req.body; // 0-5 performance score
    
    if (quality < 0 || quality > 5) {
      return res.status(400).json({
        success: false,
        message: 'Quality must be between 0 and 5'
      });
    }
    
    const card = await SpacedRepetition.findOne({
      _id: cardId,
      user: req.user.userId
    });
    
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    // Calculate next review using SM-2 algorithm
    const updatedData = SpacedRepetitionAlgorithm.calculateNextReview(card, quality);
    
    // Update the card
    await SpacedRepetition.findByIdAndUpdate(cardId, {
      ...updatedData,
      difficulty: quality
    });
    
    res.json({
      success: true,
      data: {
        nextReviewDate: updatedData.nextReviewDate,
        interval: updatedData.interval,
        masteryLevel: updatedData.masteryLevel
      }
    });
  } catch (error) {
    console.error('Error updating spaced repetition:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
});

// Get learning statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await SpacedRepetitionAlgorithm.getLearningStats(req.user.userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching learning stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

// Create spaced repetition cards for new questions
router.post('/create-cards', auth, async (req, res) => {
  try {
    const { questionIds } = req.body;
    
    const cards = questionIds.map(questionId => ({
      user: req.user.userId,
      question: questionId,
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: new Date(),
      masteryLevel: 'new'
    }));
    
    await SpacedRepetition.insertMany(cards);
    
    res.json({
      success: true,
      message: 'Spaced repetition cards created',
      data: { cardsCreated: cards.length }
    });
  } catch (error) {
    console.error('Error creating spaced repetition cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating cards'
    });
  }
});

module.exports = router;
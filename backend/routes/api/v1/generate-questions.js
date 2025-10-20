const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const StudySession = require('../../../models/StudySession');
const Question = require('../../../models/Question');
const auth = require('../../../middleware/auth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/v1/generate-questions
router.post('/', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 50 characters of text for question generation'
      });
    }

    // AI Integration with carefully engineered prompt
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
From the following text, create exactly 10 flashcard questions with clear, concise answers. 
Return the response as a JSON array in this exact format:
[
  {
    "question": "Clear, specific question here",
    "answer": "Concise, accurate answer here",
    "type": "flashcard",
    "difficulty": "easy|medium|hard"
  }
]

Guidelines:
- Questions should test key concepts, definitions, and important facts
- Answers should be 1-3 sentences maximum
- Include a mix of difficulty levels
- Focus on the most important information
- Make questions specific and testable

Text to analyze:
${text}

Return only valid JSON, no additional text or formatting.
    `;

    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text();
    
    // Clean up the AI response
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Error processing AI response'
      });
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Invalid questions generated'
      });
    }

    // Create study session record
    const studySession = new StudySession({
      user: req.user.userId,
      originalText: text,
      generatedQuestions: parsedQuestions
    });
    
    await studySession.save();

    // Create individual question records for spaced repetition
    const questionRecords = parsedQuestions.map(q => ({
      user: req.user.userId,
      studySession: studySession._id,
      question: q.question,
      answer: q.answer,
      type: q.type || 'flashcard',
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: new Date(),
      totalReviews: 0,
      correctReviews: 0
    }));

    const savedQuestions = await Question.insertMany(questionRecords);

    res.json({
      success: true,
      data: {
        studySessionId: studySession._id,
        questions: savedQuestions,
        questionsCount: savedQuestions.length
      }
    });

  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating questions'
    });
  }
});

module.exports = router;
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { body, validationResult } = require('express-validator');
const QuestionSet = require('../models/QuestionSet');
const Question = require('../models/Question');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate questions from text
router.post('/generate', auth, [
  body('text').trim().notEmpty().withMessage('Text is required for question generation')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        message: 'Gemini API key not configured. Please set GEMINI_API_KEY in environment variables.' 
      });
    }

    // Create prompt for Gemini
    const prompt = `Based on the following text, generate 5 educational questions that test comprehension and recall. 
    Format the response as a JSON array where each question has the following structure:
    {
      "question": "The question text",
      "answer": "The correct answer",
      "type": "short-answer",
      "explanation": "Brief explanation of the answer (optional)"
    }

    Text: "${text}"

    Generate questions that cover key concepts, facts, and relationships mentioned in the text. Make the questions clear and specific. Always include both question and answer fields. Respond only with valid JSON.`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    let generatedQuestions;
    try {
      // Remove any markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Raw AI response:', jsonText); // Debug log
      const rawQuestions = JSON.parse(jsonText);
      console.log('Parsed AI questions:', rawQuestions); // Debug log
      
      // Transform and validate the questions
      generatedQuestions = rawQuestions.map(q => ({
        question: q.question,
        answer: q.answer || q.correctAnswer || 'No answer provided', // Provide default
        type: q.type || 'short-answer',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium'
      }));
      
      console.log('Transformed questions:', generatedQuestions); // Debug log
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return res.status(500).json({ 
        message: 'Failed to generate questions. Please try again.' 
      });
    }

    // Save questions to database
    const questionDoc = new QuestionSet({
      userId: req.user._id,
      sourceText: text,
      questions: generatedQuestions
    });

    await questionDoc.save();

    res.json({
      id: questionDoc._id,
      questions: generatedQuestions,
      message: 'Questions generated successfully!'
    });

  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate questions. Please try again.' 
    });
  }
});

// Get user's question sets
router.get('/my-questions', auth, async (req, res) => {
  try {
    const questions = await QuestionSet.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(questions);
  } catch (error) {
    console.error('Fetch questions error:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Get specific question set
router.get('/:id', auth, async (req, res) => {
  try {
    let question;
    
    if (req.params.id === 'recent') {
      // Handle 'recent' as a special case - get the most recent question set
      question = await QuestionSet.findOne({ 
        userId: req.user._id 
      }).sort({ createdAt: -1 });
    } else {
      // Handle normal ObjectId
      question = await QuestionSet.findOne({ 
        _id: req.params.id, 
        userId: req.user._id 
      });
    }

    if (!question) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    res.json(question);
  } catch (error) {
    console.error('Fetch question error:', error);
    res.status(500).json({ message: 'Failed to fetch question set' });
  }
});

module.exports = router;

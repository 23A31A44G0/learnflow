const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { body, validationResult } = require('express-validator');
const MetacognitiveReflection = require('../models/MetacognitiveReflection');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Reflection prompts based on different contexts
const REFLECTION_PROMPTS = {
  'post-practice': [
    "How confident do you feel about the concepts you just practiced? What made some questions easier or harder than others?",
    "What strategies did you use to recall information? Which ones worked best for you?",
    "If you had to explain the most challenging concept to a friend, how would you approach it?",
    "What patterns did you notice in the questions you got wrong? How can you improve next time?"
  ],
  'post-study': [
    "What was the most surprising thing you learned from this material? Why did it stand out?",
    "How did you organize the information in your mind? What connections did you make?",
    "What questions do you still have about this topic? What would you like to explore further?",
    "How does this new knowledge connect to what you already knew? What changed your understanding?"
  ],
  'weekly-review': [
    "Looking back at this week's learning, what concepts feel most solid? Which ones need more attention?",
    "What learning strategies worked well for you this week? What didn't work as expected?",
    "How has your understanding of the subject evolved over the past week?",
    "What would you do differently if you were to learn these concepts again?"
  ],
  'difficulty-encountered': [
    "What specifically made this concept challenging for you? Was it the complexity, unfamiliar terms, or something else?",
    "What strategies have you tried to understand this better? Which ones helped even a little?",
    "How do you typically approach difficult material? What's worked for you in the past?",
    "What questions would you ask a teacher or expert to help clarify this concept?"
  ],
  'concept-mastery': [
    "How would you explain this concept to someone who's never heard of it before?",
    "What real-world examples or analogies help you remember this concept?",
    "What other concepts does this connect to? How do they influence each other?",
    "If you were designing a test question about this, what would be the most important thing to assess?"
  ]
};

// Get appropriate reflection prompt based on context
router.post('/prompt', auth, [
  body('context.sessionType').notEmpty().withMessage('Session type is required'),
  body('context.performanceScore').optional().isNumeric(),
  body('context.conceptsStudied').optional().isArray(),
  body('context.timeSpent').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { context } = req.body;
    
    // Determine prompt type based on context
    let promptType = 'post-practice';
    
    if (context.sessionType === 'study') {
      promptType = 'post-study';
    } else if (context.performanceScore !== undefined && context.performanceScore < 60) {
      promptType = 'difficulty-encountered';
    } else if (context.performanceScore !== undefined && context.performanceScore > 85) {
      promptType = 'concept-mastery';
    }

    // Select random prompt from the appropriate category
    const prompts = REFLECTION_PROMPTS[promptType];
    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    res.json({
      promptType,
      prompt: selectedPrompt,
      context,
      message: 'Reflection prompt generated successfully'
    });

  } catch (error) {
    console.error('Reflection prompt error:', error);
    res.status(500).json({ 
      message: 'Failed to generate reflection prompt' 
    });
  }
});

// Submit reflection and get AI analysis
router.post('/reflect', auth, [
  body('promptType').notEmpty().withMessage('Prompt type is required'),
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('userResponse').trim().notEmpty().withMessage('User response is required'),
  body('context').isObject().withMessage('Context is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { promptType, prompt, userResponse, context } = req.body;

    // Generate AI analysis of the reflection
    let aiAnalysis = {};
    
    if (process.env.GEMINI_API_KEY) {
      try {
        const analysisPrompt = `Analyze this student's metacognitive reflection and provide educational insights.

        Learning Context: ${context.sessionType || 'general'} session
        Performance: ${context.performanceScore ? context.performanceScore + '%' : 'N/A'}
        Concepts Studied: ${context.conceptsStudied ? context.conceptsStudied.join(', ') : 'N/A'}
        
        Reflection Prompt: "${prompt}"
        Student Response: "${userResponse}"
        
        Please analyze this reflection and respond with a JSON object:
        {
          "insights": "2-3 key insights about the student's learning process and self-awareness",
          "learningPatterns": ["pattern1", "pattern2", "pattern3"],
          "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
          "metacognitiveScore": 7
        }
        
        The metacognitiveScore (1-10) should reflect how thoughtful and self-aware the reflection is.
        Focus on encouraging growth mindset and effective learning strategies.
        
        Respond only with valid JSON.`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(analysisPrompt);
        const response = await result.response;
        const responseText = response.text();

        const jsonText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        aiAnalysis = JSON.parse(jsonText);
        
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        // Provide fallback analysis
        aiAnalysis = {
          insights: "Thank you for taking time to reflect on your learning. Self-reflection is a powerful tool for academic growth.",
          learningPatterns: ["Shows engagement with material", "Demonstrates self-awareness"],
          suggestions: ["Continue regular reflection", "Try different learning strategies", "Connect new concepts to prior knowledge"],
          metacognitiveScore: 6
        };
      }
    }

    // Save reflection to database
    const reflection = new MetacognitiveReflection({
      userId: req.user._id,
      promptType,
      prompt,
      userResponse,
      aiAnalysis,
      context
    });

    await reflection.save();

    res.json({
      reflection: {
        id: reflection._id,
        promptType: reflection.promptType,
        prompt: reflection.prompt,
        userResponse: reflection.userResponse,
        aiAnalysis: reflection.aiAnalysis,
        createdAt: reflection.createdAt
      },
      message: 'Reflection submitted and analyzed successfully'
    });

  } catch (error) {
    console.error('Reflection submission error:', error);
    res.status(500).json({ 
      message: 'Failed to submit reflection' 
    });
  }
});

// Get user's reflection history
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reflections = await MetacognitiveReflection.find({ 
      userId: req.user._id 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalReflections = await MetacognitiveReflection.countDocuments({ 
      userId: req.user._id 
    });

    // Calculate learning insights
    const recentReflections = await MetacognitiveReflection.find({
      userId: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    const averageMetacognitiveScore = recentReflections.reduce((sum, r) => 
      sum + (r.aiAnalysis.metacognitiveScore || 0), 0) / Math.max(recentReflections.length, 1);

    const commonPatterns = {};
    recentReflections.forEach(r => {
      if (r.aiAnalysis.learningPatterns) {
        r.aiAnalysis.learningPatterns.forEach(pattern => {
          commonPatterns[pattern] = (commonPatterns[pattern] || 0) + 1;
        });
      }
    });

    const topPatterns = Object.entries(commonPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern);

    res.json({
      reflections,
      pagination: {
        current: page,
        total: Math.ceil(totalReflections / limit),
        hasNext: page < Math.ceil(totalReflections / limit),
        hasPrev: page > 1
      },
      insights: {
        totalReflections: totalReflections,
        recentReflections: recentReflections.length,
        averageMetacognitiveScore: Math.round(averageMetacognitiveScore * 10) / 10,
        topLearningPatterns: topPatterns
      }
    });

  } catch (error) {
    console.error('Reflection history error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch reflection history' 
    });
  }
});

// Get reflection analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30'; // days
    const startDate = new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000);

    const reflections = await MetacognitiveReflection.find({
      userId: req.user._id,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Group by week for trend analysis
    const weeklyData = {};
    reflections.forEach(reflection => {
      const weekStart = new Date(reflection.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          count: 0,
          totalScore: 0,
          promptTypes: {}
        };
      }
      
      weeklyData[weekKey].count += 1;
      weeklyData[weekKey].totalScore += reflection.aiAnalysis.metacognitiveScore || 0;
      
      const promptType = reflection.promptType;
      weeklyData[weekKey].promptTypes[promptType] = 
        (weeklyData[weekKey].promptTypes[promptType] || 0) + 1;
    });

    const trendData = Object.entries(weeklyData).map(([week, data]) => ({
      week,
      reflectionCount: data.count,
      averageScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 10) / 10 : 0,
      promptTypes: data.promptTypes
    }));

    res.json({
      timeframe: `${timeframe} days`,
      totalReflections: reflections.length,
      trendData,
      overallProgress: {
        firstScore: reflections.length > 0 ? reflections[0].aiAnalysis.metacognitiveScore || 0 : 0,
        latestScore: reflections.length > 0 ? reflections[reflections.length - 1].aiAnalysis.metacognitiveScore || 0 : 0,
        improvement: reflections.length > 1 ? 
          (reflections[reflections.length - 1].aiAnalysis.metacognitiveScore || 0) - 
          (reflections[0].aiAnalysis.metacognitiveScore || 0) : 0
      }
    });

  } catch (error) {
    console.error('Reflection analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch reflection analytics' 
    });
  }
});

module.exports = router;

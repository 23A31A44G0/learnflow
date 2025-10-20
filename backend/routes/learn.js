const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const router = express.Router();

// Initialize Gemini AI
console.log('Initializing Gemini AI with key:', process.env.GEMINI_API_KEY ? 'Key exists' : 'Key is missing');
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables!');
}

// Create the Gemini AI instance
const genAI = new GoogleGenerativeAI(apiKey);

// Updated model names for the latest Gemini API
// We'll try these specific model IDs which should work with the API
const AVAILABLE_MODELS = [
  'models/gemini-pro', 
  'models/gemini-1.0-pro-001',
  'models/gemini-1.0-pro-vision-001',
  'models/gemini-pro-vision'
];

// Helper function to try generating content with multiple models as fallbacks
async function generateWithFallback(prompt, modelIndex = 0) {
  if (modelIndex >= AVAILABLE_MODELS.length) {
    throw new Error('All available models failed to generate content');
  }

  const modelName = AVAILABLE_MODELS[modelIndex];
  console.log(`Attempting to use model: ${modelName}`);
  
  try {
    // Remove 'models/' prefix if it exists in the model name for the API call
    const apiModelName = modelName.replace('models/', '');
    const model = genAI.getGenerativeModel({ model: apiModelName });
    const result = await model.generateContent(prompt);
    console.log(`Successfully generated content with model: ${modelName}`);
    return result.response.text();
  } catch (error) {
    console.error(`Error with model ${modelName}:`, error.message);
    // Try next model
    return generateWithFallback(prompt, modelIndex + 1);
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  },
});

// AI-powered concept explanation
router.post('/explain-concept', [
  body('concept').notEmpty().withMessage('Concept is required'),
  body('context').optional().isString(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    console.log('Received explain-concept request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { concept, context = '', difficulty = 'intermediate' } = req.body;
    console.log('Processing concept:', concept, 'with difficulty:', difficulty);

    const prompt = `As an expert educator, provide a comprehensive explanation of the concept: "${concept}"
    
    ${context ? `Context: ${context}` : ''}
    
    Difficulty Level: ${difficulty}
    
    Please structure your explanation as follows:
    1. Clear Definition: What is this concept?
    2. Key Components: Break down the main elements
    3. Real-world Applications: Where and how is it used?
    4. Examples: Provide 2-3 concrete examples
    5. Common Misconceptions: What do people often get wrong?
    6. Related Concepts: What other topics connect to this?
    
    Make the explanation appropriate for ${difficulty} level learners.
    Use clear, engaging language and avoid unnecessary jargon.`;

    console.log('Sending prompt to Gemini AI:', prompt.substring(0, 100) + '...');
    
    try {
      // Use our helper function to try multiple models with fallback
      const explanation = await generateWithFallback(prompt);
      
      console.log('Received explanation from Gemini AI:', explanation.substring(0, 100) + '...');

      res.json({
        success: true,
        explanation,
        concept,
        difficulty
      });
    } catch (aiError) {
      console.error('Gemini AI error:', aiError);
      res.status(500).json({ 
        message: 'Failed to generate concept explanation using AI',
        error: aiError.message,
        apiKeyExists: !!process.env.GEMINI_API_KEY
      });
    }

  } catch (error) {
    console.error('Concept explanation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate concept explanation',
      error: error.message 
    });
  }
});

// Socratic tutoring (guided dialogue)
router.post('/socratic-dialogue', [
  body('question').notEmpty().withMessage('Question is required'),
  body('context').optional().isString(),
  body('previousDialogue').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, context = '', previousDialogue = [] } = req.body;

    // We'll use our generateWithFallback helper function

    // Build conversation history
    let conversationHistory = '';
    if (previousDialogue.length > 0) {
      conversationHistory = 'Previous conversation:\n' + 
        previousDialogue.map(item => `${item.role}: ${item.content}`).join('\n') + '\n\n';
    }

    const prompt = `You are a Socratic tutor helping a student understand concepts through guided questioning and discovery.
    
    ${context ? `Context: ${context}` : ''}
    
    ${conversationHistory}
    
    Student's current question/response: "${question}"
    
    Your role is to:
    1. Ask thought-provoking questions that guide the student to discover answers themselves
    2. Provide hints when the student is stuck, but avoid giving direct answers
    3. Encourage critical thinking and deeper reflection
    4. Build on the student's existing knowledge
    5. Use analogies and examples to clarify complex ideas
    
    Respond with a guiding question or gentle prompt that helps the student think deeper about the topic.
    Keep your response concise (2-3 sentences max) and engaging.`;

    // Use our helper function to try multiple models with fallback
    const response = await generateWithFallback(prompt);

    res.json({
      success: true,
      response,
      role: 'tutor'
    });

  } catch (error) {
    console.error('Socratic dialogue error:', error);
    res.status(500).json({ 
      message: 'Failed to generate Socratic response',
      error: error.message 
    });
  }
});

// Generate concept map from text
router.post('/generate-concept-map', [
  body('text').notEmpty().withMessage('Text content is required'),
  body('focusConcept').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, focusConcept = '' } = req.body;

    // We'll use our generateWithFallback helper function

    const prompt = `Analyze the following text and create a concept map structure.
    
    Text: "${text}"
    
    ${focusConcept ? `Focus on this main concept: ${focusConcept}` : ''}
    
    Generate a JSON structure representing a concept map with:
    - nodes: Each representing a key concept with id, label, and importance level
    - links: Connections between concepts with relationship labels
    
    Format your response as valid JSON:
    {
      "nodes": [
        {"id": "concept1", "label": "Main Concept", "level": 1, "x": 300, "y": 150},
        {"id": "concept2", "label": "Related Concept", "level": 2, "x": 150, "y": 250}
      ],
      "links": [
        {"source": "concept1", "target": "concept2", "label": "leads to", "strength": 0.8}
      ]
    }
    
    Include 5-10 key concepts maximum, with appropriate positioning coordinates.
    Use importance levels: 1 (main), 2 (supporting), 3 (detail).`;

    // Use our helper function to try multiple models with fallback
    let conceptMapData = await generateWithFallback(prompt);

    // Clean the response to extract JSON
    conceptMapData = conceptMapData.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();

    try {
      const parsedMap = JSON.parse(conceptMapData);
      res.json({
        success: true,
        conceptMap: parsedMap
      });
    } catch (parseError) {
      console.error('Failed to parse concept map JSON:', parseError);
      res.status(500).json({ 
        message: 'Failed to generate valid concept map structure' 
      });
    }

  } catch (error) {
    console.error('Concept map generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate concept map',
      error: error.message 
    });
  }
});

// Process PDF/text file for learning
router.post('/process-document', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let textContent = '';
    
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;
    } else if (req.file.mimetype === 'text/plain') {
      textContent = fs.readFileSync(req.file.path, 'utf8');
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (!textContent.trim()) {
      return res.status(400).json({ message: 'No text content found in file' });
    }

    // Generate summary and key concepts
    // We'll use our generateWithFallback helper function

    const prompt = `Analyze this document and provide:
    
    1. A concise summary (2-3 paragraphs)
    2. Key concepts (5-8 main ideas)
    3. Important terms and definitions
    4. Potential study questions
    
    Document text: "${textContent.substring(0, 4000)}"
    
    Format as JSON:
    {
      "summary": "...",
      "keyConcepts": ["concept1", "concept2", ...],
      "terms": [{"term": "...", "definition": "..."}, ...],
      "studyQuestions": ["question1", "question2", ...]
    }`;

    // Use our helper function to try multiple models with fallback
    let analysisData = await generateWithFallback(prompt);

    // Clean the response to extract JSON
    analysisData = analysisData.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();

    try {
      const analysis = JSON.parse(analysisData);
      res.json({
        success: true,
        filename: req.file.originalname,
        analysis,
        textLength: textContent.length
      });
    } catch (parseError) {
      console.error('Failed to parse document analysis JSON:', parseError);
      res.json({
        success: true,
        filename: req.file.originalname,
        textContent: textContent.substring(0, 1000) + '...',
        textLength: textContent.length
      });
    }

  } catch (error) {
    console.error('Document processing error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Failed to process document',
      error: error.message 
    });
  }
});

module.exports = router;

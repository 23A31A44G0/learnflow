const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Extract text from PDF and generate summary
router.post('/extract-and-summarize', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    // Extract text from PDF
    const pdfData = await pdf(req.file.buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No text could be extracted from the PDF'
      });
    }

    // Generate summary using Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const summaryPrompt = `
      Please provide a comprehensive summary of the following text in a structured format:
      
      1. Main Topic/Subject
      2. Key Points (bullet points)
      3. Important Concepts or Definitions
      4. Conclusions or Takeaways
      
      Text to summarize:
      ${extractedText.substring(0, 8000)} // Limit text to avoid token limits
    `;

    const summaryResult = await model.generateContent(summaryPrompt);
    const summary = summaryResult.response.text();

    // Also generate questions from the extracted text
    const questionPrompt = `
      Based on the following text, generate 10 diverse study questions that test comprehension and key concepts:
      
      ${extractedText.substring(0, 6000)}
      
      Format each question as:
      Q: [Question]
      A: [Answer]
      
      Include a mix of factual, conceptual, and analytical questions.
    `;

    const questionResult = await model.generateContent(questionPrompt);
    const questionsText = questionResult.response.text();

    // Parse questions
    const questions = [];
    const questionBlocks = questionsText.split(/Q:\s*/).slice(1);
    
    questionBlocks.forEach((block, index) => {
      const parts = block.split(/A:\s*/);
      if (parts.length >= 2) {
        questions.push({
          id: `pdf_q_${Date.now()}_${index}`,
          question: parts[0].trim(),
          answer: parts[1].trim(),
          type: 'comprehension',
          source: 'pdf'
        });
      }
    });

    res.json({
      success: true,
      data: {
        extractedText: extractedText.substring(0, 2000) + '...', // Preview only
        summary,
        questions: questions.slice(0, 10), // Limit to 10 questions
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          totalPages: pdfData.numpages,
          textLength: extractedText.length
        }
      }
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    
    if (error.message.includes('Only PDF files')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid PDF file'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error processing PDF file'
    });
  }
});

// Extract text only from PDF
router.post('/extract-text', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    const pdfData = await pdf(req.file.buffer);
    const extractedText = pdfData.text;

    res.json({
      success: true,
      data: {
        text: extractedText,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          totalPages: pdfData.numpages,
          textLength: extractedText.length
        }
      }
    });

  } catch (error) {
    console.error('PDF text extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error extracting text from PDF'
    });
  }
});

module.exports = router;
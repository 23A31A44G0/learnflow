const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API v1 Routes (Technical Requirements Structure)
const generateQuestionsRoute = require('./routes/api/v1/generate-questions');
const getNextCardRoute = require('./routes/api/v1/get-next-card');
const submitReviewRoute = require('./routes/api/v1/submit-review');

// Legacy routes (maintain compatibility)
const authRoutes = require('./routes/auth');
const questionsRoutes = require('./routes/questions');
const practiceRoutes = require('./routes/practice');
const spacedRepetitionRoutes = require('./routes/spacedRepetition');
const pdfRoutes = require('./routes/pdf');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const alphaEmailRoutes = require('./routes/alphaEmails');
const learnRoutes = require('./routes/learn');
const metacognitiveRoutes = require('./routes/metacognitive');
const gamificationRoutes = require('./routes/gamification');

// API v1 Routes
app.use('/api/v1/generate-questions', generateQuestionsRoute);
app.use('/api/v1/get-next-card', getNextCardRoute);
app.use('/api/v1/submit-review', submitReviewRoute);

// Legacy API routes (maintain backward compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/spaced-repetition', spacedRepetitionRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/metacognitive', metacognitiveRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alpha-emails', alphaEmailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'LearnFlow Backend is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

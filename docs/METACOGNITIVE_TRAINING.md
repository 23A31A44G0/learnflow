# Metacognitive Training Module

## Overview

The Metacognitive Training Module is designed to help learners develop self-awareness about their learning processes, strategies, and effectiveness. It uses AI-powered prompts and analysis to guide users through structured reflection after learning activities.

## Features

### 1. Automated Prompt Triggers
- **Post-Practice Prompts**: Triggered after completing practice sessions
  - Low performance (<50%): Difficulty analysis prompts
  - High performance (≥80%): Confidence assessment prompts
  - Moderate performance (50-79%): Comprehension reflection prompts

- **Post-Study Prompts**: Triggered after learning activities
  - Explanation reading: Strategy reflection prompts
  - Concept mapping: Connection analysis prompts

### 2. AI-Powered Analysis
Each reflection is analyzed using Gemini AI to provide:
- **Metacognitive Score** (0-10): Quality assessment of self-reflection
- **Key Insights**: Personalized observations about learning patterns
- **Learning Patterns**: Identified behavioral and cognitive patterns
- **Personalized Suggestions**: Actionable recommendations for improvement

### 3. Dashboard Analytics
The Self-Awareness Dashboard provides:
- Average reflection quality score and trends
- Total reflections completed
- Consistency metrics (reflections per week)
- Identified strengths and growth areas
- Common learning patterns analysis
- Historical reflection review with detailed insights

## Technical Implementation

### Backend Components

#### 1. Database Model (`MetacognitiveReflection.js`)
```javascript
const reflectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  promptType: { 
    type: String, 
    enum: ['comprehension', 'strategy', 'confidence', 'difficulty', 'connection'],
    required: true 
  },
  prompt: { type: String, required: true },
  userResponse: { type: String, required: true },
  context: {
    sessionType: String,
    performanceScore: Number,
    conceptsStudied: [String],
    timeSpent: Number,
    difficultyLevel: String
  },
  aiAnalysis: {
    metacognitiveScore: Number,
    insights: String,
    learningPatterns: [String],
    suggestions: [String]
  },
  createdAt: { type: Date, default: Date.now }
});
```

#### 2. API Routes (`metacognitive.js`)
- `POST /api/metacognitive/prompt`: Get contextualized reflection prompt
- `POST /api/metacognitive/reflect`: Submit reflection and get AI analysis
- `GET /api/metacognitive/reflections`: Retrieve user's reflection history
- `GET /api/metacognitive/analytics`: Get comprehensive analytics and insights

### Frontend Components

#### 1. PromptModal Component
- **Purpose**: Interactive modal for collecting user reflections
- **Features**:
  - Context-aware prompts based on learning activity
  - Session summary display (performance, time spent, concepts)
  - Real-time AI analysis and feedback
  - Quality score visualization
  - Insight display with learning patterns and suggestions

#### 2. MetacognitiveDashboard Component
- **Purpose**: Comprehensive view of metacognitive development
- **Features**:
  - Key metrics with trend analysis
  - Strengths and growth areas identification
  - Learning pattern visualization
  - Detailed reflection history with search and filtering
  - Individual reflection review with complete AI analysis

#### 3. MetacognitiveSummaryCard Component
- **Purpose**: Dashboard widget showing quick overview
- **Features**:
  - Current average score with visual progress
  - Recent reflection count and improvement trends
  - Quick navigation to full dashboard

### Integration Points

#### 1. Practice Sessions
- Automatically triggers metacognitive prompts after completing practice
- Provides session context (score, time, concepts, difficulty)
- Adapts prompt type based on performance level

#### 2. Learn Space Activities
- Triggers prompts after AI explanation sessions
- Prompts after concept mapping activities
- Tracks study time and concepts covered

#### 3. Dashboard Integration
- Metacognitive summary card for quick insights
- Direct navigation to Self-Awareness dashboard
- Integration with overall learning analytics

## Prompt Types and Contexts

### 1. Comprehension Prompts
**When**: Moderate practice performance (50-79%)
**Focus**: Understanding and knowledge retention
**Example**: "Reflect on what you understood well and what concepts still feel unclear. What specific aspects would you like to explore further?"

### 2. Strategy Prompts
**When**: After study/explanation sessions
**Focus**: Learning strategies and approaches
**Example**: "What learning strategies did you use during this session? How effective were they, and what might you try differently next time?"

### 3. Confidence Prompts
**When**: High practice performance (≥80%)
**Focus**: Self-efficacy and knowledge confidence
**Example**: "You performed well on this practice. How confident do you feel about applying this knowledge in new situations?"

### 4. Difficulty Prompts
**When**: Low practice performance (<50%)
**Focus**: Challenge identification and problem-solving
**Example**: "What made this practice challenging? What specific support or resources would help you improve in these areas?"

### 5. Connection Prompts
**When**: After concept mapping activities
**Focus**: Conceptual relationships and integration
**Example**: "How do the concepts you mapped relate to what you already know? What new connections did you discover?"

## Usage Examples

### Example 1: Post-Practice Reflection
1. User completes a practice session with 45% score
2. System triggers difficulty analysis prompt
3. User reflects on challenges faced
4. AI analyzes response and provides:
   - Metacognitive score: 7/10
   - Insight: "Shows good self-awareness of specific knowledge gaps"
   - Patterns: ["Challenge identification", "Resource seeking"]
   - Suggestions: ["Focus on foundational concepts", "Use spaced repetition"]

### Example 2: Post-Study Reflection
1. User spends 15 minutes reading AI explanations
2. System triggers strategy reflection prompt
3. User reflects on learning approach
4. AI provides personalized insights about learning strategies and effectiveness

## Benefits for Learners

### 1. Enhanced Self-Awareness
- Better understanding of learning strengths and weaknesses
- Recognition of effective and ineffective strategies
- Awareness of knowledge gaps and misconceptions

### 2. Improved Learning Strategies
- Data-driven insights about what works
- Personalized recommendations for improvement
- Development of metacognitive skills over time

### 3. Motivation and Engagement
- Visible progress tracking through reflection scores
- Celebration of learning achievements and growth
- Increased ownership of learning process

### 4. Long-term Development
- Building lifelong learning skills
- Development of critical thinking and self-reflection
- Enhanced academic and professional performance

## Future Enhancements

### 1. Advanced Analytics
- Cross-session pattern recognition
- Predictive insights for learning outcomes
- Integration with learning science research

### 2. Personalization
- Adaptive prompt selection based on user preferences
- Customizable reflection frequencies
- Learning style-based recommendations

### 3. Social Features
- Anonymous peer comparison insights
- Collaborative reflection activities
- Mentor/tutor integration for feedback

### 4. Integration Expansion
- Integration with external learning platforms
- Calendar-based reflection reminders
- Goal-setting and tracking features

## Technical Notes

### AI Prompt Engineering
The system uses carefully crafted prompts to Gemini AI for consistent, high-quality analysis:
- Structured scoring rubrics for metacognitive quality
- Pattern recognition templates for learning behaviors
- Suggestion generation based on educational research
- Context-aware response formatting

### Data Privacy
- All reflections are stored securely with user consent
- Personal insights remain private to individual users
- Aggregated, anonymized data may be used for system improvements
- Users can export or delete their reflection data at any time

### Performance Considerations
- Asynchronous AI analysis to maintain responsiveness
- Cached insights for frequently accessed data
- Optimized database queries for analytics dashboards
- Progressive loading for large reflection histories

This metacognitive training module represents a significant advancement in personalized learning technology, helping users develop crucial self-awareness skills that support lifelong learning success.

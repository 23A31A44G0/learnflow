import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create API interceptor to handle frontend-only mode
const isFrontendOnlyMode = API_BASE_URL.includes('backend-placeholder');

export interface User {
  id: string;
  name: string;
  email: string;
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    masteryScore: number;
  };
}

export interface Question {
  question: string;
  answer: string;
  type: string;
  explanation?: string;
  difficulty?: string;
  options?: string[];
}

export interface QuestionSet {
  _id: string;
  userId: string;
  sourceText: string;
  questions: Question[];
  createdAt: string;
}

export interface PracticeAnswer {
  questionIndex: number;
  userAnswer: string;
  timeTaken?: number;
}

export interface PracticeResult {
  sessionId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: (PracticeAnswer & { isCorrect: boolean })[];
}

// Create a mock response generator for frontend-only mode
const generateMockResponse = (endpoint: string): any => {
  switch (endpoint) {
    case '/auth/login':
    case '/auth/register':
      return {
        token: 'demo-token-frontend-only-mode',
        user: {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          stats: {
            totalQuestions: 24,
            correctAnswers: 18,
            masteryScore: 75
          }
        }
      };
    case '/questions/generate':
      return {
        _id: 'mock-question-set-id',
        questions: [
          {
            question: 'What is active recall?',
            answer: 'A learning technique that involves actively stimulating memory during the learning process.',
            type: 'open-ended'
          },
          {
            question: 'What are the benefits of spaced repetition?',
            answer: 'It helps improve long-term retention by spacing out review sessions over time.',
            type: 'open-ended'
          }
        ]
      };
    default:
      return { message: 'Demo data in frontend-only mode' };
  }
};

// Create API instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Mock API for frontend-only mode
  if (isFrontendOnlyMode) {
    // For POST requests in frontend-only mode, we'll resolve with mock data
    if (config.method === 'post' && config.url) {
      const mockEndpoint = config.url.replace(API_BASE_URL, '');
      const mockData = generateMockResponse(mockEndpoint);
      return Promise.reject({
        response: {
          status: 200,
          data: mockData,
          config,
          headers: {},
          frontendOnlyMode: true
        }
      });
    }
  }

  // Regular request handling
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    // Special handling for frontend-only mode
    if (error.response?.frontendOnlyMode) {
      console.log('🧪 Frontend-only mode active: Returning mock data');
      return Promise.resolve({
        data: error.response.data,
        status: 200,
        statusText: 'OK (Frontend-only mock)',
      });
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const isFrontendOnlyDeployment = isFrontendOnlyMode;

export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error: any) {
      if (error.response?.frontendOnlyMode) {
        return error.response.data;
      }
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      if (error.response?.frontendOnlyMode) {
        return error.response.data;
      }
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      if (isFrontendOnlyMode) {
        return generateMockResponse('/auth/profile');
      }
      throw error;
    }
  }
};

export const questionsAPI = {
  generate: async (text: string) => {
    try {
      const response = await api.post('/questions/generate', { text });
      return response.data;
    } catch (error: any) {
      if (error.response?.frontendOnlyMode) {
        return error.response.data;
      }
      throw error;
    }
  },

  getMyQuestions: async () => {
    try {
      const response = await api.get('/questions/my-questions');
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return [generateMockResponse('/questions/generate')];
      }
      throw error;
    }
  },

  getQuestionSet: async (id: string) => {
    try {
      const response = await api.get(`/questions/${id}`);
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return generateMockResponse('/questions/generate');
      }
      throw error;
    }
  }
};

export const practiceAPI = {
  submit: async (questionId: string, answers: PracticeAnswer[]) => {
    try {
      const response = await api.post('/practice/submit', { questionId, answers });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          sessionId: 'mock-session-id',
          score: 75,
          correctAnswers: Math.floor(answers.length * 0.75),
          totalQuestions: answers.length,
          answers: answers.map((a, i) => ({ ...a, isCorrect: i % 3 !== 0 }))
        };
      }
      throw error;
    }
  },

  getHistory: async () => {
    try {
      const response = await api.get('/practice/history');
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return [
          {
            sessionId: 'mock-session-1',
            score: 80,
            correctAnswers: 8,
            totalQuestions: 10,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            sessionId: 'mock-session-2',
            score: 70,
            correctAnswers: 7,
            totalQuestions: 10,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
          }
        ];
      }
      throw error;
    }
  },

  getAnalytics: async () => {
    try {
      const response = await api.get('/practice/analytics');
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          totalSessions: 12,
          totalQuestions: 120,
          correctAnswers: 96,
          averageScore: 80,
          strengths: ['Biology', 'Chemistry'],
          weaknesses: ['Physics'],
          history: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - 86400000 * i).toISOString().slice(0, 10),
            score: 60 + Math.floor(Math.random() * 30)
          }))
        };
      }
      throw error;
    }
  }
};

export const metacognitiveAPI = {
  getPrompt: async (promptType: string, context: any) => {
    try {
      const response = await api.post('/metacognitive/prompt', { promptType, context });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          prompt: 'How would you explain this concept to a beginner?',
          context: context
        };
      }
      throw error;
    }
  },

  reflect: async (promptType: string, prompt: string, userResponse: string, context: any) => {
    try {
      const response = await api.post('/metacognitive/reflect', {
        promptType, prompt, userResponse, context
      });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          feedback: 'Great explanation! You showed a clear understanding of the core concepts.',
          score: 85,
          suggestions: 'Try adding more concrete examples next time.'
        };
      }
      throw error;
    }
  },

  getReflections: async (timeRange: string = 'week') => {
    try {
      const response = await api.get(`/metacognitive/reflections?timeRange=${timeRange}`);
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return [
          {
            _id: 'mock-reflection-1',
            promptType: 'concept-explanation',
            prompt: 'How would you explain this concept to a beginner?',
            userResponse: 'Active recall is like testing yourself before an exam...',
            feedback: 'Great explanation! You showed a clear understanding of the core concepts.',
            score: 85,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
      }
      throw error;
    }
  },

  getAnalytics: async (timeRange: string = 'week') => {
    try {
      const response = await api.get(`/metacognitive/analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          averageScore: 82,
          reflectionCount: 9,
          strengths: ['Explanation Clarity', 'Concept Understanding'],
          weaknesses: ['Example Variety'],
          progress: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - 86400000 * i).toISOString().slice(0, 10),
            score: 70 + Math.floor(Math.random() * 20)
          }))
        };
      }
      throw error;
    }
  }
};

export const gamificationAPI = {
  getStats: async () => {
    try {
      const response = await api.get('/gamification/stats');
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          level: 5,
          points: 2340,
          nextLevelAt: 3000,
          streak: 4,
          badges: ['Quick Learner', 'Consistency Champion'],
          rank: 12,
          totalUsers: 150
        };
      }
      throw error;
    }
  },

  getLeaderboard: async (timeframe: string = 'all', limit: number = 10) => {
    try {
      const response = await api.get(`/gamification/leaderboard?timeframe=${timeframe}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return Array.from({ length: limit }, (_, i) => ({
          userId: `user-${i+1}`,
          name: `User ${i+1}`,
          points: 5000 - (i * 300),
          level: 10 - Math.floor(i/2),
          badges: i < 3 ? ['Top Performer', 'Knowledge Master'] : ['Quick Learner']
        }));
      }
      throw error;
    }
  },

  getBadges: async () => {
    try {
      const response = await api.get('/gamification/badges');
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return [
          { id: 'quick-learner', name: 'Quick Learner', description: 'Completed 10 practice sessions', earned: true },
          { id: 'consistency', name: 'Consistency Champion', description: '7-day streak', earned: true },
          { id: 'master', name: 'Knowledge Master', description: 'Achieved 95% in a practice session', earned: false }
        ];
      }
      throw error;
    }
  },

  awardPoints: async (pointType: string, multiplier: number = 1) => {
    try {
      const response = await api.post('/gamification/award-points', { pointType, multiplier });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return { 
          pointsAwarded: pointType === 'practice' ? 50 * multiplier : 10 * multiplier,
          newTotal: 2340 + (pointType === 'practice' ? 50 * multiplier : 10 * multiplier)
        };
      }
      throw error;
    }
  },

  updateDailyProgress: async (progressType: string, amount: number = 1) => {
    try {
      const response = await api.post('/gamification/daily-progress', { progressType, amount });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return { 
          success: true, 
          progress: {
            questionsAnswered: progressType === 'questions' ? 15 + amount : 15,
            reflectionsCompleted: progressType === 'reflections' ? 2 + amount : 2,
            timeSpent: progressType === 'time' ? 45 + amount : 45
          }
        };
      }
      throw error;
    }
  },

  processPracticeCompletion: async (practiceData: {
    questionsAnswered: number;
    correctAnswers: number;
    timeSpentMinutes: number;
    perfectSession?: boolean;
  }) => {
    try {
      const response = await api.post('/gamification/practice-completed', practiceData);
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        const pointsEarned = practiceData.questionsAnswered * 5 + practiceData.correctAnswers * 10;
        return {
          pointsEarned,
          badgesEarned: practiceData.perfectSession ? ['Perfect Score'] : [],
          streakUpdated: true,
          currentStreak: 4
        };
      }
      throw error;
    }
  },

  processReflectionCompletion: async (qualityScore: number) => {
    try {
      const response = await api.post('/gamification/reflection-completed', { qualityScore });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          pointsEarned: Math.floor(qualityScore / 10) * 5,
          badgesEarned: qualityScore > 90 ? ['Deep Thinker'] : [],
          insightLevel: qualityScore > 80 ? 'high' : 'medium'
        };
      }
      throw error;
    }
  },

  processLearnSpaceUsage: async (activityType: string, timeSpentMinutes: number = 0) => {
    try {
      const response = await api.post('/gamification/learn-space-used', { activityType, timeSpentMinutes });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          pointsEarned: Math.floor(timeSpentMinutes / 5) * 3,
          knowledgeExpanded: timeSpentMinutes > 10
        };
      }
      throw error;
    }
  }
};

export const learnAPI = {
  explainConcept: async (concept: string, context: string = '', difficulty: string = 'intermediate') => {
    try {
      const response = await api.post('/learn/explain-concept', { 
        concept, 
        context, 
        difficulty 
      });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          explanation: `${concept} is a fundamental concept in learning. It involves understanding the core principles and applying them effectively. ${difficulty === 'beginner' ? 'Simply put, it helps you learn better.' : 'The advanced application requires strategic implementation of these techniques for optimal learning outcomes.'}`,
          relatedConcepts: ['Active Recall', 'Spaced Repetition', 'Deliberate Practice']
        };
      }
      throw error;
    }
  },
  
  generateConceptMap: async (text: string, focusConcept: string = '') => {
    try {
      const response = await api.post('/learn/generate-concept-map', { 
        text, 
        focusConcept 
      });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          centralConcept: focusConcept || 'Learning Techniques',
          nodes: [
            { id: 'n1', label: 'Active Recall', category: 'primary' },
            { id: 'n2', label: 'Spaced Repetition', category: 'primary' },
            { id: 'n3', label: 'Elaboration', category: 'secondary' },
            { id: 'n4', label: 'Testing Effect', category: 'secondary' }
          ],
          edges: [
            { from: 'n1', to: 'n4', label: 'demonstrates' },
            { from: 'n2', to: 'n1', label: 'enhances' },
            { from: 'n3', to: 'n1', label: 'supports' }
          ]
        };
      }
      throw error;
    }
  },
  
  socraticDialogue: async (question: string, context: string = '', previousDialogue: any[] = []) => {
    try {
      const response = await api.post('/learn/socratic-dialogue', { 
        question, 
        context, 
        previousDialogue 
      });
      return response.data;
    } catch (error: any) {
      if (isFrontendOnlyMode) {
        return {
          question: previousDialogue.length === 0 ? 
            `That's an interesting question about ${question}. What do you already know about this topic?` :
            `Good insight. Have you considered how ${question} relates to learning effectiveness?`,
          hint: 'Think about the underlying principles',
          conceptsToExplore: ['Memory Formation', 'Knowledge Retention']
        };
      }
      throw error;
    }
  }
};

export default api;
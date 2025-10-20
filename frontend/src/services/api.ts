import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

export const questionsAPI = {
  generate: async (text: string) => {
    const response = await api.post('/questions/generate', { text });
    return response.data;
  },

  getMyQuestions: async () => {
    const response = await api.get('/questions/my-questions');
    return response.data;
  },

  getQuestionSet: async (id: string) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  }
};

export const practiceAPI = {
  submit: async (questionId: string, answers: PracticeAnswer[]) => {
    const response = await api.post('/practice/submit', { questionId, answers });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/practice/history');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/practice/analytics');
    return response.data;
  }
};

export const metacognitiveAPI = {
  getPrompt: async (promptType: string, context: any) => {
    const response = await api.post('/metacognitive/prompt', { promptType, context });
    return response.data;
  },

  reflect: async (promptType: string, prompt: string, userResponse: string, context: any) => {
    const response = await api.post('/metacognitive/reflect', {
      promptType,
      prompt,
      userResponse,
      context
    });
    return response.data;
  },

  getReflections: async (timeRange: string = 'week') => {
    const response = await api.get(`/metacognitive/reflections?timeRange=${timeRange}`);
    return response.data;
  },

  getAnalytics: async (timeRange: string = 'week') => {
    const response = await api.get(`/metacognitive/analytics?timeRange=${timeRange}`);
    return response.data;
  }
};

export const gamificationAPI = {
  getStats: async () => {
    const response = await api.get('/gamification/stats');
    return response.data;
  },

  getLeaderboard: async (timeframe: string = 'all', limit: number = 10) => {
    const response = await api.get(`/gamification/leaderboard?timeframe=${timeframe}&limit=${limit}`);
    return response.data;
  },

  getBadges: async () => {
    const response = await api.get('/gamification/badges');
    return response.data;
  },

  awardPoints: async (pointType: string, multiplier: number = 1) => {
    const response = await api.post('/gamification/award-points', { pointType, multiplier });
    return response.data;
  },

  updateDailyProgress: async (progressType: string, amount: number = 1) => {
    const response = await api.post('/gamification/daily-progress', { progressType, amount });
    return response.data;
  },

  processPracticeCompletion: async (practiceData: {
    questionsAnswered: number;
    correctAnswers: number;
    timeSpentMinutes: number;
    perfectSession?: boolean;
  }) => {
    const response = await api.post('/gamification/practice-completed', practiceData);
    return response.data;
  },

  processReflectionCompletion: async (qualityScore: number) => {
    const response = await api.post('/gamification/reflection-completed', { qualityScore });
    return response.data;
  },

  processLearnSpaceUsage: async (activityType: string, timeSpentMinutes: number = 0) => {
    const response = await api.post('/gamification/learn-space-used', { activityType, timeSpentMinutes });
    return response.data;
  }
};

export const learnAPI = {
  explainConcept: async (concept: string, context: string = '', difficulty: string = 'intermediate') => {
    const response = await api.post('/learn/explain-concept', { 
      concept, 
      context, 
      difficulty 
    });
    return response.data;
  },
  
  generateConceptMap: async (text: string, focusConcept: string = '') => {
    const response = await api.post('/learn/generate-concept-map', { 
      text, 
      focusConcept 
    });
    return response.data;
  },
  
  socraticDialogue: async (question: string, context: string = '', previousDialogue: any[] = []) => {
    const response = await api.post('/learn/socratic-dialogue', { 
      question, 
      context, 
      previousDialogue 
    });
    return response.data;
  }
};

export default api;

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create API interceptor to handle frontend-only mode
const isFrontendOnlyMode = API_BASE_URL.includes('backend-placeholder');

// Create a mock response generator for frontend-only mode
const generateMockResponse = (endpoint) => {
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
    if (config.method === 'post') {
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
  (error) => {
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
  register: async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      if (error.response?.frontendOnlyMode) {
        return error.response.data;
      }
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
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
  generate: async (text) => {
    try {
      const response = await api.post('/questions/generate', { text });
      return response.data;
    } catch (error) {
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
    } catch (error) {
      if (isFrontendOnlyMode) {
        return [generateMockResponse('/questions/generate')];
      }
      throw error;
    }
  },

  getQuestionSet: async (id) => {
    try {
      const response = await api.get(`/questions/${id}`);
      return response.data;
    } catch (error) {
      if (isFrontendOnlyMode) {
        return generateMockResponse('/questions/generate');
      }
      throw error;
    }
  }
};

// Add similar frontend-only mode handling for other API functions
// This is a placeholder for the rest of the API module
// Each API function should catch errors and check for frontendOnlyMode

export default api;
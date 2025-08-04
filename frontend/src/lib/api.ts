import axios from 'axios';

/**
 * Smart API URL detection with environment support
 * Supports local development, E2E testing, and production deployment
 */
const API_BASE_URL = (() => {
  // Priority 1: E2E testing environment detection
  const isE2ETest = (() => {
    // Safe browser environment check
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    const userAgent = navigator.userAgent;
    return userAgent.includes('Playwright') || 
           userAgent.includes('HeadlessChrome') ||
           (window.location && window.location.search && window.location.search.includes('e2e-test')) ||
           (document && document.documentElement && document.documentElement.getAttribute('data-test-env') === 'playwright');
  })();
  
  if (isE2ETest) {
    // For E2E tests, determine environment dynamically
    const isLocalhost = window && window.location && window.location.hostname && window.location.hostname === 'localhost';
    if (isLocalhost) {
      console.log('🧪 E2E Test (Local): Using localhost backend');
      return 'http://localhost:8080/api';
    } else {
      // Use VITE_API_URL for cloud E2E tests if available
      if (import.meta.env.VITE_API_URL) {
        console.log('🧪 E2E Test (Cloud): Using VITE_API_URL:', import.meta.env.VITE_API_URL);
        return import.meta.env.VITE_API_URL;
      } else {
        console.log('🧪 E2E Test (Cloud): Using default API Gateway URL');
        return 'https://9d81ipursj.execute-api.ap-northeast-2.amazonaws.com/v1';
      }
    }
  }
  
  // Priority 2: Explicit VITE_API_URL (for custom builds)
  if (import.meta.env.VITE_API_URL) {
    console.log('✅ Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 3: Development build with DEV_API_URL
  if (typeof __DEV_API_URL__ !== 'undefined') {
    console.log('✅ Using DEV_API_URL:', __DEV_API_URL__ + '/api');
    return __DEV_API_URL__ + '/api';
  }
  
  // Priority 4: Production environment detection
  const isProduction = import.meta.env.PROD;
  const isGitHubPages = window && window.location && window.location.hostname && window.location.hostname.includes('github.io');
  
  if (isProduction && isGitHubPages) {
    console.log('✅ Production (GitHub Pages): Using CloudFront backend');
    return 'https://d1ct76fqx0s1b8.cloudfront.net/api';
  }
  
  // Priority 5: Local development fallback
  if (window && window.location && window.location.hostname && window.location.hostname === 'localhost') {
    console.log('✅ Local Development: Using localhost backend');
    return 'http://localhost:8080/api';
  }
  
  // Priority 6: Default fallback (relative path)
  console.log('✅ Fallback: Using relative API path');
  return '/api';
})();

console.log('API_BASE_URL:', API_BASE_URL);

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // RealWorld API spec uses "Token" prefix, not "Bearer"
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 동적으로 base path 감지 - React Router basename과 일치하도록
      const currentOrigin = window.location.origin;
      const currentPathname = window.location.pathname;
      
      // GitHub Pages 환경 감지
      const isGitHubPages = window.location.hostname.includes('github.io');
      const basePath = isGitHubPages && currentPathname.includes('/Realworld-serverless-microservice')
        ? '/Realworld-serverless-microservice'
        : '';
        
      window.location.href = `${currentOrigin}${basePath}/login`;
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/users/login', {
      user: { email, password }
    });
    return response.data;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/users', {
      user: { username, email, password }
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/user');
    return response.data;
  },
};

export const articlesAPI = {
  getArticles: async (params?: {
    tag?: string;
    author?: string;
    favorited?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/articles', { params });
    return response.data;
  },

  getArticle: async (slug: string) => {
    const response = await api.get(`/articles/${slug}`);
    return response.data;
  },

  createArticle: async (article: {
    title: string;
    description: string;
    body: string;
    tagList?: string[];
  }) => {
    const response = await api.post('/articles', { article });
    return response.data;
  },

  updateArticle: async (slug: string, article: Partial<{
    title: string;
    description: string;
    body: string;
    tagList: string[];
  }>) => {
    const response = await api.put(`/articles/${slug}`, { article });
    return response.data;
  },

  deleteArticle: async (slug: string) => {
    const response = await api.delete(`/articles/${slug}`);
    return response.data;
  },
};

export const commentsAPI = {
  getComments: async (slug: string) => {
    const response = await api.get(`/articles/${slug}/comments`);
    return response.data;
  },

  createComment: async (slug: string, body: string) => {
    const response = await api.post(`/articles/${slug}/comments`, {
      comment: { body }
    });
    return response.data;
  },

  deleteComment: async (slug: string, id: string) => {
    const response = await api.delete(`/articles/${slug}/comments/${id}`);
    return response.data;
  },
};
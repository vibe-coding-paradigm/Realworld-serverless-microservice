import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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
      config.headers.Authorization = `Bearer ${token}`;
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
      window.location.href = '/login';
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
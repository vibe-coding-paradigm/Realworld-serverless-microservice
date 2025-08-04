import { APIRequestContext, expect } from '@playwright/test';

export class ApiHelper {
  private readonly apiBaseURL: string;
  private readonly healthURL: string;
  private readonly environment: string;

  constructor(private request: APIRequestContext) {
    // Direct environment detection without circular imports
    this.environment = this.detectEnvironment();
    this.apiBaseURL = this.getApiUrl();
    this.healthURL = this.getHealthUrl();
    
    console.log(`🔗 API Helper initialized for ${this.environment} environment`);
    console.log(`📡 API URL: ${this.apiBaseURL}`);
    console.log(`❤️ Health URL: ${this.healthURL}`);
  }

  private detectEnvironment(): string {
    // Check environment variables that would be set in different contexts
    if (process.env.API_URL && process.env.API_URL.includes('localhost')) {
      return 'local';
    }
    if (process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_BASE_URL.includes('localhost')) {
      return 'local';
    }
    return 'cloud';
  }

  private getApiUrl(): string {
    if (this.environment === 'local') {
      return 'http://localhost:8080/api';
    } else {
      // Use environment variable API_URL first, then BACKEND_URL, then fallback to API Gateway URL
      const apiUrl = process.env.API_URL || 
                     process.env.BACKEND_URL || 
                     process.env.VITE_API_URL ||
                     'https://5hlad3iru9.execute-api.ap-northeast-2.amazonaws.com/prod/api';
      
      // Ensure the URL ends with /api for consistency
      return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    }
  }

  private getHealthUrl(): string {
    if (this.environment === 'local') {
      return 'http://localhost:8080';
    } else {
      // Use environment variable API_URL first, then BACKEND_URL, then fallback to API Gateway URL
      const apiUrl = process.env.API_URL || 
                     process.env.BACKEND_URL || 
                     process.env.VITE_API_URL ||
                     'https://5hlad3iru9.execute-api.ap-northeast-2.amazonaws.com/prod/api';
      
      // Remove /api suffix for health check URL
      return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    }
  }

  async healthCheck() {
    const response = await this.request.get(`${this.healthURL}/health`);
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getArticles() {
    const response = await this.request.get(`${this.apiBaseURL}/articles`);
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async getArticle(slug: string) {
    const response = await this.request.get(`${this.apiBaseURL}/articles/${slug}`);
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async createUser(userData: { username: string; email: string; password: string }) {
    const response = await this.request.post(`${this.apiBaseURL}/users`, {
      data: { user: userData }
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async loginUser(credentials: { email: string; password: string }) {
    const url = `${this.apiBaseURL}/users/login`;
    const requestData = { user: credentials };
    
    console.log(`API Helper Request: POST ${url}`);
    console.log(`API Helper Headers: {"Content-Type": "application/json"}`);
    console.log(`API Helper Body: ${JSON.stringify(requestData)}`);
    
    const response = await this.request.post(url, {
      data: requestData
    });
    
    console.log(`API Helper Response: ${response.status()} ${response.statusText()}`);
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }
  
  // Debug method to get URLs and environment info
  getDebugInfo() {
    return {
      environment: this.environment,
      apiBaseURL: this.apiBaseURL,
      healthURL: this.healthURL
    };
  }

  async createArticle(articleData: any, token: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    const response = await this.request.post(`${this.apiBaseURL}/articles`, {
      data: { article: articleData },
      headers
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async getComments(slug: string) {
    const response = await this.request.get(`${this.apiBaseURL}/articles/${slug}/comments`);
    
    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      console.warn('Failed to parse comments response as JSON:', error);
    }
    
    return {
      response,
      data
    };
  }

  async createComment(slug: string, commentData: any, token: string) {
    const response = await this.request.post(`${this.apiBaseURL}/articles/${slug}/comments`, {
      data: { comment: commentData },
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async deleteComment(slug: string, commentId: string, token: string) {
    const response = await this.request.delete(`${this.apiBaseURL}/articles/${slug}/comments/${commentId}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async deleteArticle(slug: string, token: string) {
    const response = await this.request.delete(`${this.apiBaseURL}/articles/${slug}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }
}
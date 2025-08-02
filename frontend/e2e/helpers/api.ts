import { APIRequestContext, expect } from '@playwright/test';

export class ApiHelper {
  constructor(private request: APIRequestContext) {}
  
  private get baseURL() {
    return process.env.API_URL || 'http://3.39.187.72:8080';
  }

  private get apiBaseURL() {
    const url = this.baseURL;
    // If API_URL already includes /api, use it as is, otherwise append /api
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  private get healthURL() {
    const url = this.baseURL;
    // Remove /api suffix for health check if present
    return url.endsWith('/api') ? url.slice(0, -4) : url;
  }

  async healthCheck() {
    const response = await this.request.get(`${this.healthURL}/health`);
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getArticles() {
    const response = await this.request.get(`${this.apiBaseURL}/articles`);
    expect(response.ok()).toBeTruthy();
    return await response.json();
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
    const response = await this.request.post(`${this.apiBaseURL}/users/login`, {
      data: { user: credentials }
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async createArticle(articleData: any, token: string) {
    const response = await this.request.post(`${this.apiBaseURL}/articles`, {
      data: { article: articleData },
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
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
}
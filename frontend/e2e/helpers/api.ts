import { APIRequestContext, expect } from '@playwright/test';

export class ApiHelper {
  constructor(private request: APIRequestContext) {}
  
  private get baseURL() {
    return process.env.API_URL || 'http://3.39.187.72:8080';
  }

  async healthCheck() {
    const response = await this.request.get(`${this.baseURL}/health`);
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getArticles() {
    const response = await this.request.get(`${this.baseURL}/api/articles`);
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async createUser(userData: { username: string; email: string; password: string }) {
    const response = await this.request.post(`${this.baseURL}/api/users`, {
      data: { user: userData }
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async loginUser(credentials: { email: string; password: string }) {
    const response = await this.request.post(`${this.baseURL}/api/users/login`, {
      data: { user: credentials }
    });
    
    return {
      response,
      data: response.ok() ? await response.json() : null
    };
  }

  async createArticle(articleData: any, token: string) {
    const response = await this.request.post(`${this.baseURL}/api/articles`, {
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
    const response = await this.request.post(`${this.baseURL}/api/articles/${slug}/comments`, {
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
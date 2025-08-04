import { APIRequestContext, expect } from '@playwright/test';
import { getApiUrl, getHealthUrl, detectEnvironment } from './environment';

export class ApiHelper {
  private readonly apiBaseURL: string;
  private readonly healthURL: string;
  private readonly environment: string;

  constructor(private request: APIRequestContext) {
    // Use centralized environment configuration
    this.environment = detectEnvironment();
    this.apiBaseURL = getApiUrl();
    this.healthURL = getHealthUrl();
    
    console.log(`🔗 API Helper initialized for ${this.environment} environment`);
    console.log(`📡 API URL: ${this.apiBaseURL}`);
    console.log(`❤️ Health URL: ${this.healthURL}`);
  }

  /**
   * Wait for DynamoDB eventual consistency
   * AWS DynamoDB may take 1-2 seconds to reflect changes across all nodes
   */
  async waitForConsistency(ms: number = 2000) {
    console.log(`⏳ Waiting ${ms}ms for DynamoDB eventual consistency...`);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async healthCheck() {
    // For serverless API Gateway, use articles endpoint as health check
    const response = await this.request.get(`${this.healthURL}/articles`);
    // 403 or 401 is expected for unauthenticated requests, indicating the API is alive
    expect([200, 401, 403].includes(response.status())).toBeTruthy();
    if (response.ok()) {
      return await response.json();
    } else {
      // Return status for debugging
      return { status: response.status(), message: 'API is responsive' };
    }
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
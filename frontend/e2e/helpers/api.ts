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
   * Wait for DynamoDB eventual consistency (GSI queries only)
   * 
   * Use only for operations that rely on Global Secondary Indexes:
   * - Articles by slug (SlugIndex)
   * - Articles by author (AuthorIndex) 
   * - Users by email (EmailIndex)
   * - Users by username (UsernameIndex)
   * 
   * Primary Key queries use Strong Consistency and don't need this wait.
   */
  async waitForConsistency(ms: number = 5000) {
    console.log(`⏳ Waiting ${ms}ms for DynamoDB GSI eventual consistency...`);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for article to be available by slug (with retry logic)
   * This ensures the article is fully available before UI navigation
   */
  async waitForArticle(slug: string, token: string = '', maxRetries: number = 10, delayMs: number = 1000) {
    console.log(`⏳ Waiting for article '${slug}' to be available...`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Token ${token}`;
        }
        
        const response = await this.request.get(`${this.apiBaseURL}/articles/${slug}`, {
          headers
        });
        
        if (response.ok()) {
          const data = await response.json();
          if (data.article && data.article.slug === slug) {
            console.log(`✅ Article '${slug}' is now available (attempt ${attempt}/${maxRetries})`);
            return { response, data };
          }
        }
        
        console.log(`⏳ Article '${slug}' not available yet (attempt ${attempt}/${maxRetries}), retrying...`);
      } catch (error) {
        console.log(`⚠️ Error checking article '${slug}' (attempt ${attempt}/${maxRetries}):`, error);
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error(`Article '${slug}' is not available after ${maxRetries} attempts`);
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
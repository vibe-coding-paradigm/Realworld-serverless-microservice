import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api';

test.describe('Health and Basic Connectivity', () => {
  
  test('should load frontend application', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if basic elements are present
    await expect(page).toHaveTitle(/Vite|RealWorld/);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/frontend-home.png' });
  });

  test('should connect to backend API @backend', async ({ request }) => {
    const api = new ApiHelper(request);
    
    const health = await api.healthCheck();
    
    expect(health).toHaveProperty('status', 'ok');
    expect(health).toHaveProperty('service', 'conduit-api');
    expect(health).toHaveProperty('version');
  });

  test('should fetch articles from API @backend', async ({ request }) => {
    const api = new ApiHelper(request);
    
    const articles = await api.getArticles();
    
    expect(articles).toHaveProperty('articles');
    expect(articles).toHaveProperty('articlesCount');
    expect(typeof articles.articlesCount).toBe('number');
  });

  test('should have CORS headers configured', async ({ request }) => {
    const apiUrl = process.env.API_URL || 'http://3.39.187.72:8080';
    const response = await request.get(`${apiUrl}/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
    expect(headers['access-control-allow-headers']).toContain('Authorization');
  });
});
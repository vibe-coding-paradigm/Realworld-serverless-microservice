import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api';
import { navigateToPage } from '../helpers/test-data';

test.describe('Health and Basic Connectivity', () => {
  
  test('should load frontend application', async ({ page }) => {
    // Add a small delay before navigation to allow CDN stabilization
    await page.waitForTimeout(2000);
    
    // Use helper function to ensure correct URL navigation
    await navigateToPage(page, '/');
    console.log('Page title:', await page.title());
    
    // Additional wait for page to fully load
    await page.waitForTimeout(2000);
    
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
    
    const { response, data: articles } = await api.getArticles();
    expect(response.status()).toBe(200);
    
    expect(articles).toHaveProperty('articles');
    expect(articles).toHaveProperty('articlesCount');
    expect(typeof articles.articlesCount).toBe('number');
  });

  test('should have CORS headers configured', async ({ request }) => {
    const apiUrl = process.env.API_URL || 'http://3.39.187.72:8080';
    // Remove /api suffix for health check if present
    const healthUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    const response = await request.get(`${healthUrl}/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
    expect(headers['access-control-allow-headers']).toContain('Authorization');
  });
});
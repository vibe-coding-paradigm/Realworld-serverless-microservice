import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * 
 * This setup runs once before all tests and prepares the test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  // Get API URL from environment variables
  const apiUrl = process.env.API_URL || 'http://3.39.187.72:8080';
  
  console.log(`Frontend URL: ${config.use?.baseURL}`);
  console.log(`Backend API URL: ${apiUrl}`);
  
  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...');
  
  try {
    // Check if backend is healthy
    const response = await fetch(`${apiUrl}/health`);
    if (response.ok) {
      const health = await response.json();
      console.log(`✅ Backend healthy: ${health.service} v${health.version}`);
    } else {
      console.warn(`⚠️ Backend health check failed: ${response.status}`);
    }
  } catch (error) {
    console.warn(`⚠️ Cannot reach backend: ${error}`);
  }
  
  // Store API URL for tests
  process.env.API_URL = apiUrl;
  
  console.log('✅ E2E test environment setup complete');
}

export default globalSetup;
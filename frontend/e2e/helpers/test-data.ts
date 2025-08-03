/**
 * Test data generators and utilities
 */

export const generateTestUser = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return {
    username: `testuser_${timestamp}_${random}`,
    email: `test_${timestamp}_${random}@example.com`,
    password: 'testpassword123'
  };
};

export const generateTestArticle = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return {
    title: `Test Article ${timestamp} ${random}`,
    description: `Test article for E2E testing - ${random}`,
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Random: ${random}`,
    tagList: ['test', 'e2e', 'automation', random]
  };
};

export const generateTestComment = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return {
    body: `Test comment created at ${new Date().toISOString()} - ${random}`
  };
};

export const testUsers = {
  validUser: {
    username: 'e2euser',
    email: 'e2e@example.com',
    password: 'password123'
  },
  invalidUser: {
    username: '',
    email: 'invalid-email',
    password: '123'
  }
};

export const testArticles = {
  validArticle: {
    title: 'E2E Test Article',
    description: 'Article for testing purposes',
    body: 'This article is created for E2E testing scenarios.',
    tagList: ['testing', 'e2e']
  }
};

/**
 * Wait times for different operations in E2E tests
 * Using reasonable defaults for all environments
 */
export const waitTimes = {
  short: 3000,
  medium: 15000,
  long: 30000,
  api: 35000
};

/**
 * Navigation helpers to ensure correct URL handling across environments
 */
export const getFullURL = (path: string = '/') => {
  // Simple environment detection without module-level execution
  let baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/';
  
  // If API_URL is localhost, use local frontend
  if (process.env.API_URL && process.env.API_URL.includes('localhost')) {
    baseURL = 'http://localhost:3000';
  }
  
  // Remove trailing slash from baseURL and leading slash from path to avoid double slashes
  const cleanBaseURL = baseURL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  
  return cleanPath ? `${cleanBaseURL}/${cleanPath}` : cleanBaseURL;
};

/**
 * Safe navigation function that ensures correct URL resolution
 * Includes special handling for GitHub Pages SPA routing
 */
export const navigateToPage = async (page: any, path: string = '/') => {
  const fullURL = getFullURL(path);
  // Use fixed timeout for simplicity
  
  console.log(`🧭 Navigating to: ${fullURL}`);
  
  // Navigate to the URL with environment-appropriate timeout
  await page.goto(fullURL, { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });
  
  // For GitHub Pages, wait for potential SPA redirect to complete
  if (path !== '/' && fullURL.includes('github.io')) {
    console.log('⏳ Waiting for GitHub Pages SPA redirect...');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // Verify we're not still on a 404 page
    const title = await page.title();
    if (title === 'Conduit' && page.url() === fullURL) {
      console.log('🔄 Additional wait for SPA routing...');
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    }
  }
  
  console.log(`✅ Final URL: ${page.url()}`);
  return page.url();
};
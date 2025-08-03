/**
 * Test data generators and utilities
 */

export const generateTestUser = () => ({
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'testpassword123'
});

export const generateTestArticle = () => ({
  title: `Test Article ${Date.now()}`,
  description: 'This is a test article for E2E testing',
  body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  tagList: ['test', 'e2e', 'automation']
});

export const generateTestComment = () => ({
  body: `Test comment created at ${new Date().toISOString()}`
});

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

export const waitTimes = {
  short: 2000,
  medium: 10000,
  long: 15000,
  api: 20000
};

/**
 * Navigation helpers to ensure correct URL handling across environments
 */
export const getFullURL = (path: string = '/') => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/';
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
  console.log(`Navigating to: ${fullURL}`);
  
  // Navigate to the URL
  await page.goto(fullURL, { waitUntil: 'networkidle' });
  
  // For non-root paths, wait for potential SPA redirect to complete
  if (path !== '/' && fullURL.includes('github.io')) {
    console.log('Waiting for potential GitHub Pages SPA redirect...');
    // Wait a bit for JavaScript redirect to process
    await page.waitForTimeout(2000);
    // Wait for any potential navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Verify we're not still on a 404 page
    const title = await page.title();
    if (title === 'Conduit' && page.url() === fullURL) {
      // We might still be on the 404 page, wait a bit more
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    }
  }
  
  console.log(`Final URL: ${page.url()}`);
  return page.url();
};
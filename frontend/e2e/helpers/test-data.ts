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
 */
export const navigateToPage = async (page: any, path: string = '/') => {
  const fullURL = getFullURL(path);
  console.log(`Navigating to: ${fullURL}`);
  await page.goto(fullURL, { waitUntil: 'networkidle' });
  console.log(`Final URL: ${page.url()}`);
  return page.url();
};
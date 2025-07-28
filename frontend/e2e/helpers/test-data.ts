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
  short: 1000,
  medium: 3000,
  long: 5000,
  api: 10000
};
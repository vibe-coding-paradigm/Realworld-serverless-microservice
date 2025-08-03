import { defineConfig, devices } from '@playwright/test';

/**
 * Smart environment detection for E2E testing
 * Supports both local development and cloud deployment scenarios
 */
function getBaseURL(): string {
  // Priority 1: Explicit environment variable (CI/CD)
  if (process.env.PLAYWRIGHT_BASE_URL) {
    return process.env.PLAYWRIGHT_BASE_URL;
  }
  
  // Priority 2: CI environment - use GitHub Pages
  if (process.env.CI) {
    return 'https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/';
  }
  
  // Priority 3: Local development - check if dev server is likely running
  if (process.env.NODE_ENV === 'development' || process.env.npm_lifecycle_event === 'dev') {
    return 'http://localhost:3000';
  }
  
  // Priority 4: Default to GitHub Pages for production testing
  return 'https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/';
}

/**
 * Playwright configuration for RealWorld E2E testing
 * 
 * Tests both GitHub Pages frontend and AWS ECS backend
 * Automatically detects local vs cloud environment
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: getBaseURL(),
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for all tests */
    actionTimeout: 15000,
    navigationTimeout: 60000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Global setup and teardown */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  /* Run your local dev server before starting the tests */
  webServer: (() => {
    const baseURL = getBaseURL();
    
    // Only start dev server for local development
    if (baseURL.includes('localhost') && !process.env.CI) {
      return {
        command: 'VITE_API_URL=http://localhost:8080/api npm run dev',
        port: 3000,
        reuseExistingServer: true,
        timeout: 120 * 1000, // 2 minutes
        stderr: 'pipe',
        stdout: 'pipe',
        env: {
          VITE_API_URL: 'http://localhost:8080/api'
        }
      };
    }
    
    // For cloud testing, no web server needed
    return undefined;
  })(),
});
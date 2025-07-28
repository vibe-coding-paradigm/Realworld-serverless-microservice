import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * 
 * This teardown runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  // Add any cleanup logic here if needed
  // For example: cleaning up test data, closing connections, etc.
  
  console.log('✅ E2E test environment cleanup complete');
}

export default globalTeardown;
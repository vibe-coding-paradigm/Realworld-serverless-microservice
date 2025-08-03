/**
 * Login helpers for E2E tests with environment-aware strategies
 */
import { Page } from '@playwright/test';
import { navigateToPage } from './test-data';

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

/**
 * Ensure user is logged in using environment-appropriate strategy
 */
export async function ensureLoggedIn(page: Page, user: TestUser, token?: string): Promise<void> {
  // Prefer token injection if available, otherwise use full login
  if (token) {
    // Fast token injection for local development
    console.log('🚀 Using token injection for fast login');
    await injectLoginToken(page, user, token);
  } else {
    // Full login flow for cloud or when token not available
    console.log('🔑 Using full login flow');
    await performFullLogin(page, user);
  }
}

/**
 * Inject login token directly into localStorage (fast for local testing)
 */
async function injectLoginToken(page: Page, user: TestUser, token: string): Promise<void> {
  // First navigate to any page to ensure localStorage is available
  await navigateToPage(page, '/');
  
  // Inject token and user data into localStorage
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      email: user.email,
      username: user.username,
      bio: null,
      image: null
    }));
  }, { token, user });
  
  // Refresh page to apply login state
  await page.reload({ waitUntil: 'networkidle' });
  
  console.log(`✅ Token injected for user: ${user.username}`);
}

/**
 * Perform full login flow through UI (reliable for all environments)
 */
async function performFullLogin(page: Page, user: TestUser): Promise<void> {
  await navigateToPage(page, '/login');
  
  // Fill login form
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  
  // Submit form and wait for navigation
  const navigationPromise = page.waitForURL('**/');
  await page.click('button[type="submit"]:has-text("Sign in")');
  await navigationPromise;
  
  // Wait for login to complete
  await page.waitForLoadState('networkidle');
  
  console.log(`✅ Full login completed for user: ${user.username}`);
}

/**
 * Verify user is logged in
 */
export async function verifyLoggedIn(page: Page, username: string): Promise<boolean> {
  try {
    // Check for username in navigation
    const userLink = page.locator(`nav a:has-text("${username}")`);
    await userLink.waitFor({ state: 'visible', timeout: 10000 });
    
    // Double-check localStorage has token
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('token') !== null;
    });
    
    console.log(`✅ Login verified for ${username}, token present: ${hasToken}`);
    return true;
  } catch (error) {
    console.log(`❌ Login verification failed for ${username}: ${error.message}`);
    return false;
  }
}

/**
 * Environment-aware login with automatic retry
 */
export async function smartLogin(page: Page, user: TestUser, token?: string): Promise<void> {
  // First attempt with preferred strategy
  await ensureLoggedIn(page, user, token);
  
  // Verify login succeeded
  const isVerified = await verifyLoggedIn(page, user.username);
  
  if (!isVerified) {
    console.log('🔄 Login verification failed, retrying with full flow...');
    await performFullLogin(page, user);
    
    // Final verification
    const finalVerification = await verifyLoggedIn(page, user.username);
    if (!finalVerification) {
      throw new Error(`Failed to log in user ${user.username} after retry`);
    }
  }
  
  console.log(`🎉 Smart login successful for ${user.username}`);
}
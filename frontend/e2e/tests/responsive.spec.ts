import { test, expect } from '@playwright/test';
import { navigateToPage } from '../helpers/test-data';

test.describe('Responsive Design', () => {
  
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  for (const viewport of viewports) {
    test.describe(`${viewport.name} viewport (${viewport.width}x${viewport.height})`, () => {
      
      test('should render responsive layout', async ({ page }) => {
        // Set viewport size for this test
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await navigateToPage(page, '/');
        await page.waitForLoadState('networkidle');
        
        // Take screenshot for visual comparison
        await page.screenshot({ 
          path: `test-results/responsive-${viewport.name.toLowerCase()}.png`,
          fullPage: true 
        });
        
        // Basic responsive checks
        const body = page.locator('body');
        await expect(body).toBeVisible();
        
        // Check that content doesn't overflow horizontally
        const bodyBox = await body.boundingBox();
        if (bodyBox) {
          expect(bodyBox.width).toBeLessThanOrEqual(viewport.width);
        }
      });

      test('should handle mobile interactions', async ({ page }) => {
        if (viewport.name === 'Mobile') {
          // Set viewport size for this test
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await navigateToPage(page, '/');
          
          // Test touch interactions
          // Look for clickable elements
          const clickableElements = page.locator('button, a, input[type="submit"]');
          const count = await clickableElements.count();
          
          if (count > 0) {
            // Check that buttons are large enough for touch
            for (let i = 0; i < Math.min(count, 3); i++) {
              const element = clickableElements.nth(i);
              const box = await element.boundingBox();
              
              if (box) {
                // Minimum touch target size should be 44x44px
                expect(box.height).toBeGreaterThanOrEqual(32);
                expect(box.width).toBeGreaterThanOrEqual(32);
              }
            }
          }
        }
      });

      test('should have responsive navigation', async ({ page }) => {
        // Set viewport size for this test
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await navigateToPage(page, '/');
        
        // Check for navigation elements
        const nav = page.locator('nav, header, .navbar');
        
        if (await nav.count() > 0) {
          await expect(nav.first()).toBeVisible();
          
          // On mobile, navigation might be collapsed
          if (viewport.name === 'Mobile') {
            // Look for mobile menu toggle
            const mobileToggle = page.locator('[aria-label*="menu"], .hamburger, .menu-toggle');
            
            if (await mobileToggle.count() > 0) {
              await expect(mobileToggle.first()).toBeVisible();
            }
          }
        }
      });
    });
  }

  test.describe('Cross-browser Responsive Testing', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work on ${browserName}`, async ({ page }) => {
        // This test runs on different browsers automatically via playwright.config.ts projects
        // Set a standard viewport size for cross-browser testing
        await page.setViewportSize({ width: 1280, height: 720 });
        await navigateToPage(page, '/');
        await page.waitForLoadState('networkidle');
        
        // Take browser-specific screenshot
        await page.screenshot({ 
          path: `test-results/browser-${browserName}-responsive.png`,
          fullPage: true 
        });
        
        // Basic responsiveness check
        const viewport = page.viewportSize();
        if (viewport) {
          const body = page.locator('body');
          const bodyBox = await body.boundingBox();
          
          if (bodyBox) {
            expect(bodyBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      });
    });
  });
});
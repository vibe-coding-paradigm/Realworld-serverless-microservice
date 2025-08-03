import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api';
import { generateTestUser, generateTestArticle, generateTestComment, waitTimes, navigateToPage } from '../helpers/test-data';

test.describe('Comments System E2E Tests', () => {
  
  test.describe('Comments API Tests @backend', () => {
    let api: ApiHelper;
    let testUser: { username: string; email: string; password: string };
    let userToken: string;
    let testArticle: any;
    let articleSlug: string;

    test.beforeEach(async ({ request }) => {
      api = new ApiHelper(request);
      testUser = generateTestUser();
      
      // Create user and get token
      const { response: userResponse, data: userData } = await api.createUser(testUser);
      expect(userResponse.status()).toBe(201);
      expect(userData.user.token).toBeTruthy();
      userToken = userData.user.token;
      
      // Create test article
      testArticle = generateTestArticle();
      const { response: articleResponse, data: articleData } = await api.createArticle(testArticle, userToken);
      expect(articleResponse.status()).toBe(201);
      expect(articleData.article.slug).toBeTruthy();
      articleSlug = articleData.article.slug;
    });

    test('should get empty comments list for new article', async () => {
      const { response, data } = await api.getComments(articleSlug);
      
      expect(response.status()).toBe(200);
      expect(data).toBeTruthy();
      expect(data.comments).toBeDefined();
      expect(Array.isArray(data.comments)).toBeTruthy();
      expect(data.comments).toHaveLength(0);
    });

    test('should create comment with authentication', async () => {
      const commentData = generateTestComment();
      
      const { response, data } = await api.createComment(articleSlug, commentData, userToken);
      
      expect(response.status()).toBe(201);
      expect(data.comment).toBeDefined();
      expect(data.comment.body).toBe(commentData.body);
      expect(data.comment.author.username).toBe(testUser.username);
      expect(data.comment.id).toBeTruthy();
      expect(data.comment.createdAt).toBeTruthy();
    });

    test('should fail to create comment without authentication', async () => {
      const commentData = generateTestComment();
      
      const { response } = await api.createComment(articleSlug, commentData, '');
      
      expect(response.status()).toBe(401);
    });

    test('should get comments list after creating comments', async () => {
      // Create multiple comments
      const comment1 = generateTestComment();
      const comment2 = generateTestComment();
      
      const { response: create1Response } = await api.createComment(articleSlug, comment1, userToken);
      expect(create1Response.status()).toBe(201);
      
      const { response: create2Response } = await api.createComment(articleSlug, comment2, userToken);
      expect(create2Response.status()).toBe(201);
      
      // Get comments list
      const { response, data } = await api.getComments(articleSlug);
      
      expect(response.status()).toBe(200);
      expect(data.comments).toBeDefined();
      expect(data.comments).toHaveLength(2);
      
      // Verify comment structure
      const comments = data.comments;
      expect(comments[0]).toHaveProperty('id');
      expect(comments[0]).toHaveProperty('body');
      expect(comments[0]).toHaveProperty('author');
      expect(comments[0]).toHaveProperty('createdAt');
      expect(comments[0].author.username).toBe(testUser.username);
    });

    test('should delete comment by author', async () => {
      // Create comment first
      const commentData = generateTestComment();
      const { response: createResponse, data: createData } = await api.createComment(articleSlug, commentData, userToken);
      expect(createResponse.status()).toBe(201);
      
      const commentId = createData.comment.id;
      
      // Delete the comment
      const { response: deleteResponse } = await api.deleteComment(articleSlug, commentId, userToken);
      expect(deleteResponse.status()).toBe(200);
      
      // Verify comment is removed from list
      const { response: getResponse, data: getData } = await api.getComments(articleSlug);
      expect(getResponse.status()).toBe(200);
      expect(getData).toBeTruthy();
      expect(getData.comments).toBeDefined();
      expect(Array.isArray(getData.comments)).toBeTruthy();
      expect(getData.comments).toHaveLength(0);
    });

    test('should fail to delete comment without authentication', async () => {
      // Create comment first
      const commentData = generateTestComment();
      const { response: createResponse, data: createData } = await api.createComment(articleSlug, commentData, userToken);
      expect(createResponse.status()).toBe(201);
      
      const commentId = createData.comment.id;
      
      // Try to delete without token
      const { response: deleteResponse } = await api.deleteComment(articleSlug, commentId, '');
      expect(deleteResponse.status()).toBe(401);
    });

    test('should fail to delete comment by non-author', async () => {
      // Create comment with first user
      const commentData = generateTestComment();
      const { response: createResponse, data: createData } = await api.createComment(articleSlug, commentData, userToken);
      expect(createResponse.status()).toBe(201);
      
      const commentId = createData.comment.id;
      
      // Create second user
      const secondUser = generateTestUser();
      const { response: secondUserResponse, data: secondUserData } = await api.createUser(secondUser);
      expect(secondUserResponse.status()).toBe(201);
      const secondUserToken = secondUserData.user.token;
      
      // Try to delete comment with second user's token
      const { response: deleteResponse } = await api.deleteComment(articleSlug, commentId, secondUserToken);
      expect(deleteResponse.status()).toBe(403);
    });
  });

  test.describe('Comments UI Tests @frontend', () => {
    let testUser: { username: string; email: string; password: string };
    let testArticle: any;
    let articleSlug: string;

    test.beforeEach(async ({ page, request }) => {
      const api = new ApiHelper(request);
      testUser = generateTestUser();
      
      // Create user via API
      const { response: userResponse, data: userData } = await api.createUser(testUser);
      expect(userResponse.status()).toBe(201);
      const userToken = userData.user.token;
      
      // Create test article via API
      testArticle = generateTestArticle();
      const { response: articleResponse, data: articleData } = await api.createArticle(testArticle, userToken);
      expect(articleResponse.status()).toBe(201);
      articleSlug = articleData.article.slug;
    });

    test('should display comments section on article page', async ({ page }) => {
      // Navigate to article page
      await navigateToPage(page, `/article/${articleSlug}`);
      await page.waitForLoadState('networkidle');
      
      // Check comments section exists
      await expect(page.locator('.comments-section, [data-testid="comments-section"]')).toBeVisible({ timeout: waitTimes.medium });
      await expect(page.locator('text=Comments')).toBeVisible();
    });

    test('should show comment form when logged in', async ({ page }) => {
      // Login first
      await navigateToPage(page, '/login');
      await page.waitForLoadState('networkidle');
      
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`text=${testUser.username}`)).toBeVisible({ timeout: waitTimes.medium });
      
      // Navigate to article page
      await navigateToPage(page, `/article/${articleSlug}`);
      await page.waitForLoadState('networkidle');
      
      // Check comment form is visible
      await expect(page.locator('textarea[placeholder*="comment"], textarea[name="body"]')).toBeVisible({ timeout: waitTimes.medium });
      await expect(page.locator('button:has-text("Post Comment")')).toBeVisible();
    });

    test('should create and display comment', async ({ page }) => {
      // Login first
      await navigateToPage(page, '/login');
      await page.waitForLoadState('networkidle');
      
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`text=${testUser.username}`)).toBeVisible({ timeout: waitTimes.medium });
      
      // Navigate to article page
      await navigateToPage(page, `/article/${articleSlug}`);
      await page.waitForLoadState('networkidle');
      
      // Create comment
      const commentText = `Test comment created at ${new Date().toISOString()}`;
      
      await page.locator('textarea[placeholder*="comment"], textarea[name="body"]').fill(commentText);
      
      // Monitor comment creation request
      const responsePromise = page.waitForResponse(response => 
        response.url().includes(`/api/articles/${articleSlug}/comments`) && 
        response.request().method() === 'POST'
      );
      
      await page.click('button:has-text("Post Comment")');
      
      // Wait for API response
      const response = await responsePromise;
      expect(response.status()).toBe(201);
      
      // Wait for UI to update
      await page.waitForTimeout(2000);
      
      // Verify comment appears in the list
      await expect(page.locator(`.comment-card:has-text("${commentText}"), .comment:has-text("${commentText}")`)).toBeVisible({ timeout: waitTimes.medium });
      await expect(page.locator(`text=${testUser.username}`)).toBeVisible();
    });

    test('should show delete button only for own comments', async ({ page, request }) => {
      const api = new ApiHelper(request);
      
      // Login first
      await navigateToPage(page, '/login');
      await page.waitForLoadState('networkidle');
      
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      const userToken = await page.evaluate(() => localStorage.getItem('token'));
      expect(userToken).toBeTruthy();
      
      // Create comment via API to ensure it exists
      const commentData = generateTestComment();
      const { response: commentResponse, data: commentResponseData } = await api.createComment(articleSlug, commentData, userToken);
      expect(commentResponse.status()).toBe(201);
      
      // Navigate to article page
      await navigateToPage(page, `/article/${articleSlug}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for comments to load
      await page.waitForTimeout(3000);
      
      // Check that delete button exists for own comment
      const commentCard = page.locator(`.comment-card:has-text("${commentData.body}"), .comment:has-text("${commentData.body}")`);
      await expect(commentCard).toBeVisible({ timeout: waitTimes.medium });
      
      // Look for delete button within the comment (various possible selectors)
      const deleteButton = commentCard.locator('button:has-text("Delete"), button[class*="delete"], button .ion-trash-a, .text-red-500');
      await expect(deleteButton).toBeVisible({ timeout: waitTimes.short });
    });

    test('should delete comment when delete button clicked', async ({ page, request }) => {
      const api = new ApiHelper(request);
      
      // Login first
      await navigateToPage(page, '/login');
      await page.waitForLoadState('networkidle');
      
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      const userToken = await page.evaluate(() => localStorage.getItem('token'));
      expect(userToken).toBeTruthy();
      
      // Create comment via API to ensure it exists
      const commentData = generateTestComment();
      const { response: commentResponse } = await api.createComment(articleSlug, commentData, userToken);
      expect(commentResponse.status()).toBe(201);
      
      // Navigate to article page
      await navigateToPage(page, `/article/${articleSlug}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for comments to load
      await page.waitForTimeout(3000);
      
      // Verify comment exists
      const commentCard = page.locator(`.comment-card:has-text("${commentData.body}"), .comment:has-text("${commentData.body}")`);
      await expect(commentCard).toBeVisible({ timeout: waitTimes.medium });
      
      // Set up delete request monitoring
      const deleteResponsePromise = page.waitForResponse(response => 
        response.url().includes(`/api/articles/${articleSlug}/comments/`) && 
        response.request().method() === 'DELETE'
      );
      
      // Click delete button
      const deleteButton = commentCard.locator('button:has-text("Delete"), button[class*="delete"], button .ion-trash-a, .text-red-500');
      await deleteButton.click();
      
      // Handle confirmation dialog if it appears
      page.on('dialog', dialog => dialog.accept());
      
      // Wait for delete API response
      const deleteResponse = await deleteResponsePromise;
      expect(deleteResponse.status()).toBe(200);
      
      // Wait for UI to update
      await page.waitForTimeout(2000);
      
      // Verify comment is removed from UI
      await expect(commentCard).not.toBeVisible();
    });

    test('should update comment count after adding/removing comments', async ({ page, request }) => {
      const api = new ApiHelper(request);
      
      // Login first
      await navigateToPage(page, '/login');
      await page.waitForLoadState('networkidle');
      
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      
      // Navigate to article page
      await navigateToPage(page, `/article/${articleSlug}`);
      await page.waitForLoadState('networkidle');
      
      // Check initial comment count (should be 0)
      const commentCountLocator = page.locator('text=/Comments \\((\\d+)\\)/');
      await expect(commentCountLocator).toContainText('Comments (0)');
      
      // Create comment via UI
      const commentText = `Test comment for count ${Date.now()}`;
      await page.locator('textarea[placeholder*="comment"], textarea[name="body"]').fill(commentText);
      
      const createResponsePromise = page.waitForResponse(response => 
        response.url().includes(`/api/articles/${articleSlug}/comments`) && 
        response.request().method() === 'POST'
      );
      
      await page.click('button:has-text("Post Comment")');
      
      // Wait for creation
      const createResponse = await createResponsePromise;
      expect(createResponse.status()).toBe(201);
      
      // Wait for UI update
      await page.waitForTimeout(2000);
      
      // Check comment count updated to 1
      await expect(commentCountLocator).toContainText('Comments (1)');
      
      // Delete the comment
      const commentCard = page.locator(`.comment-card:has-text("${commentText}"), .comment:has-text("${commentText}")`);
      await expect(commentCard).toBeVisible();
      
      const deleteResponsePromise = page.waitForResponse(response => 
        response.url().includes(`/api/articles/${articleSlug}/comments/`) && 
        response.request().method() === 'DELETE'
      );
      
      const deleteButton = commentCard.locator('button:has-text("Delete"), button[class*="delete"], button .ion-trash-a, .text-red-500');
      await deleteButton.click();
      
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept());
      
      // Wait for deletion
      const deleteResponse = await deleteResponsePromise;
      expect(deleteResponse.status()).toBe(200);
      
      // Wait for UI update
      await page.waitForTimeout(2000);
      
      // Check comment count back to 0
      await expect(commentCountLocator).toContainText('Comments (0)');
    });
  });

  test.describe('Comments Integration Tests', () => {
    test('complete comment lifecycle: create article → add comments → delete comments → verify cleanup', async ({ page, request }) => {
      const api = new ApiHelper(request);
      const testUser = generateTestUser();
      
      // Step 1: Create user and login via UI
      await navigateToPage(page, '/register');
      await page.waitForLoadState('networkidle');
      
      await page.locator('input[name="username"]').fill(testUser.username);
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      
      const registerResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/users') && response.request().method() === 'POST'
      );
      
      await page.click('button:has-text("Sign up")');
      
      const registerResponse = await registerResponsePromise;
      expect(registerResponse.status()).toBe(201);
      
      // Wait for auto-login
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`text=${testUser.username}`)).toBeVisible({ timeout: waitTimes.medium });
      
      // Step 2: Create article via UI
      await page.click('a:has-text("New Article")');
      await expect(page.locator('h1:has-text("New Article")')).toBeVisible();
      
      const testArticle = generateTestArticle();
      await page.locator('input[name="title"]').fill(testArticle.title);
      await page.locator('input[name="description"]').fill(testArticle.description);
      await page.locator('textarea[name="body"]').fill(testArticle.body);
      
      const articleResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/articles') && response.request().method() === 'POST'
      );
      
      await page.click('button:has-text("Publish Article")');
      
      const articleResponse = await articleResponsePromise;
      expect(articleResponse.status()).toBe(201);
      
      // Wait for redirect to article page
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/article/');
      
      // Step 3: Add multiple comments
      const comments = [
        'First comment in the thread',
        'Second comment with more details',
        'Final comment to complete the test'
      ];
      
      for (const commentText of comments) {
        await page.locator('textarea[placeholder*="comment"], textarea[name="body"]').fill(commentText);
        
        const commentResponsePromise = page.waitForResponse(response => 
          response.url().includes('/comments') && response.request().method() === 'POST'
        );
        
        await page.click('button:has-text("Post Comment")');
        
        const commentResponse = await commentResponsePromise;
        expect(commentResponse.status()).toBe(201);
        
        await page.waitForTimeout(1000); // Wait for UI update
      }
      
      // Step 4: Verify all comments are displayed
      for (const commentText of comments) {
        await expect(page.locator(`.comment-card:has-text("${commentText}"), .comment:has-text("${commentText}")`)).toBeVisible();
      }
      
      // Verify comment count
      await expect(page.locator('text=/Comments \\(3\\)/')).toBeVisible();
      
      // Step 5: Delete comments one by one
      for (const commentText of comments) {
        const commentCard = page.locator(`.comment-card:has-text("${commentText}"), .comment:has-text("${commentText}")`);
        
        const deleteResponsePromise = page.waitForResponse(response => 
          response.url().includes('/comments/') && response.request().method() === 'DELETE'
        );
        
        const deleteButton = commentCard.locator('button:has-text("Delete"), button[class*="delete"], button .ion-trash-a, .text-red-500');
        await deleteButton.click();
        
        // Handle confirmation dialog
        page.on('dialog', dialog => dialog.accept());
        
        const deleteResponse = await deleteResponsePromise;
        expect(deleteResponse.status()).toBe(200);
        
        await page.waitForTimeout(1000); // Wait for UI update
        
        // Verify comment is removed
        await expect(commentCard).not.toBeVisible();
      }
      
      // Step 6: Verify final state
      await expect(page.locator('text=/Comments \\(0\\)/')).toBeVisible();
      await expect(page.locator('text=No comments yet')).toBeVisible();
      
      console.log('✅ Complete comment lifecycle test passed');
    });
  });
});
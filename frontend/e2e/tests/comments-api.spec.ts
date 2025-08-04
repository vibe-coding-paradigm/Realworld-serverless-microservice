import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api';
import { generateTestUser, generateTestArticle, generateTestComment } from '../helpers/test-data';

test.describe('Comments API Tests', () => {
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
    expect(userData).toBeTruthy();
    expect(userData.user.token).toBeTruthy();
    userToken = userData.user.token;
    
    // Create test article
    testArticle = generateTestArticle();
    const { response: articleResponse, data: articleData } = await api.createArticle(testArticle, userToken);
    expect(articleResponse.status()).toBe(201);
    expect(articleData).toBeTruthy();
    expect(articleData.article.slug).toBeTruthy();
    articleSlug = articleData.article.slug;
  });

  test('should get comments list for existing article', async () => {
    const { response, data } = await api.getComments(articleSlug);
    
    expect(response.status()).toBe(200);
    expect(data).toBeTruthy();
    expect(data.comments).toBeDefined();
    // Comments can be null or empty array for new articles
    if (data.comments !== null) {
      expect(Array.isArray(data.comments)).toBeTruthy();
    }
  });

  test('should create comment with valid authentication', async () => {
    const commentData = generateTestComment();
    
    const { response, data } = await api.createComment(articleSlug, commentData, userToken);
    
    expect(response.status()).toBe(201);
    expect(data).toBeTruthy();
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

  test('should get comments list after creating comment', async () => {
    // Create a comment first
    const commentData = generateTestComment();
    const { response: createResponse } = await api.createComment(articleSlug, commentData, userToken);
    expect(createResponse.status()).toBe(201);
    
    // Wait for DynamoDB eventual consistency
    await api.waitForConsistency();
    
    // Get comments list
    const { response, data } = await api.getComments(articleSlug);
    
    expect(response.status()).toBe(200);
    expect(data).toBeTruthy();
    expect(data.comments).toBeDefined();
    expect(Array.isArray(data.comments)).toBeTruthy();
    expect(data.comments.length).toBeGreaterThan(0);
    
    // Find our comment
    const ourComment = data.comments.find((c: any) => c.body === commentData.body);
    expect(ourComment).toBeTruthy();
    expect(ourComment.author.username).toBe(testUser.username);
  });

  test('should delete comment by author', async () => {
    // Create comment first
    const commentData = generateTestComment();
    const { response: createResponse, data: createData } = await api.createComment(articleSlug, commentData, userToken);
    expect(createResponse.status()).toBe(201);
    expect(createData?.comment?.id).toBeTruthy();
    
    const commentId = createData.comment.id;
    
    // Delete the comment
    const { response: deleteResponse } = await api.deleteComment(articleSlug, commentId, userToken);
    expect(deleteResponse.status()).toBe(200);
    
    // Wait for DynamoDB eventual consistency
    await api.waitForConsistency();
    
    // Verify comment is removed from list
    const { response: getResponse, data: getData } = await api.getComments(articleSlug);
    expect(getResponse.status()).toBe(200);
    
    if (getData && getData.comments && Array.isArray(getData.comments)) {
      const remainingComment = getData.comments.find((c: any) => c.id === commentId);
      expect(remainingComment).toBeFalsy();
    }
  });

  test('should fail to delete comment without authentication', async () => {
    // Create comment first
    const commentData = generateTestComment();
    const { response: createResponse, data: createData } = await api.createComment(articleSlug, commentData, userToken);
    expect(createResponse.status()).toBe(201);
    
    const commentId = createData?.comment?.id;
    expect(commentId).toBeTruthy();
    
    // Try to delete without token
    const { response: deleteResponse } = await api.deleteComment(articleSlug, commentId, '');
    expect(deleteResponse.status()).toBe(401);
  });

  test('should fail to delete comment by non-author', async () => {
    // Create comment with first user
    const commentData = generateTestComment();
    const { response: createResponse, data: createData } = await api.createComment(articleSlug, commentData, userToken);
    expect(createResponse.status()).toBe(201);
    
    const commentId = createData?.comment?.id;
    expect(commentId).toBeTruthy();
    
    // Create second user
    const secondUser = generateTestUser();
    const { response: secondUserResponse, data: secondUserData } = await api.createUser(secondUser);
    expect(secondUserResponse.status()).toBe(201);
    const secondUserToken = secondUserData?.user?.token;
    expect(secondUserToken).toBeTruthy();
    
    // Try to delete comment with second user's token
    const { response: deleteResponse } = await api.deleteComment(articleSlug, commentId, secondUserToken);
    expect(deleteResponse.status()).toBe(403);
  });

  test('should handle multiple comments lifecycle', async () => {
    const comments = [
      generateTestComment(),
      generateTestComment(),
      generateTestComment()
    ];
    
    const createdCommentIds: string[] = [];
    
    // Create multiple comments
    for (const commentData of comments) {
      const { response, data } = await api.createComment(articleSlug, commentData, userToken);
      expect(response.status()).toBe(201);
      expect(data?.comment?.id).toBeTruthy();
      createdCommentIds.push(data.comment.id);
    }
    
    // Wait for DynamoDB eventual consistency
    await api.waitForConsistency();
    
    // Verify all comments exist
    const { response: getResponse, data: getData } = await api.getComments(articleSlug);
    expect(getResponse.status()).toBe(200);
    expect(getData?.comments).toBeTruthy();
    expect(Array.isArray(getData.comments)).toBeTruthy();
    expect(getData.comments.length).toBe(3);
    
    // Delete comments one by one
    for (const commentId of createdCommentIds) {
      const { response: deleteResponse } = await api.deleteComment(articleSlug, commentId, userToken);
      expect(deleteResponse.status()).toBe(200);
    }
    
    // Wait for DynamoDB eventual consistency
    await api.waitForConsistency();
    
    // Verify all comments are gone
    const { response: finalResponse, data: finalData } = await api.getComments(articleSlug);
    expect(finalResponse.status()).toBe(200);
    
    // Comments list should be empty or null
    if (finalData && finalData.comments) {
      expect(finalData.comments.length).toBe(0);
    }
  });
});
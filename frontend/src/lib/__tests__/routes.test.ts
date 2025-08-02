import { describe, it, expect } from 'vitest';
import { ROUTES, createRoutes } from '../routes';

describe('Routes', () => {
  describe('ROUTES constants', () => {
    it('should define all required route paths', () => {
      expect(ROUTES.HOME).toBe('/');
      expect(ROUTES.LOGIN).toBe('/login');
      expect(ROUTES.REGISTER).toBe('/register');
      expect(ROUTES.ARTICLES).toBe('/articles');
      expect(ROUTES.ARTICLE_DETAIL).toBe('/article/:slug');
      expect(ROUTES.EDITOR).toBe('/editor');
      expect(ROUTES.EDITOR_EDIT).toBe('/editor/:slug');
      expect(ROUTES.PROFILE).toBe('/profile/:username');
      expect(ROUTES.SETTINGS).toBe('/settings');
    });

    it('should have no duplicate paths', () => {
      const values = Object.values(ROUTES);
      const uniqueValues = [...new Set(values)];
      expect(values).toHaveLength(uniqueValues.length);
    });

    it('should use consistent path format', () => {
      const values = Object.values(ROUTES);
      values.forEach(path => {
        // All paths should start with /
        expect(path).toMatch(/^\//);
        // No paths should end with / (except root)
        if (path !== '/') {
          expect(path).not.toMatch(/\/$/);
        }
      });
    });
  });

  describe('createRoutes helpers', () => {
    it('should create article detail route', () => {
      const slug = 'test-article-slug';
      const result = createRoutes.articleDetail(slug);
      expect(result).toBe('/article/test-article-slug');
    });

    it('should create editor edit route', () => {
      const slug = 'test-article-slug';
      const result = createRoutes.editorEdit(slug);
      expect(result).toBe('/editor/test-article-slug');
    });

    it('should create profile route', () => {
      const username = 'testuser';
      const result = createRoutes.profile(username);
      expect(result).toBe('/profile/testuser');
    });

    it('should handle special characters in parameters', () => {
      const slugWithSpecialChars = 'test-article-with-123';
      const result = createRoutes.articleDetail(slugWithSpecialChars);
      expect(result).toBe('/article/test-article-with-123');
    });

    it('should handle empty parameters gracefully', () => {
      const result = createRoutes.articleDetail('');
      expect(result).toBe('/article/');
    });
  });
});
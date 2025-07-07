package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/db"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/models"
)

// ArticleHandler handles article-related HTTP requests
type ArticleHandler struct {
	articleRepo *db.ArticleRepository
	userRepo    *db.UserRepository
}

// NewArticleHandler creates a new article handler
func NewArticleHandler(articleRepo *db.ArticleRepository, userRepo *db.UserRepository) *ArticleHandler {
	return &ArticleHandler{
		articleRepo: articleRepo,
		userRepo:    userRepo,
	}
}

// GetArticles handles GET /api/articles
func (h *ArticleHandler) GetArticles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		return
	}

	// Parse query parameters
	query := r.URL.Query()
	filter := models.ArticleFilter{
		Tag:       query.Get("tag"),
		Author:    query.Get("author"),
		Favorited: query.Get("favorited"),
		Limit:     20, // Default limit
		Offset:    0,  // Default offset
	}

	// Parse limit
	if limitStr := query.Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			filter.Limit = limit
		}
	}

	// Parse offset
	if offsetStr := query.Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			filter.Offset = offset
		}
	}

	// Get articles
	articles, total, err := h.articleRepo.GetAll(filter)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch articles")
		return
	}

	// Return response
	response := models.ArticlesResponse{
		Articles:      articles,
		ArticlesCount: total,
	}

	WriteJSONResponse(w, http.StatusOK, response)
}

// GetArticle handles GET /api/articles/:slug
func (h *ArticleHandler) GetArticle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		return
	}

	// Extract slug from URL path
	slug := h.extractSlugFromPath(r.URL.Path)
	if slug == "" {
		WriteErrorResponse(w, http.StatusBadRequest, "slug", "Invalid slug")
		return
	}

	// Get article
	article, err := h.articleRepo.GetBySlug(slug)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			WriteErrorResponse(w, http.StatusNotFound, "article", "Article not found")
			return
		}
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch article")
		return
	}

	// Author info is already loaded in the article from the repository
	// Create a user object for the ToResponse method
	author := &models.User{
		Username: article.Author.Username,
		Bio:      article.Author.Bio,
		Image:    article.Author.Image,
	}

	// Return response
	response := article.ToResponse(author)
	WriteJSONResponse(w, http.StatusOK, response)
}

// CreateArticle handles POST /api/articles
func (h *ArticleHandler) CreateArticle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		return
	}

	// Get user from auth middleware
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		WriteErrorResponse(w, http.StatusUnauthorized, "auth", "Authentication required")
		return
	}

	// Parse request
	var req models.CreateArticleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteErrorResponse(w, http.StatusBadRequest, "body", "Invalid JSON")
		return
	}

	// Validate required fields
	if req.Article.Title == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "title", "Title is required")
		return
	}
	if req.Article.Description == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "description", "Description is required")
		return
	}
	if req.Article.Body == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "body", "Body is required")
		return
	}

	// Get user info
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch user")
		return
	}

	// Create article
	article := &models.Article{
		Title:       req.Article.Title,
		Description: req.Article.Description,
		Body:        req.Article.Body,
		TagList:     req.Article.TagList,
		Author: models.Author{
			Username: user.Username,
		},
	}

	if err := h.articleRepo.Create(article); err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to create article")
		return
	}

	// Return response
	response := article.ToResponse(user)
	WriteJSONResponse(w, http.StatusCreated, response)
}

// UpdateArticle handles PUT /api/articles/:slug
func (h *ArticleHandler) UpdateArticle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		return
	}

	// Get user from auth middleware
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		WriteErrorResponse(w, http.StatusUnauthorized, "auth", "Authentication required")
		return
	}

	// Extract slug from URL path
	slug := h.extractSlugFromPath(r.URL.Path)
	if slug == "" {
		WriteErrorResponse(w, http.StatusBadRequest, "slug", "Invalid slug")
		return
	}

	// Check if article exists and user is the author
	existingArticle, err := h.articleRepo.GetBySlug(slug)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			WriteErrorResponse(w, http.StatusNotFound, "article", "Article not found")
			return
		}
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch article")
		return
	}

	// Get current user
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch user")
		return
	}

	// Check if user is the author
	if existingArticle.Author.Username != user.Username {
		WriteErrorResponse(w, http.StatusForbidden, "permission", "You can only update your own articles")
		return
	}

	// Parse request
	var req models.UpdateArticleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteErrorResponse(w, http.StatusBadRequest, "body", "Invalid JSON")
		return
	}

	// Create update article with only provided fields
	updateArticle := &models.Article{}
	if req.Article.Title != nil {
		updateArticle.Title = *req.Article.Title
	}
	if req.Article.Description != nil {
		updateArticle.Description = *req.Article.Description
	}
	if req.Article.Body != nil {
		updateArticle.Body = *req.Article.Body
	}
	if req.Article.TagList != nil {
		updateArticle.TagList = req.Article.TagList
	}

	// Update article
	if err := h.articleRepo.Update(slug, updateArticle); err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to update article")
		return
	}

	// Get updated article
	updatedArticle, err := h.articleRepo.GetBySlug(updateArticle.Slug)
	if err != nil {
		// Fallback to original slug if new slug is not set
		if updateArticle.Slug == "" {
			updatedArticle, err = h.articleRepo.GetBySlug(slug)
		}
		if err != nil {
			WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch updated article")
			return
		}
	}

	// Return response
	response := updatedArticle.ToResponse(user)
	WriteJSONResponse(w, http.StatusOK, response)
}

// DeleteArticle handles DELETE /api/articles/:slug
func (h *ArticleHandler) DeleteArticle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		return
	}

	// Get user from auth middleware
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		WriteErrorResponse(w, http.StatusUnauthorized, "auth", "Authentication required")
		return
	}

	// Extract slug from URL path
	slug := h.extractSlugFromPath(r.URL.Path)
	if slug == "" {
		WriteErrorResponse(w, http.StatusBadRequest, "slug", "Invalid slug")
		return
	}

	// Check if article exists and user is the author
	existingArticle, err := h.articleRepo.GetBySlug(slug)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			WriteErrorResponse(w, http.StatusNotFound, "article", "Article not found")
			return
		}
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch article")
		return
	}

	// Get current user
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch user")
		return
	}

	// Check if user is the author
	if existingArticle.Author.Username != user.Username {
		WriteErrorResponse(w, http.StatusForbidden, "permission", "You can only delete your own articles")
		return
	}

	// Delete article
	if err := h.articleRepo.Delete(slug); err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to delete article")
		return
	}

	// Return empty response
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("{}")); err != nil {
		// Log error but don't fail the request since article was deleted
		return
	}
}

// Helper method to extract slug from URL path
func (h *ArticleHandler) extractSlugFromPath(path string) string {
	// Expected paths: /api/articles/{slug} or /api/articles/{slug}/comments
	parts := strings.Split(strings.Trim(path, "/"), "/")

	// Should be at least ["api", "articles", "slug"]
	if len(parts) < 3 || parts[0] != "api" || parts[1] != "articles" {
		return ""
	}

	return parts[2]
}

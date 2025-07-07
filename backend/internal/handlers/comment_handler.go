package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/db"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/models"
)

// CommentHandler handles comment-related HTTP requests
type CommentHandler struct {
	commentRepo *db.CommentRepository
	userRepo    *db.UserRepository
}

// NewCommentHandler creates a new comment handler
func NewCommentHandler(commentRepo *db.CommentRepository, userRepo *db.UserRepository) *CommentHandler {
	return &CommentHandler{
		commentRepo: commentRepo,
		userRepo:    userRepo,
	}
}

// GetComments handles GET /api/articles/:slug/comments
func (h *CommentHandler) GetComments(w http.ResponseWriter, r *http.Request) {
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

	// Get comments
	comments, err := h.commentRepo.GetByArticleSlug(slug)
	if err != nil {
		if strings.Contains(err.Error(), "article not found") {
			WriteErrorResponse(w, http.StatusNotFound, "article", "Article not found")
			return
		}
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch comments")
		return
	}

	// Return response
	response := models.CommentsResponse{
		Comments: comments,
	}

	WriteJSONResponse(w, http.StatusOK, response)
}

// CreateComment handles POST /api/articles/:slug/comments
func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
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

	// Extract slug from URL path
	slug := h.extractSlugFromPath(r.URL.Path)
	if slug == "" {
		WriteErrorResponse(w, http.StatusBadRequest, "slug", "Invalid slug")
		return
	}

	// Parse request
	var req models.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteErrorResponse(w, http.StatusBadRequest, "body", "Invalid JSON")
		return
	}

	// Validate required fields
	if req.Comment.Body == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "body", "Body is required")
		return
	}

	// Get user info
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch user")
		return
	}

	// Create comment
	comment := &models.Comment{
		Body: req.Comment.Body,
	}

	if err := h.commentRepo.Create(comment, slug, userID); err != nil {
		if strings.Contains(err.Error(), "article not found") {
			WriteErrorResponse(w, http.StatusNotFound, "article", "Article not found")
			return
		}
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to create comment")
		return
	}

	// Set author info for response
	comment.Author = models.Author{
		Username:  user.Username,
		Bio:       user.Bio,
		Image:     user.Image,
		Following: false, // TODO: Implement following logic
	}

	// Return response
	response := comment.ToResponse(user)
	WriteJSONResponse(w, http.StatusCreated, response)
}

// DeleteComment handles DELETE /api/articles/:slug/comments/:id
func (h *CommentHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
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

	// Extract slug and comment ID from URL path
	slug, commentID := h.extractSlugAndCommentIDFromPath(r.URL.Path)
	if slug == "" || commentID == "" {
		WriteErrorResponse(w, http.StatusBadRequest, "path", "Invalid slug or comment ID")
		return
	}

	// Check if comment exists
	comment, err := h.commentRepo.GetByID(commentID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			WriteErrorResponse(w, http.StatusNotFound, "comment", "Comment not found")
			return
		}
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch comment")
		return
	}

	// Get current user
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to fetch user")
		return
	}

	// Check if user is the author of the comment
	if comment.Author.Username != user.Username {
		WriteErrorResponse(w, http.StatusForbidden, "permission", "You can only delete your own comments")
		return
	}

	// Delete comment
	if err := h.commentRepo.Delete(commentID); err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to delete comment")
		return
	}

	// Return empty response
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("{}")); err != nil {
		// Log error but don't fail the request since comment was deleted
		return
	}
}

// Helper methods

// extractSlugFromPath extracts slug from /api/articles/{slug}/comments path
func (h *CommentHandler) extractSlugFromPath(path string) string {
	// Expected path: /api/articles/{slug}/comments
	parts := strings.Split(strings.Trim(path, "/"), "/")

	// Should be ["api", "articles", "slug", "comments"]
	if len(parts) != 4 || parts[0] != "api" || parts[1] != "articles" || parts[3] != "comments" {
		return ""
	}

	return parts[2]
}

// extractSlugAndCommentIDFromPath extracts slug and comment ID from /api/articles/{slug}/comments/{id} path
func (h *CommentHandler) extractSlugAndCommentIDFromPath(path string) (string, string) {
	// Expected path: /api/articles/{slug}/comments/{id}
	parts := strings.Split(strings.Trim(path, "/"), "/")

	// Should be ["api", "articles", "slug", "comments", "id"]
	if len(parts) != 5 || parts[0] != "api" || parts[1] != "articles" || parts[3] != "comments" {
		return "", ""
	}

	return parts[2], parts[4]
}

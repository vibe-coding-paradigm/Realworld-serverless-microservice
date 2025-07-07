package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/auth"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/db"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/models"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userRepo *db.UserRepository
}

// NewUserHandler creates a new user handler
func NewUserHandler(userRepo *db.UserRepository) *UserHandler {
	return &UserHandler{
		userRepo: userRepo,
	}
}

// Register handles user registration
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteErrorResponse(w, http.StatusBadRequest, "body", "Invalid JSON")
		return
	}

	// Validate required fields
	if req.User.Email == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "email", "Email is required")
		return
	}

	if req.User.Username == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "username", "Username is required")
		return
	}

	if req.User.Password == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "password", "Password is required")
		return
	}

	// Validate email format (basic validation)
	if !strings.Contains(req.User.Email, "@") {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "email", "Invalid email format")
		return
	}

	// Check if email already exists
	emailExists, err := h.userRepo.EmailExists(req.User.Email)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Database error")
		return
	}

	if emailExists {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "email", "Email already exists")
		return
	}

	// Check if username already exists
	usernameExists, err := h.userRepo.UsernameExists(req.User.Username)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Database error")
		return
	}

	if usernameExists {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "username", "Username already exists")
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.User.Password)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "password", "Failed to process password")
		return
	}

	// Create user
	user := &models.User{
		Email:        req.User.Email,
		Username:     req.User.Username,
		PasswordHash: hashedPassword,
		Bio:          "",
		Image:        "",
	}

	if err := h.userRepo.Create(user); err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "database", "Failed to create user")
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "token", "Failed to generate token")
		return
	}

	// Return user response
	response := map[string]interface{}{
		"user": user.ToResponse(token),
	}

	WriteJSONResponse(w, http.StatusCreated, response)
}

// Login handles user authentication
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteErrorResponse(w, http.StatusBadRequest, "body", "Invalid JSON")
		return
	}

	// Validate required fields
	if req.User.Email == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "email", "Email is required")
		return
	}

	if req.User.Password == "" {
		WriteErrorResponse(w, http.StatusUnprocessableEntity, "password", "Password is required")
		return
	}

	// Get user by email
	user, err := h.userRepo.GetByEmail(req.User.Email)
	if err != nil {
		WriteErrorResponse(w, http.StatusUnauthorized, "email", "Invalid email or password")
		return
	}

	// Check password
	if !auth.CheckPasswordHash(req.User.Password, user.PasswordHash) {
		WriteErrorResponse(w, http.StatusUnauthorized, "password", "Invalid email or password")
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "token", "Failed to generate token")
		return
	}

	// Return user response
	response := map[string]interface{}{
		"user": user.ToResponse(token),
	}

	WriteJSONResponse(w, http.StatusOK, response)
}

// GetCurrentUser returns the current authenticated user
func (h *UserHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		return
	}

	// Get user ID from middleware
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		WriteErrorResponse(w, http.StatusUnauthorized, "token", "User not authenticated")
		return
	}

	// Get user from database
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		WriteErrorResponse(w, http.StatusNotFound, "user", "User not found")
		return
	}

	// Generate new token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "token", "Failed to generate token")
		return
	}

	// Return user response
	response := map[string]interface{}{
		"user": user.ToResponse(token),
	}

	WriteJSONResponse(w, http.StatusOK, response)
}

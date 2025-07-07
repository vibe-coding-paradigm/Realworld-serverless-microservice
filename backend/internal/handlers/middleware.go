package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/auth"
)

// ErrorResponse represents an error response
type ErrorResponse struct {
	Errors map[string][]string `json:"errors"`
}

// NewErrorResponse creates a new error response
func NewErrorResponse(field, message string) ErrorResponse {
	return ErrorResponse{
		Errors: map[string][]string{
			field: {message},
		},
	}
}

// WriteErrorResponse writes an error response to the HTTP response writer
func WriteErrorResponse(w http.ResponseWriter, statusCode int, field, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	errorResp := NewErrorResponse(field, message)
	json.NewEncoder(w).Encode(errorResp)
}

// WriteJSONResponse writes a JSON response to the HTTP response writer
func WriteJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// AuthMiddleware validates JWT tokens for protected routes
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			WriteErrorResponse(w, http.StatusUnauthorized, "token", "Missing authorization header")
			return
		}

		// Check if it starts with "Token "
		if !strings.HasPrefix(authHeader, "Token ") {
			WriteErrorResponse(w, http.StatusUnauthorized, "token", "Invalid authorization header format")
			return
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, "Token ")
		if tokenString == "" {
			WriteErrorResponse(w, http.StatusUnauthorized, "token", "Missing token")
			return
		}

		// Validate token
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			WriteErrorResponse(w, http.StatusUnauthorized, "token", "Invalid token")
			return
		}

		// Add user ID to request context
		r.Header.Set("X-User-ID", claims.UserID)
		r.Header.Set("X-User-Email", claims.Email)

		next.ServeHTTP(w, r)
	}
}

// CORSMiddleware handles CORS headers
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

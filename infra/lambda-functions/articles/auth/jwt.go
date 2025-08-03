package auth

import (
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT claims
type Claims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// ValidateToken validates a JWT token and returns the user information
func ValidateToken(tokenString, jwtSecret string) (*Claims, error) {
	// Parse and validate the token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the algorithm
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Check if token is valid
	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// Extract claims
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

// ExtractTokenFromHeader extracts JWT token from Authorization header
func ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("authorization header is required")
	}

	// Check for "Token " prefix (RealWorld spec)
	if strings.HasPrefix(authHeader, "Token ") {
		return strings.TrimPrefix(authHeader, "Token "), nil
	}

	// Check for "Bearer " prefix (standard)
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer "), nil
	}

	return "", fmt.Errorf("invalid authorization header format")
}
package auth

import (
	"errors"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken   = errors.New("invalid token")
	ErrMissingToken   = errors.New("missing authorization token")
	ErrInvalidFormat  = errors.New("invalid authorization header format")
)

// Claims represents JWT claims
type Claims struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

// ExtractUsernameFromAuth extracts username from Authorization header
func ExtractUsernameFromAuth(authHeader, jwtSecret string) (string, error) {
	if authHeader == "" {
		return "", ErrMissingToken
	}

	// Check if header starts with "Token " or "Bearer "
	var tokenString string
	if strings.HasPrefix(authHeader, "Token ") {
		tokenString = strings.TrimPrefix(authHeader, "Token ")
	} else if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	} else {
		return "", ErrInvalidFormat
	}

	if tokenString == "" {
		return "", ErrMissingToken
	}

	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	// Extract claims
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims.Username, nil
	}

	return "", ErrInvalidToken
}
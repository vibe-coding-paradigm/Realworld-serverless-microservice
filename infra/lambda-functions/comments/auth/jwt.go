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
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// ExtractClaimsFromAuth extracts claims from Authorization header
func ExtractClaimsFromAuth(authHeader, jwtSecret string) (*Claims, error) {
	if authHeader == "" {
		return nil, ErrMissingToken
	}

	// Check if header starts with "Token " or "Bearer "
	var tokenString string
	if strings.HasPrefix(authHeader, "Token ") {
		tokenString = strings.TrimPrefix(authHeader, "Token ")
	} else if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	} else {
		return nil, ErrInvalidFormat
	}

	if tokenString == "" {
		return nil, ErrMissingToken
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
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	// Extract claims
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

// ExtractUsernameFromAuth extracts username from Authorization header
func ExtractUsernameFromAuth(authHeader, jwtSecret string) (string, error) {
	claims, err := ExtractClaimsFromAuth(authHeader, jwtSecret)
	if err != nil {
		return "", err
	}
	return claims.Username, nil
}
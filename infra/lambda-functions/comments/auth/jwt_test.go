package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExtractUsernameFromAuth_MissingToken(t *testing.T) {
	username, err := ExtractUsernameFromAuth("", "secret")
	assert.Empty(t, username)
	assert.Equal(t, ErrMissingToken, err)
}

func TestExtractUsernameFromAuth_InvalidFormat(t *testing.T) {
	username, err := ExtractUsernameFromAuth("InvalidFormat some-token", "secret")
	assert.Empty(t, username)
	assert.Equal(t, ErrInvalidFormat, err)
}

func TestExtractUsernameFromAuth_EmptyToken(t *testing.T) {
	username, err := ExtractUsernameFromAuth("Token ", "secret")
	assert.Empty(t, username)
	assert.Equal(t, ErrMissingToken, err)
	
	username, err = ExtractUsernameFromAuth("Bearer ", "secret")
	assert.Empty(t, username)
	assert.Equal(t, ErrMissingToken, err)
}

func TestExtractUsernameFromAuth_InvalidToken(t *testing.T) {
	username, err := ExtractUsernameFromAuth("Token invalid-token", "secret")
	assert.Empty(t, username)
	assert.ErrorIs(t, err, ErrInvalidToken)
}

func TestExtractUsernameFromAuth_ValidToken(t *testing.T) {
	// Create a valid JWT token
	secret := "test-secret"
	expectedUsername := "testuser"
	
	claims := &Claims{
		Username: expectedUsername,
		Email:    "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	require.NoError(t, err)
	
	// Test with Token prefix
	username, err := ExtractUsernameFromAuth("Token "+tokenString, secret)
	assert.NoError(t, err)
	assert.Equal(t, expectedUsername, username)
	
	// Test with Bearer prefix
	username, err = ExtractUsernameFromAuth("Bearer "+tokenString, secret)
	assert.NoError(t, err)
	assert.Equal(t, expectedUsername, username)
}

func TestExtractUsernameFromAuth_ExpiredToken(t *testing.T) {
	secret := "test-secret"
	
	claims := &Claims{
		Username: "testuser",
		Email:    "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expired 1 hour ago
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	require.NoError(t, err)
	
	username, err := ExtractUsernameFromAuth("Token "+tokenString, secret)
	assert.Empty(t, username)
	assert.ErrorIs(t, err, ErrInvalidToken)
}

func TestExtractUsernameFromAuth_WrongSecret(t *testing.T) {
	// Create token with one secret
	secret := "test-secret"
	wrongSecret := "wrong-secret"
	
	claims := &Claims{
		Username: "testuser",
		Email:    "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	require.NoError(t, err)
	
	// Try to verify with wrong secret
	username, err := ExtractUsernameFromAuth("Token "+tokenString, wrongSecret)
	assert.Empty(t, username)
	assert.ErrorIs(t, err, ErrInvalidToken)
}

func TestExtractUsernameFromAuth_WrongSigningMethod(t *testing.T) {
	// Use a malformed token with wrong signing method to simulate the error
	tokenString := "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.invalid"
	
	username, err := ExtractUsernameFromAuth("Token "+tokenString, "secret")
	assert.Empty(t, username)
	assert.ErrorIs(t, err, ErrInvalidToken)
}
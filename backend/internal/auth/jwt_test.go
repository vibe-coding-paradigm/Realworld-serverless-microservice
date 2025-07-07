package auth

import (
	"os"
	"testing"
	"time"
)

func TestGenerateToken(t *testing.T) {
	// Set JWT secret for testing
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	userID := "test-user-id"
	email := "test@example.com"

	token, err := GenerateToken(userID, email)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if token == "" {
		t.Fatal("Expected token to be generated, got empty string")
	}
}

func TestValidateToken(t *testing.T) {
	// Set JWT secret for testing
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	userID := "test-user-id"
	email := "test@example.com"

	// Generate a token
	token, err := GenerateToken(userID, email)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	// Validate the token
	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("Expected UserID %s, got %s", userID, claims.UserID)
	}

	if claims.Email != email {
		t.Errorf("Expected Email %s, got %s", email, claims.Email)
	}
}

func TestValidateTokenInvalid(t *testing.T) {
	// Set JWT secret for testing
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	invalidToken := "invalid.token.here"

	_, err := ValidateToken(invalidToken)
	if err == nil {
		t.Fatal("Expected error for invalid token, got nil")
	}
}

func TestValidateTokenExpired(t *testing.T) {
	// Set JWT secret for testing
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	userID := "test-user-id"
	email := "test@example.com"

	// Generate a token with past expiration time
	token, err := generateTokenWithExpiration(userID, email, time.Now().Add(-time.Hour))
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	_, err = ValidateToken(token)
	if err == nil {
		t.Fatal("Expected error for expired token, got nil")
	}
}

func TestHashPassword(t *testing.T) {
	password := "testpassword123"

	hashedPassword, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if hashedPassword == "" {
		t.Fatal("Expected hashed password, got empty string")
	}

	if hashedPassword == password {
		t.Fatal("Expected hashed password to be different from original")
	}
}

func TestCheckPasswordHash(t *testing.T) {
	password := "testpassword123"

	hashedPassword, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	// Test correct password
	isValid := CheckPasswordHash(password, hashedPassword)
	if !isValid {
		t.Fatal("Expected password to be valid")
	}

	// Test incorrect password
	isValid = CheckPasswordHash("wrongpassword", hashedPassword)
	if isValid {
		t.Fatal("Expected password to be invalid")
	}
}

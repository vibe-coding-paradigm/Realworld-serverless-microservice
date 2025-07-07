package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	_ "github.com/mattn/go-sqlite3"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/db"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/models"
)

func setupTestHandler(t *testing.T) (*UserHandler, *sql.DB) {
	// Set JWT secret for testing
	os.Setenv("JWT_SECRET", "test-secret-key")

	// Create in-memory database for testing
	database, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Create users table
	createTableSQL := `
	CREATE TABLE users (
		id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
		email TEXT NOT NULL UNIQUE,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		bio TEXT DEFAULT '',
		image TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = database.Exec(createTableSQL)
	if err != nil {
		t.Fatalf("Failed to create users table: %v", err)
	}

	userRepo := db.NewUserRepository(database)
	handler := NewUserHandler(userRepo)

	return handler, database
}

func TestUserHandler_Register(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()

	// Valid registration request
	registerReq := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "password123",
		},
	}

	reqBody, _ := json.Marshal(registerReq)
	req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("Expected status code %d, got %d", http.StatusCreated, rr.Code)
	}

	var response map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&response)

	user, ok := response["user"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected user object in response")
	}

	if user["email"] != "test@example.com" {
		t.Errorf("Expected email test@example.com, got %v", user["email"])
	}

	if user["username"] != "testuser" {
		t.Errorf("Expected username testuser, got %v", user["username"])
	}

	if user["token"] == nil || user["token"] == "" {
		t.Error("Expected token in response")
	}
}

func TestUserHandler_Register_DuplicateEmail(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()

	// Create first user
	registerReq := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "testuser1",
			Email:    "test@example.com",
			Password: "password123",
		},
	}

	reqBody, _ := json.Marshal(registerReq)
	req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewReader(reqBody))
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	// Try to create second user with same email
	registerReq2 := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "testuser2",
			Email:    "test@example.com", // Same email
			Password: "password123",
		},
	}

	reqBody2, _ := json.Marshal(registerReq2)
	req2 := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewReader(reqBody2))
	rr2 := httptest.NewRecorder()
	handler.Register(rr2, req2)

	if rr2.Code != http.StatusUnprocessableEntity {
		t.Errorf("Expected status code %d, got %d", http.StatusUnprocessableEntity, rr2.Code)
	}
}

func TestUserHandler_Login(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()

	// First register a user
	registerReq := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "password123",
		},
	}

	reqBody, _ := json.Marshal(registerReq)
	req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewReader(reqBody))
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	// Now login
	loginReq := models.LoginRequest{
		User: struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: "password123",
		},
	}

	loginBody, _ := json.Marshal(loginReq)
	loginRequest := httptest.NewRequest(http.MethodPost, "/api/users/login", bytes.NewReader(loginBody))
	loginRecorder := httptest.NewRecorder()
	handler.Login(loginRecorder, loginRequest)

	if loginRecorder.Code != http.StatusOK {
		t.Errorf("Expected status code %d, got %d", http.StatusOK, loginRecorder.Code)
	}

	var response map[string]interface{}
	json.NewDecoder(loginRecorder.Body).Decode(&response)

	user, ok := response["user"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected user object in response")
	}

	if user["email"] != "test@example.com" {
		t.Errorf("Expected email test@example.com, got %v", user["email"])
	}

	if user["token"] == nil || user["token"] == "" {
		t.Error("Expected token in response")
	}
}

func TestUserHandler_Login_InvalidCredentials(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()

	// Try to login with non-existent user
	loginReq := models.LoginRequest{
		User: struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "nonexistent@example.com",
			Password: "password123",
		},
	}

	loginBody, _ := json.Marshal(loginReq)
	loginRequest := httptest.NewRequest(http.MethodPost, "/api/users/login", bytes.NewReader(loginBody))
	loginRecorder := httptest.NewRecorder()
	handler.Login(loginRecorder, loginRequest)

	if loginRecorder.Code != http.StatusUnauthorized {
		t.Errorf("Expected status code %d, got %d", http.StatusUnauthorized, loginRecorder.Code)
	}
}

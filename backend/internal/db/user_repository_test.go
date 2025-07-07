package db

import (
	"database/sql"
	"testing"

	_ "github.com/mattn/go-sqlite3"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/models"
)

func setupTestDB(t *testing.T) *sql.DB {
	// Create in-memory database for testing
	db, err := sql.Open("sqlite3", ":memory:")
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

	_, err = db.Exec(createTableSQL)
	if err != nil {
		t.Fatalf("Failed to create users table: %v", err)
	}

	return db
}

func TestUserRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)

	user := &models.User{
		Email:        "test@example.com",
		Username:     "testuser",
		PasswordHash: "hashedpassword",
		Bio:          "Test bio",
		Image:        "",
	}

	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Check that ID was generated
	if user.ID == "" {
		t.Fatal("Expected user ID to be generated")
	}
}

func TestUserRepository_GetByEmail(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)

	// Create a user first
	user := &models.User{
		Email:        "test@example.com",
		Username:     "testuser",
		PasswordHash: "hashedpassword",
	}

	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Retrieve by email
	retrievedUser, err := repo.GetByEmail("test@example.com")
	if err != nil {
		t.Fatalf("Failed to get user by email: %v", err)
	}

	if retrievedUser.Email != user.Email {
		t.Errorf("Expected email %s, got %s", user.Email, retrievedUser.Email)
	}

	if retrievedUser.Username != user.Username {
		t.Errorf("Expected username %s, got %s", user.Username, retrievedUser.Username)
	}
}

func TestUserRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)

	// Create a user first
	user := &models.User{
		Email:        "test@example.com",
		Username:     "testuser",
		PasswordHash: "hashedpassword",
	}

	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Retrieve by ID
	retrievedUser, err := repo.GetByID(user.ID)
	if err != nil {
		t.Fatalf("Failed to get user by ID: %v", err)
	}

	if retrievedUser.ID != user.ID {
		t.Errorf("Expected ID %s, got %s", user.ID, retrievedUser.ID)
	}
}

func TestUserRepository_GetByEmail_NotFound(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)

	_, err := repo.GetByEmail("nonexistent@example.com")
	if err == nil {
		t.Fatal("Expected error for non-existent user, got nil")
	}
}

func TestUserRepository_EmailExists(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)

	// Create a user first
	user := &models.User{
		Email:        "test@example.com",
		Username:     "testuser",
		PasswordHash: "hashedpassword",
	}

	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Check if email exists
	exists, err := repo.EmailExists("test@example.com")
	if err != nil {
		t.Fatalf("Failed to check email existence: %v", err)
	}

	if !exists {
		t.Fatal("Expected email to exist")
	}

	// Check non-existent email
	exists, err = repo.EmailExists("nonexistent@example.com")
	if err != nil {
		t.Fatalf("Failed to check email existence: %v", err)
	}

	if exists {
		t.Fatal("Expected email to not exist")
	}
}

func TestUserRepository_UsernameExists(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)

	// Create a user first
	user := &models.User{
		Email:        "test@example.com",
		Username:     "testuser",
		PasswordHash: "hashedpassword",
	}

	err := repo.Create(user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Check if username exists
	exists, err := repo.UsernameExists("testuser")
	if err != nil {
		t.Fatalf("Failed to check username existence: %v", err)
	}

	if !exists {
		t.Fatal("Expected username to exist")
	}

	// Check non-existent username
	exists, err = repo.UsernameExists("nonexistentuser")
	if err != nil {
		t.Fatalf("Failed to check username existence: %v", err)
	}

	if exists {
		t.Fatal("Expected username to not exist")
	}
}

package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/models"
)

// UserRepository handles user data operations
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user in the database
func (r *UserRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (email, username, password_hash, bio, image)
		VALUES (?, ?, ?, ?, ?)
		RETURNING id, created_at, updated_at
	`

	row := r.db.QueryRow(query, user.Email, user.Username, user.PasswordHash, user.Bio, user.Image)

	err := row.Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, bio, image, created_at, updated_at
		FROM users
		WHERE email = ?
	`

	var user models.User
	row := r.db.QueryRow(query, email)

	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.Bio,
		&user.Image,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id string) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, bio, image, created_at, updated_at
		FROM users
		WHERE id = ?
	`

	var user models.User
	row := r.db.QueryRow(query, id)

	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.Bio,
		&user.Image,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return &user, nil
}

// EmailExists checks if an email already exists in the database
func (r *UserRepository) EmailExists(email string) (bool, error) {
	query := `SELECT COUNT(*) FROM users WHERE email = ?`

	var count int
	err := r.db.QueryRow(query, email).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check email existence: %w", err)
	}

	return count > 0, nil
}

// UsernameExists checks if a username already exists in the database
func (r *UserRepository) UsernameExists(username string) (bool, error) {
	query := `SELECT COUNT(*) FROM users WHERE username = ?`

	var count int
	err := r.db.QueryRow(query, username).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check username existence: %w", err)
	}

	return count > 0, nil
}

// Update updates user information
func (r *UserRepository) Update(user *models.User) error {
	query := `
		UPDATE users 
		SET email = ?, username = ?, password_hash = ?, bio = ?, image = ?, updated_at = ?
		WHERE id = ?
	`

	user.UpdatedAt = time.Now()

	_, err := r.db.Exec(query,
		user.Email,
		user.Username,
		user.PasswordHash,
		user.Bio,
		user.Image,
		user.UpdatedAt,
		user.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"` // Never include in JSON responses
	Bio          string    `json:"bio"`
	Image        string    `json:"image"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserResponse represents the user data returned in API responses
type UserResponse struct {
	Email    string `json:"email"`
	Token    string `json:"token"`
	Username string `json:"username"`
	Bio      string `json:"bio"`
	Image    string `json:"image"`
}

// RegisterRequest represents the request payload for user registration
type RegisterRequest struct {
	User struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	} `json:"user"`
}

// LoginRequest represents the request payload for user login
type LoginRequest struct {
	User struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	} `json:"user"`
}

// UserUpdateRequest represents the request payload for updating user profile
type UserUpdateRequest struct {
	User struct {
		Email    string `json:"email,omitempty"`
		Username string `json:"username,omitempty"`
		Password string `json:"password,omitempty"`
		Bio      string `json:"bio,omitempty"`
		Image    string `json:"image,omitempty"`
	} `json:"user"`
}

// ToResponse converts a User to UserResponse with the given token
func (u *User) ToResponse(token string) UserResponse {
	return UserResponse{
		Email:    u.Email,
		Token:    token,
		Username: u.Username,
		Bio:      u.Bio,
		Image:    u.Image,
	}
}

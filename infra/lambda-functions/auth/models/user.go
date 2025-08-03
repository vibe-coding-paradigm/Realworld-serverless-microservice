package models

import (
	"time"
)

// User represents a user in the DynamoDB system
type User struct {
	UserID       string    `json:"user_id" dynamodbav:"user_id"`
	Email        string    `json:"email" dynamodbav:"email"`
	Username     string    `json:"username" dynamodbav:"username"`
	PasswordHash string    `json:"-" dynamodbav:"password_hash"` // Never include in JSON responses
	Bio          string    `json:"bio" dynamodbav:"bio"`
	Image        string    `json:"image" dynamodbav:"image"`
	CreatedAt    time.Time `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" dynamodbav:"updated_at"`
	PK           string    `json:"-" dynamodbav:"PK"` // USER#<user_id>
	SK           string    `json:"-" dynamodbav:"SK"` // PROFILE
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

// SetDynamoDBKeys sets the PK and SK for DynamoDB operations
func (u *User) SetDynamoDBKeys() {
	u.PK = "USER#" + u.UserID
	u.SK = "PROFILE"
}
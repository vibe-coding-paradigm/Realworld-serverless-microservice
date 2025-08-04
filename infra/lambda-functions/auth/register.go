package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/auth"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/models"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/repository"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/utils"
)

// HandleRegister handles user registration requests
func HandleRegister(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Register function invoked: Method=%s, Path=%s", request.HTTPMethod, request.Path)

	// Handle CORS preflight requests
	if request.HTTPMethod == "OPTIONS" {
		return utils.SuccessResponse(200, map[string]interface{}{}), nil
	}

	// Only allow POST method
	if request.HTTPMethod != "POST" {
		return utils.ErrorResponse(405, "method", "Method not allowed"), nil
	}

	// Parse request body
	var registerReq models.RegisterRequest
	if err := json.Unmarshal([]byte(request.Body), &registerReq); err != nil {
		log.Printf("Failed to parse JSON: %v", err)
		return utils.ErrorResponse(400, "body", "Invalid JSON"), nil
	}

	// Extract user data
	userData := registerReq.User
	email := userData.Email
	username := userData.Username
	password := userData.Password

	// Validate required fields
	if email == "" {
		return utils.ErrorResponse(422, "email", "Email is required"), nil
	}

	if username == "" {
		return utils.ErrorResponse(422, "username", "Username is required"), nil
	}

	if password == "" {
		return utils.ErrorResponse(422, "password", "Password is required"), nil
	}

	// Validate field formats
	if !utils.ValidateEmail(email) {
		return utils.ErrorResponse(422, "email", "Invalid email format"), nil
	}

	if !utils.ValidateUsername(username) {
		return utils.ErrorResponse(422, "username", "Username must be 3-30 characters, alphanumeric and underscores only"), nil
	}

	if !utils.ValidatePassword(password) {
		return utils.ErrorResponse(422, "password", "Password must be at least 6 characters"), nil
	}

	// Initialize repository
	repo, err := repository.NewDynamoDBRepository()
	if err != nil {
		log.Printf("Failed to initialize repository: %v", err)
		return utils.ErrorResponse(500, "database", "Database initialization error"), nil
	}

	// Check if email already exists
	emailExists, err := repo.EmailExists(email)
	if err != nil {
		log.Printf("Failed to check email existence: %v", err)
		return utils.ErrorResponse(500, "database", "Database error"), nil
	}

	if emailExists {
		return utils.ErrorResponse(422, "email", "Email already exists"), nil
	}

	// Check if username already exists
	usernameExists, err := repo.UsernameExists(username)
	if err != nil {
		log.Printf("Failed to check username existence: %v", err)
		return utils.ErrorResponse(500, "database", "Database error"), nil
	}

	if usernameExists {
		return utils.ErrorResponse(422, "username", "Username already exists"), nil
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		log.Printf("Failed to hash password: %v", err)
		return utils.ErrorResponse(500, "password", "Failed to process password"), nil
	}

	// Create user
	user := &models.User{
		Email:        email,
		Username:     username,
		PasswordHash: hashedPassword,
		Bio:          "",
		Image:        "",
	}

	if err := repo.Create(user); err != nil {
		log.Printf("Failed to create user: %v", err)
		return utils.ErrorResponse(500, "database", "Failed to create user"), nil
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.UserID, user.Email, user.Username)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		return utils.ErrorResponse(500, "token", "Failed to generate token"), nil
	}

	// Return successful response
	responseData := map[string]interface{}{
		"user": user.ToResponse(token),
	}

	log.Printf("User registration successful: UserID=%s, Email=%s, Username=%s", user.UserID, user.Email, user.Username)
	return utils.SuccessResponse(201, responseData), nil
}

func main() {
	lambda.Start(HandleRegister)
}
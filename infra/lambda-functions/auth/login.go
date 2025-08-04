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

// HandleLogin handles user login requests
func HandleLogin(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Login function invoked: Method=%s, Path=%s", request.HTTPMethod, request.Path)

	// Handle CORS preflight requests
	if request.HTTPMethod == "OPTIONS" {
		return utils.SuccessResponse(200, map[string]interface{}{}), nil
	}

	// Only allow POST method
	if request.HTTPMethod != "POST" {
		return utils.ErrorResponse(405, "method", "Method not allowed"), nil
	}

	// Parse request body
	var loginReq models.LoginRequest
	if err := json.Unmarshal([]byte(request.Body), &loginReq); err != nil {
		log.Printf("Failed to parse JSON: %v", err)
		return utils.ErrorResponse(400, "body", "Invalid JSON"), nil
	}

	// Extract user data
	userData := loginReq.User
	email := userData.Email
	password := userData.Password

	// Validate required fields
	if email == "" {
		return utils.ErrorResponse(422, "email", "Email is required"), nil
	}

	if password == "" {
		return utils.ErrorResponse(422, "password", "Password is required"), nil
	}

	// Initialize repository
	repo, err := repository.NewDynamoDBRepository()
	if err != nil {
		log.Printf("Failed to initialize repository: %v", err)
		return utils.ErrorResponse(500, "database", "Database initialization error"), nil
	}

	// Get user by email
	user, err := repo.GetByEmail(email)
	if err != nil {
		log.Printf("Failed to get user by email: %v", err)
		return utils.ErrorResponse(401, "email", "Invalid email or password"), nil
	}

	// Check password
	if !auth.CheckPasswordHash(password, user.PasswordHash) {
		log.Printf("Invalid password for user: %s", email)
		return utils.ErrorResponse(401, "password", "Invalid email or password"), nil
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

	log.Printf("User login successful: UserID=%s, Email=%s", user.UserID, user.Email)
	return utils.SuccessResponse(200, responseData), nil
}

func main() {
	lambda.Start(HandleLogin)
}
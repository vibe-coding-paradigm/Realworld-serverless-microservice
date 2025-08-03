package main

import (
	"context"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/auth"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/repository"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/utils"
)

// HandleGetUser handles get current user requests
func HandleGetUser(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("GetUser function invoked: Method=%s, Path=%s", request.HTTPMethod, request.Path)

	// Handle CORS preflight requests
	if request.HTTPMethod == "OPTIONS" {
		return utils.SuccessResponse(200, map[string]interface{}{}), nil
	}

	// Only allow GET method
	if request.HTTPMethod != "GET" {
		return utils.ErrorResponse(405, "method", "Method not allowed"), nil
	}

	// Extract Authorization header
	authHeader, exists := request.Headers["Authorization"]
	if !exists {
		// Try lowercase (API Gateway might normalize headers)
		authHeader, exists = request.Headers["authorization"]
	}
	
	if !exists || authHeader == "" {
		return utils.ErrorResponse(401, "token", "Authorization header required"), nil
	}

	// Parse Bearer token
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return utils.ErrorResponse(401, "token", "Invalid token format"), nil
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == "" {
		return utils.ErrorResponse(401, "token", "Invalid token format"), nil
	}

	// Validate JWT token
	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		log.Printf("Failed to validate token: %v", err)
		return utils.ErrorResponse(401, "token", "Invalid token"), nil
	}

	// Initialize repository
	repo, err := repository.NewDynamoDBRepository()
	if err != nil {
		log.Printf("Failed to initialize repository: %v", err)
		return utils.ErrorResponse(500, "database", "Database initialization error"), nil
	}

	// Get user from database
	user, err := repo.GetByID(claims.UserID)
	if err != nil {
		log.Printf("Failed to get user by ID: %v", err)
		return utils.ErrorResponse(404, "user", "User not found"), nil
	}

	// Generate new token (refresh the token)
	newToken, err := auth.GenerateToken(user.UserID, user.Email)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		return utils.ErrorResponse(500, "token", "Failed to generate token"), nil
	}

	// Return successful response
	responseData := map[string]interface{}{
		"user": user.ToResponse(newToken),
	}

	log.Printf("Get user successful: UserID=%s, Email=%s", user.UserID, user.Email)
	return utils.SuccessResponse(200, responseData), nil
}

func main() {
	lambda.Start(HandleGetUser)
}
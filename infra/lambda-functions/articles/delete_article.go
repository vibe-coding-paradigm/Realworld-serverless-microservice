package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/vibe-coding-paradigm/realworld-serverless-articles/auth"
	"github.com/vibe-coding-paradigm/realworld-serverless-articles/repository"
	"github.com/vibe-coding-paradigm/realworld-serverless-articles/utils"
)

var (
	repo      *repository.DynamoDBRepository
	jwtSecret string
)

func init() {
	// Initialize AWS session
	sess := session.Must(session.NewSession())
	dynamoClient := dynamodb.New(sess)

	// Get environment variables
	tableName := os.Getenv("ARTICLES_TABLE_NAME")
	jwtSecret = os.Getenv("JWT_SECRET")

	if tableName == "" {
		log.Fatal("ARTICLES_TABLE_NAME environment variable is required")
	}
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	// Initialize repository
	repo = repository.NewDynamoDBRepository(dynamoClient, tableName)
}

// DeleteArticleHandler handles DELETE /articles/:slug requests
func DeleteArticleHandler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Delete article function invoked: Method=%s, Path=%s", request.HTTPMethod, request.Path)

	// Handle CORS preflight
	if request.HTTPMethod == "OPTIONS" {
		return utils.SuccessResponse(200, map[string]string{"message": "OK"})
	}

	// Check HTTP method
	if request.HTTPMethod != "DELETE" {
		return utils.ErrorResponse(405, "method", "Method not allowed")
	}

	// Authentication is required for deleting articles
	authHeader := request.Headers["Authorization"]
	if authHeader == "" {
		return utils.ErrorResponse(401, "authorization", "Authorization header is required")
	}

	// Extract and validate JWT token
	token, err := auth.ExtractTokenFromHeader(authHeader)
	if err != nil {
		return utils.ErrorResponse(401, "authorization", "Invalid authorization header format")
	}

	claims, err := auth.ValidateToken(token, jwtSecret)
	if err != nil {
		log.Printf("Token validation failed: %v", err)
		return utils.ErrorResponse(401, "authorization", "Invalid or expired token")
	}

	// Extract slug from path parameters
	slug := request.PathParameters["slug"]
	if slug == "" {
		return utils.ErrorResponse(400, "slug", "Article slug is required")
	}

	// Delete article from repository
	err = repo.Delete(slug, claims.UserID)
	if err != nil {
		log.Printf("Failed to delete article: %v", err)
		if err.Error() == "article not found" {
			return utils.ErrorResponse(404, "article", "Article not found")
		}
		if err.Error() == "unauthorized: user does not own this article" {
			return utils.ErrorResponse(403, "authorization", "You can only delete your own articles")
		}
		return utils.ErrorResponse(500, "server", "Failed to delete article")
	}

	// Return success response (no content)
	return utils.SuccessResponse(200, map[string]string{"message": "Article deleted successfully"})
}

func main() {
	lambda.Start(DeleteArticleHandler)
}
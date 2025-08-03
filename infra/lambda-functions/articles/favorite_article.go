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
	"github.com/vibe-coding-paradigm/realworld-serverless-articles/models"
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

// FavoriteArticleHandler handles POST/DELETE /articles/:slug/favorite requests
func FavoriteArticleHandler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Favorite article function invoked: Method=%s, Path=%s", request.HTTPMethod, request.Path)

	// Handle CORS preflight
	if request.HTTPMethod == "OPTIONS" {
		return utils.SuccessResponse(200, map[string]string{"message": "OK"})
	}

	// Check HTTP method
	if request.HTTPMethod != "POST" && request.HTTPMethod != "DELETE" {
		return utils.ErrorResponse(405, "method", "Method not allowed")
	}

	// Authentication is required for favorite operations
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

	var article *models.Article

	// Handle favorite/unfavorite based on HTTP method
	if request.HTTPMethod == "POST" {
		// Favorite the article
		article, err = repo.FavoriteArticle(slug, claims.UserID)
		if err != nil {
			log.Printf("Failed to favorite article: %v", err)
			if err.Error() == "article not found" {
				return utils.ErrorResponse(404, "article", "Article not found")
			}
			return utils.ErrorResponse(500, "server", "Failed to favorite article")
		}
	} else {
		// Unfavorite the article
		article, err = repo.UnfavoriteArticle(slug, claims.UserID)
		if err != nil {
			log.Printf("Failed to unfavorite article: %v", err)
			if err.Error() == "article not found" {
				return utils.ErrorResponse(404, "article", "Article not found")
			}
			return utils.ErrorResponse(500, "server", "Failed to unfavorite article")
		}
	}

	// Prepare response
	response := models.ArticleResponse{
		Article: *article,
	}

	return utils.SuccessResponse(200, response)
}

func main() {
	lambda.Start(FavoriteArticleHandler)
}
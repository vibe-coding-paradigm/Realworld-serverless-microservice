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

// GetArticleHandler handles GET /articles/:slug requests
func GetArticleHandler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get article function invoked: Method=%s, Path=%s", request.HTTPMethod, request.Path)

	// Handle CORS preflight
	if request.HTTPMethod == "OPTIONS" {
		return utils.SuccessResponse(200, map[string]string{"message": "OK"})
	}

	// Check HTTP method
	if request.HTTPMethod != "GET" {
		return utils.ErrorResponse(405, "method", "Method not allowed")
	}

	// Extract slug from path parameters
	slug := request.PathParameters["slug"]
	if slug == "" {
		return utils.ErrorResponse(400, "slug", "Article slug is required")
	}

	// Extract user ID from JWT token (optional for public endpoint)
	var userID string
	if authHeader := request.Headers["Authorization"]; authHeader != "" {
		token, err := auth.ExtractTokenFromHeader(authHeader)
		if err == nil {
			claims, err := auth.ValidateToken(token, jwtSecret)
			if err == nil {
				userID = claims.UserID
			}
			// Don't fail if token is invalid - this is a public endpoint
		}
	}

	// Get article from repository
	article, err := repo.GetBySlug(slug, userID)
	if err != nil {
		log.Printf("Failed to get article by slug %s: %v", slug, err)
		return utils.ErrorResponse(404, "article", "Article not found")
	}

	// Prepare response
	response := models.ArticleResponse{
		Article: *article,
	}

	return utils.SuccessResponse(200, response)
}

func main() {
	lambda.Start(GetArticleHandler)
}
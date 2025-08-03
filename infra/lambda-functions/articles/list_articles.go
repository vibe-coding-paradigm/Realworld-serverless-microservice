package main

import (
	"context"
	"log"
	"os"
	"strconv"

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

// ListArticlesHandler handles GET /articles requests
func ListArticlesHandler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List articles function invoked: Method=%s, Path=%s", request.HTTPMethod, request.Path)

	// Handle CORS preflight
	if request.HTTPMethod == "OPTIONS" {
		return utils.SuccessResponse(200, map[string]string{"message": "OK"})
	}

	// Check HTTP method
	if request.HTTPMethod != "GET" {
		return utils.ErrorResponse(405, "method", "Method not allowed")
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

	// Parse query parameters
	filter := models.ArticleFilter{
		Tag:       request.QueryStringParameters["tag"],
		Author:    request.QueryStringParameters["author"],
		Favorited: request.QueryStringParameters["favorited"],
		Limit:     20, // default
		Offset:    0,  // default
	}

	// Parse limit parameter
	if limitStr := request.QueryStringParameters["limit"]; limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 && limit <= 100 {
			filter.Limit = limit
		}
	}

	// Parse offset parameter
	if offsetStr := request.QueryStringParameters["offset"]; offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			filter.Offset = offset
		}
	}

	// Get articles from repository
	articles, totalCount, err := repo.GetAll(filter, userID)
	if err != nil {
		log.Printf("Failed to get articles: %v", err)
		return utils.ErrorResponse(500, "server", "Failed to retrieve articles")
	}

	// Prepare response
	response := models.ArticlesResponse{
		Articles:      articles,
		ArticlesCount: totalCount,
	}

	return utils.SuccessResponse(200, response)
}

func main() {
	lambda.Start(ListArticlesHandler)
}
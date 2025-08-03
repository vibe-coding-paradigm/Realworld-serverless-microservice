package main

import (
	"context"
	"encoding/json"
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

// CreateArticleHandler handles POST /articles requests
func CreateArticleHandler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Create article function invoked: Method=%s, Path=%s", request.HTTPMethod, request.Path)

	// Handle CORS preflight
	if request.HTTPMethod == "OPTIONS" {
		return utils.SuccessResponse(200, map[string]string{"message": "OK"})
	}

	// Check HTTP method
	if request.HTTPMethod != "POST" {
		return utils.ErrorResponse(405, "method", "Method not allowed")
	}

	// Authentication is required for creating articles
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

	// Parse request body
	var createReq models.CreateArticleRequest
	if err := json.Unmarshal([]byte(request.Body), &createReq); err != nil {
		log.Printf("Failed to parse JSON: %v", err)
		return utils.ErrorResponse(400, "body", "Invalid JSON format")
	}

	// Validate required fields
	if err := utils.ValidateRequired("title", createReq.Article.Title); err != nil {
		return utils.ErrorResponse(422, "title", err.Error())
	}
	if err := utils.ValidateRequired("description", createReq.Article.Description); err != nil {
		return utils.ErrorResponse(422, "description", err.Error())
	}
	if err := utils.ValidateRequired("body", createReq.Article.Body); err != nil {
		return utils.ErrorResponse(422, "body", err.Error())
	}

	// Create article
	article := &models.Article{
		Title:       createReq.Article.Title,
		Description: createReq.Article.Description,
		Body:        createReq.Article.Body,
		TagList:     createReq.Article.TagList,
	}

	// Create article in repository
	err = repo.Create(article, claims.UserID, claims.Username, "", "") // TODO: Get user bio and image
	if err != nil {
		log.Printf("Failed to create article: %v", err)
		return utils.ErrorResponse(500, "server", "Failed to create article")
	}

	// Get the created article with full details
	createdArticle, err := repo.GetBySlug(article.Slug, claims.UserID)
	if err != nil {
		log.Printf("Failed to get created article: %v", err)
		return utils.ErrorResponse(500, "server", "Article created but failed to retrieve")
	}

	// Prepare response
	response := models.ArticleResponse{
		Article: *createdArticle,
	}

	return utils.SuccessResponse(201, response)
}

func main() {
	lambda.Start(CreateArticleHandler)
}
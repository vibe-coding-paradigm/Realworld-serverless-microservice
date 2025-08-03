package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/vibe-coding-paradigm/conduit-comments/auth"
	"github.com/vibe-coding-paradigm/conduit-comments/models"
	"github.com/vibe-coding-paradigm/conduit-comments/repository"
	"github.com/vibe-coding-paradigm/conduit-comments/utils"
)

func main() {
	lambda.Start(HandleRequest)
}

// HandleRequest handles the Lambda request for creating a comment
func HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Received request: %+v", request)

	// Extract article slug from path parameters
	articleSlug := request.PathParameters["slug"]
	if articleSlug == "" {
		return utils.NewErrorResponse(http.StatusBadRequest, "slug", "Article slug is required")
	}

	// Get JWT secret from environment
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Printf("JWT_SECRET environment variable not set")
		return utils.NewErrorResponse(http.StatusInternalServerError, "server", "Internal server error")
	}

	// Extract username from authorization header
	authHeader := request.Headers["Authorization"]
	username, err := auth.ExtractUsernameFromAuth(authHeader, jwtSecret)
	if err != nil {
		log.Printf("Failed to extract username from auth: %v", err)
		return utils.NewErrorResponse(http.StatusUnauthorized, "authorization", "Invalid or missing token")
	}

	// Parse request body
	var commentReq models.CreateCommentRequest
	if err := json.Unmarshal([]byte(request.Body), &commentReq); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return utils.NewErrorResponse(http.StatusBadRequest, "body", "Invalid request format")
	}

	// Validate comment body
	body := strings.TrimSpace(commentReq.Comment.Body)
	if body == "" {
		return utils.NewErrorResponse(http.StatusUnprocessableEntity, "body", "Comment body cannot be empty")
	}

	// Get table name from environment
	tableName := os.Getenv("COMMENTS_TABLE_NAME")
	if tableName == "" {
		log.Printf("COMMENTS_TABLE_NAME environment variable not set")
		return utils.NewErrorResponse(http.StatusInternalServerError, "server", "Internal server error")
	}

	// Initialize repository
	repo, err := repository.NewDynamoDBRepository(tableName)
	if err != nil {
		log.Printf("Failed to initialize repository: %v", err)
		return utils.NewErrorResponse(http.StatusInternalServerError, "server", "Internal server error")
	}

	// Generate unique comment ID
	commentID := uuid.New().String()

	// Create new comment
	comment := models.NewComment(articleSlug, commentID, body, username)

	// Save comment to database
	if err := repo.CreateComment(comment); err != nil {
		log.Printf("Failed to create comment: %v", err)
		return utils.NewErrorResponse(http.StatusInternalServerError, "server", "Failed to create comment")
	}

	// Get author information
	author, err := repo.GetUserByUsername(username)
	if err != nil {
		log.Printf("Failed to get author info: %v", err)
		// Use basic author info if lookup fails
		author = &models.Author{
			Username:  username,
			Bio:       "",
			Image:     "",
			Following: false,
		}
	}
	comment.Author = *author

	// Return the created comment
	response := comment.ToResponse()
	return utils.NewResponse(http.StatusCreated, response)
}
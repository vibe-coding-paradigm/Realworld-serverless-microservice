package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/vibe-coding-paradigm/conduit-comments/auth"
	"github.com/vibe-coding-paradigm/conduit-comments/repository"
	"github.com/vibe-coding-paradigm/conduit-comments/utils"
)

func main() {
	lambda.Start(HandleRequest)
}

// HandleRequest handles the Lambda request for deleting a comment
func HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Received request: %+v", request)

	// Extract article slug and comment ID from path parameters
	articleSlug := request.PathParameters["slug"]
	commentID := request.PathParameters["id"]
	
	if articleSlug == "" {
		return utils.NewErrorResponse(http.StatusBadRequest, "slug", "Article slug is required")
	}
	if commentID == "" {
		return utils.NewErrorResponse(http.StatusBadRequest, "id", "Comment ID is required")
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

	// Get the comment to verify ownership
	comment, err := repo.GetComment(articleSlug, commentID)
	if err != nil {
		log.Printf("Failed to get comment: %v", err)
		return utils.NewErrorResponse(http.StatusNotFound, "comment", "Comment not found")
	}

	// Check if the user is the author of the comment
	if comment.AuthorUsername != username {
		log.Printf("User %s tried to delete comment by %s", username, comment.AuthorUsername)
		return utils.NewErrorResponse(http.StatusForbidden, "authorization", "You can only delete your own comments")
	}

	// Delete the comment
	if err := repo.DeleteComment(articleSlug, commentID); err != nil {
		log.Printf("Failed to delete comment: %v", err)
		return utils.NewErrorResponse(http.StatusInternalServerError, "server", "Failed to delete comment")
	}

	// Return empty response with 200 status
	return utils.NewResponse(http.StatusOK, map[string]interface{}{})
}
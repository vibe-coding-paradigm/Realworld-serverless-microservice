//go:build list_comments

package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/vibe-coding-paradigm/conduit-comments/models"
	"github.com/vibe-coding-paradigm/conduit-comments/repository"
	"github.com/vibe-coding-paradigm/conduit-comments/utils"
)

func main() {
	lambda.Start(HandleRequest)
}

// HandleRequest handles the Lambda request for listing comments
func HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Received request: %+v", request)

	// Extract article slug from path parameters
	articleSlug := request.PathParameters["slug"]
	if articleSlug == "" {
		return utils.NewErrorResponse(http.StatusBadRequest, "slug", "Article slug is required")
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

	// List comments for the article
	comments, err := repo.ListCommentsByArticle(articleSlug)
	if err != nil {
		log.Printf("Failed to list comments: %v", err)
		return utils.NewErrorResponse(http.StatusInternalServerError, "server", "Failed to retrieve comments")
	}

	// Populate author information for each comment
	for i := range comments {
		author, err := repo.GetUserByUsername(comments[i].AuthorUsername)
		if err != nil {
			log.Printf("Failed to get author info for %s: %v", comments[i].AuthorUsername, err)
			// Use basic author info if lookup fails
			author = &models.Author{
				Username:  comments[i].AuthorUsername,
				Bio:       "",
				Image:     "",
				Following: false,
			}
		}
		comments[i].Author = *author
	}

	// Return the comments
	response := models.CommentsResponse{
		Comments: comments,
	}

	return utils.NewResponse(http.StatusOK, response)
}
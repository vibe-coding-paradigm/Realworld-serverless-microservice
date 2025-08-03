package models

import (
	"time"
)

// Comment represents a comment on an article
type Comment struct {
	ID        string    `json:"id" dynamodbav:"comment_id"`
	CreatedAt time.Time `json:"createdAt" dynamodbav:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" dynamodbav:"updated_at"`
	Body      string    `json:"body" dynamodbav:"body"`
	Author    Author    `json:"author" dynamodbav:"-"`
	
	// DynamoDB specific fields
	PK             string `json:"-" dynamodbav:"PK"`             // ARTICLE#<article_slug>
	SK             string `json:"-" dynamodbav:"SK"`             // COMMENT#<comment_id>
	ArticleSlug    string `json:"-" dynamodbav:"article_slug"`
	AuthorUsername string `json:"-" dynamodbav:"author_username"`
}

// Author represents the author of a comment
type Author struct {
	Username  string `json:"username"`
	Bio       string `json:"bio"`
	Image     string `json:"image"`
	Following bool   `json:"following"`
}

// CommentResponse represents the API response format for a single comment
type CommentResponse struct {
	Comment Comment `json:"comment"`
}

// CommentsResponse represents the API response format for multiple comments
type CommentsResponse struct {
	Comments []Comment `json:"comments"`
}

// CreateCommentRequest represents the request format for creating comments
type CreateCommentRequest struct {
	Comment struct {
		Body string `json:"body"`
	} `json:"comment"`
}

// ToResponse converts Comment to the response format
func (c *Comment) ToResponse() CommentResponse {
	return CommentResponse{
		Comment: *c,
	}
}

// NewComment creates a new comment with DynamoDB keys
func NewComment(articleSlug, commentID, body, authorUsername string) *Comment {
	now := time.Now().UTC()
	return &Comment{
		ID:             commentID,
		CreatedAt:      now,
		UpdatedAt:      now,
		Body:           body,
		PK:             "ARTICLE#" + articleSlug,
		SK:             "COMMENT#" + commentID,
		ArticleSlug:    articleSlug,
		AuthorUsername: authorUsername,
	}
}
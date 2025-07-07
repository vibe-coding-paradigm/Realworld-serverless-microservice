package models

import (
	"time"
)

// Comment represents a comment on an article
type Comment struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Body      string    `json:"body"`
	Author    Author    `json:"author"`
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

// ToResponse converts Comment to the response format with author info
func (c *Comment) ToResponse(author *User) CommentResponse {
	return CommentResponse{
		Comment: Comment{
			ID:        c.ID,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
			Body:      c.Body,
			Author: Author{
				Username:  author.Username,
				Bio:       author.Bio,
				Image:     author.Image,
				Following: false, // TODO: Implement following logic
			},
		},
	}
}

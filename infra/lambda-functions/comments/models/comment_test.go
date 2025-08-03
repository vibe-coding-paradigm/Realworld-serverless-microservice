package models

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewComment(t *testing.T) {
	articleSlug := "test-article"
	commentID := "comment-123"
	body := "This is a test comment"
	authorUsername := "testuser"

	comment := NewComment(articleSlug, commentID, body, authorUsername)

	assert.Equal(t, commentID, comment.ID)
	assert.Equal(t, body, comment.Body)
	assert.Equal(t, authorUsername, comment.AuthorUsername)
	assert.Equal(t, articleSlug, comment.ArticleSlug)
	assert.Equal(t, "ARTICLE#"+articleSlug, comment.PK)
	assert.Equal(t, "COMMENT#"+commentID, comment.SK)
	
	// Check timestamps
	assert.False(t, comment.CreatedAt.IsZero())
	assert.False(t, comment.UpdatedAt.IsZero())
	assert.Equal(t, comment.CreatedAt, comment.UpdatedAt)
	
	// Should be created within the last second
	assert.WithinDuration(t, time.Now().UTC(), comment.CreatedAt, time.Second)
}

func TestComment_ToResponse(t *testing.T) {
	comment := &Comment{
		ID:        "comment-123",
		CreatedAt: time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC),
		UpdatedAt: time.Date(2025, 1, 1, 12, 30, 0, 0, time.UTC),
		Body:      "Test comment body",
		Author: Author{
			Username:  "testuser",
			Bio:       "Test bio",
			Image:     "https://example.com/avatar.jpg",
			Following: true,
		},
	}

	response := comment.ToResponse()

	assert.Equal(t, *comment, response.Comment)
	assert.Equal(t, comment.ID, response.Comment.ID)
	assert.Equal(t, comment.Body, response.Comment.Body)
	assert.Equal(t, comment.Author.Username, response.Comment.Author.Username)
}

func TestComment_JSONSerialization(t *testing.T) {
	comment := &Comment{
		ID:        "comment-123",
		CreatedAt: time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC),
		UpdatedAt: time.Date(2025, 1, 1, 12, 30, 0, 0, time.UTC),
		Body:      "Test comment body",
		Author: Author{
			Username:  "testuser",
			Bio:       "Test bio",
			Image:     "https://example.com/avatar.jpg",
			Following: false,
		},
		PK:             "ARTICLE#test-article",
		SK:             "COMMENT#comment-123",
		ArticleSlug:    "test-article",
		AuthorUsername: "testuser",
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(comment)
	require.NoError(t, err)

	// Test JSON unmarshaling
	var unmarshaled Comment
	err = json.Unmarshal(jsonData, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, comment.ID, unmarshaled.ID)
	assert.Equal(t, comment.Body, unmarshaled.Body)
	assert.Equal(t, comment.Author.Username, unmarshaled.Author.Username)
	
	// DynamoDB fields should not be in JSON (they have json:"-" tag)
	var jsonMap map[string]interface{}
	err = json.Unmarshal(jsonData, &jsonMap)
	require.NoError(t, err)
	
	assert.NotContains(t, jsonMap, "PK")
	assert.NotContains(t, jsonMap, "SK")
	assert.NotContains(t, jsonMap, "ArticleSlug")
	assert.NotContains(t, jsonMap, "AuthorUsername")
}

func TestCommentsResponse_JSONSerialization(t *testing.T) {
	comments := []Comment{
		{
			ID:   "comment-1",
			Body: "First comment",
			Author: Author{
				Username: "user1",
			},
		},
		{
			ID:   "comment-2",
			Body: "Second comment",
			Author: Author{
				Username: "user2",
			},
		},
	}

	response := CommentsResponse{
		Comments: comments,
	}

	jsonData, err := json.Marshal(response)
	require.NoError(t, err)

	var unmarshaled CommentsResponse
	err = json.Unmarshal(jsonData, &unmarshaled)
	require.NoError(t, err)

	assert.Len(t, unmarshaled.Comments, 2)
	assert.Equal(t, "comment-1", unmarshaled.Comments[0].ID)
	assert.Equal(t, "comment-2", unmarshaled.Comments[1].ID)
}

func TestCreateCommentRequest_JSONSerialization(t *testing.T) {
	jsonData := `{"comment":{"body":"Test comment body"}}`

	var request CreateCommentRequest
	err := json.Unmarshal([]byte(jsonData), &request)
	require.NoError(t, err)

	assert.Equal(t, "Test comment body", request.Comment.Body)
}

func TestCreateCommentRequest_InvalidJSON(t *testing.T) {
	invalidJSON := `{"comment":{"body":}}`

	var request CreateCommentRequest
	err := json.Unmarshal([]byte(invalidJSON), &request)
	assert.Error(t, err)
}

func TestCreateCommentRequest_MissingBody(t *testing.T) {
	jsonData := `{"comment":{}}`

	var request CreateCommentRequest
	err := json.Unmarshal([]byte(jsonData), &request)
	require.NoError(t, err)

	assert.Empty(t, request.Comment.Body)
}

func TestAuthor_Struct(t *testing.T) {
	author := Author{
		Username:  "testuser",
		Bio:       "Test bio",
		Image:     "https://example.com/avatar.jpg",
		Following: true,
	}

	jsonData, err := json.Marshal(author)
	require.NoError(t, err)

	var unmarshaled Author
	err = json.Unmarshal(jsonData, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, author, unmarshaled)
}
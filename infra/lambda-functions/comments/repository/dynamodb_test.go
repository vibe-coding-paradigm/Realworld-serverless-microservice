package repository

import (
	"encoding/json"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/vibe-coding-paradigm/conduit-comments/models"
)

// mockDynamoDBClient implements dynamodbiface.DynamoDBAPI for testing
type mockDynamoDBClient struct {
	dynamodbiface.DynamoDBAPI
	queryOutput *dynamodb.QueryOutput
	queryError  error
}

func (m *mockDynamoDBClient) Query(input *dynamodb.QueryInput) (*dynamodb.QueryOutput, error) {
	return m.queryOutput, m.queryError
}

func TestListCommentsByArticle_EmptyResult(t *testing.T) {
	// Arrange: Mock empty DynamoDB result
	mockClient := &mockDynamoDBClient{
		queryOutput: &dynamodb.QueryOutput{
			Items: []map[string]*dynamodb.AttributeValue{}, // Empty result
		},
		queryError: nil,
	}

	repo := &DynamoDBRepository{
		db:        mockClient,
		tableName: "test-table",
	}

	// Act: Call ListCommentsByArticle
	comments, err := repo.ListCommentsByArticle("test-article-slug")

	// Assert: Should return empty slice, not nil
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if comments == nil {
		t.Fatal("Expected comments to be non-nil empty slice")
	}

	if len(comments) != 0 {
		t.Fatalf("Expected empty slice, got %d comments", len(comments))
	}

	// Test JSON serialization
	jsonBytes, err := json.Marshal(models.CommentsResponse{Comments: comments})
	if err != nil {
		t.Fatalf("Failed to marshal to JSON: %v", err)
	}

	var response models.CommentsResponse
	err = json.Unmarshal(jsonBytes, &response)
	if err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	// Should deserialize as empty array, not null
	if response.Comments == nil {
		t.Fatal("JSON serialization should produce empty array [], not null")
	}

	if len(response.Comments) != 0 {
		t.Fatalf("Expected empty array after JSON round-trip, got %d items", len(response.Comments))
	}

	// Verify JSON string contains [] not null
	jsonString := string(jsonBytes)
	if !contains(jsonString, `"comments":[]`) {
		t.Fatalf("Expected JSON to contain 'comments':[], got: %s", jsonString)
	}
}

func TestListCommentsByArticle_WithComments(t *testing.T) {
	// Arrange: Mock DynamoDB result with one comment
	mockClient := &mockDynamoDBClient{
		queryOutput: &dynamodb.QueryOutput{
			Items: []map[string]*dynamodb.AttributeValue{
				{
					"PK": {
						S: aws.String("ARTICLE#test-article"),
					},
					"SK": {
						S: aws.String("COMMENT#comment-123"),
					},
					"comment_id": {
						S: aws.String("comment-123"),
					},
					"body": {
						S: aws.String("Test comment body"),
					},
					"author_username": {
						S: aws.String("testuser"),
					},
					"created_at": {
						S: aws.String("2025-08-06T00:00:00Z"),
					},
					"updated_at": {
						S: aws.String("2025-08-06T00:00:00Z"),
					},
				},
			},
		},
		queryError: nil,
	}

	repo := &DynamoDBRepository{
		db:        mockClient,
		tableName: "test-table",
	}

	// Act: Call ListCommentsByArticle
	comments, err := repo.ListCommentsByArticle("test-article")

	// Assert: Should return slice with one comment
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if comments == nil {
		t.Fatal("Expected comments to be non-nil")
	}

	if len(comments) != 1 {
		t.Fatalf("Expected 1 comment, got %d", len(comments))
	}

	comment := comments[0]
	if comment.ID != "comment-123" {
		t.Fatalf("Expected comment ID 'comment-123', got '%s'", comment.ID)
	}

	if comment.Body != "Test comment body" {
		t.Fatalf("Expected comment body 'Test comment body', got '%s'", comment.Body)
	}
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || s[0:len(substr)] == substr || contains(s[1:], substr))
}
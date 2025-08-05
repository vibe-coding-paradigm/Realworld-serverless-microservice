package repository

import (
	"encoding/json"
	"testing"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/vibe-coding-paradigm/conduit-articles/models"
)

// mockDynamoDBClient implements dynamodbiface.DynamoDBAPI for testing
type mockDynamoDBClient struct {
	dynamodbiface.DynamoDBAPI
	scanOutput  *dynamodb.ScanOutput
	queryOutput *dynamodb.QueryOutput
	scanError   error
	queryError  error
}

func (m *mockDynamoDBClient) Scan(input *dynamodb.ScanInput) (*dynamodb.ScanOutput, error) {
	return m.scanOutput, m.scanError
}

func (m *mockDynamoDBClient) Query(input *dynamodb.QueryInput) (*dynamodb.QueryOutput, error) {
	return m.queryOutput, m.queryError
}

func TestList_EmptyResult(t *testing.T) {
	// Arrange: Mock empty DynamoDB result
	mockClient := &mockDynamoDBClient{
		scanOutput: &dynamodb.ScanOutput{
			Items: []map[string]*dynamodb.AttributeValue{}, // Empty result
		},
		scanError: nil,
	}

	repo := &DynamoDBRepository{
		dynamoClient: mockClient,
		tableName:    "test-table",
	}

	filter := models.ArticleFilter{
		Limit:  20,
		Offset: 0,
	}

	// Act: Call List
	articles, totalCount, err := repo.List(filter, "")

	// Assert: Should return empty slice, not nil
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if articles == nil {
		t.Fatal("Expected articles to be non-nil empty slice")
	}

	if len(articles) != 0 {
		t.Fatalf("Expected empty slice, got %d articles", len(articles))
	}

	if totalCount != 0 {
		t.Fatalf("Expected totalCount to be 0, got %d", totalCount)
	}

	// Test JSON serialization
	response := models.ArticlesResponse{
		Articles:      articles,
		ArticlesCount: totalCount,
	}

	jsonBytes, err := json.Marshal(response)
	if err != nil {
		t.Fatalf("Failed to marshal to JSON: %v", err)
	}

	var jsonResponse models.ArticlesResponse
	err = json.Unmarshal(jsonBytes, &jsonResponse)
	if err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	// Should deserialize as empty array, not null
	if jsonResponse.Articles == nil {
		t.Fatal("JSON serialization should produce empty array [], not null")
	}

	if len(jsonResponse.Articles) != 0 {
		t.Fatalf("Expected empty array after JSON round-trip, got %d items", len(jsonResponse.Articles))
	}

	if jsonResponse.ArticlesCount != 0 {
		t.Fatalf("Expected articlesCount to be 0, got %d", jsonResponse.ArticlesCount)
	}

	// Verify JSON string contains [] not null
	jsonString := string(jsonBytes)
	if !contains(jsonString, `"articles":[]`) {
		t.Fatalf("Expected JSON to contain 'articles':[], got: %s", jsonString)
	}
}

func TestList_WithArticles(t *testing.T) {
	// Arrange: Mock DynamoDB result with one article
	mockClient := &mockDynamoDBClient{
		scanOutput: &dynamodb.ScanOutput{
			Items: []map[string]*dynamodb.AttributeValue{
				{
					"PK": {
						S: &[]string{"ARTICLE#test-slug"}[0],
					},
					"SK": {
						S: &[]string{"METADATA"}[0],
					},
					"article_id": {
						S: &[]string{"article-123"}[0],
					},
					"slug": {
						S: &[]string{"test-article"}[0],
					},
					"title": {
						S: &[]string{"Test Article"}[0],
					},
					"description": {
						S: &[]string{"Test description"}[0],
					},
					"body": {
						S: &[]string{"Test body"}[0],
					},
					"author_id": {
						S: &[]string{"user-123"}[0],
					},
					"author_username": {
						S: &[]string{"testuser"}[0],
					},
					"created_at": {
						S: &[]string{"2025-08-06T00:00:00Z"}[0],
					},
					"updated_at": {
						S: &[]string{"2025-08-06T00:00:00Z"}[0],
					},
					"favorites_count": {
						N: &[]string{"0"}[0],
					},
				},
			},
		},
		scanError: nil,
	}

	repo := &DynamoDBRepository{
		dynamoClient: mockClient,
		tableName:    "test-table",
	}

	filter := models.ArticleFilter{
		Limit:  20,
		Offset: 0,
	}

	// Act: Call List
	articles, totalCount, err := repo.List(filter, "")

	// Assert: Should return slice with one article
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if articles == nil {
		t.Fatal("Expected articles to be non-nil")
	}

	if len(articles) != 1 {
		t.Fatalf("Expected 1 article, got %d", len(articles))
	}

	if totalCount != 1 {
		t.Fatalf("Expected totalCount to be 1, got %d", totalCount)
	}

	article := articles[0]
	if article.ArticleID != "article-123" {
		t.Fatalf("Expected article ID 'article-123', got '%s'", article.ArticleID)
	}

	if article.Title != "Test Article" {
		t.Fatalf("Expected article title 'Test Article', got '%s'", article.Title)
	}
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || s[0:len(substr)] == substr || contains(s[1:], substr))
}
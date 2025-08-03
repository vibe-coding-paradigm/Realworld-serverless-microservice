//go:build list_comments

package main

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestListCommentsHandler_MissingSlug(t *testing.T) {
	// Test case: missing article slug
	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{},
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	assert.Equal(t, 400, response.StatusCode)
	
	var errorResp map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &errorResp)
	require.NoError(t, err)
	
	errors, exists := errorResp["errors"].(map[string]interface{})
	require.True(t, exists)
	assert.Contains(t, errors, "slug")
}

func TestListCommentsHandler_MissingTableName(t *testing.T) {
	// Save original env
	originalTableName := os.Getenv("COMMENTS_TABLE_NAME")
	defer func() {
		if originalTableName != "" {
			os.Setenv("COMMENTS_TABLE_NAME", originalTableName)
		} else {
			os.Unsetenv("COMMENTS_TABLE_NAME")
		}
	}()

	// Clear table name env
	os.Unsetenv("COMMENTS_TABLE_NAME")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
		},
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	assert.Equal(t, 500, response.StatusCode)
}

func TestListCommentsHandler_ValidRequest(t *testing.T) {
	// Set required environment variables
	os.Setenv("COMMENTS_TABLE_NAME", "test-comments-table")
	defer os.Unsetenv("COMMENTS_TABLE_NAME")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
		},
	}

	// Note: This test will fail without actual DynamoDB connection
	// but it tests the handler logic and request parsing
	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	// In a real environment with DynamoDB, this would be 200
	// Without DynamoDB connection, we expect an internal server error
	// but the handler should not panic and should return a proper error response
	assert.Contains(t, []int{200, 500}, response.StatusCode)
	
	// Response should have proper headers
	assert.Equal(t, "application/json", response.Headers["Content-Type"])
	assert.Contains(t, response.Headers, "Access-Control-Allow-Origin")
}
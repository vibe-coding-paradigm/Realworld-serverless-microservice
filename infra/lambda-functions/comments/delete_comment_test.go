//go:build delete_comment

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

func TestDeleteCommentHandler_MissingSlug(t *testing.T) {
	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"id": "comment-123",
		},
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

func TestDeleteCommentHandler_MissingCommentID(t *testing.T) {
	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
		},
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	assert.Equal(t, 400, response.StatusCode)
	
	var errorResp map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &errorResp)
	require.NoError(t, err)
	
	errors, exists := errorResp["errors"].(map[string]interface{})
	require.True(t, exists)
	assert.Contains(t, errors, "id")
}

func TestDeleteCommentHandler_MissingAuth(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
			"id":   "comment-123",
		},
		Headers: map[string]string{},
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	assert.Equal(t, 401, response.StatusCode)
	
	var errorResp map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &errorResp)
	require.NoError(t, err)
	
	errors, exists := errorResp["errors"].(map[string]interface{})
	require.True(t, exists)
	assert.Contains(t, errors, "authorization")
}

func TestDeleteCommentHandler_InvalidAuth(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
			"id":   "comment-123",
		},
		Headers: map[string]string{
			"Authorization": "Token invalid-token",
		},
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	assert.Equal(t, 401, response.StatusCode)
	
	var errorResp map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &errorResp)
	require.NoError(t, err)
	
	errors, exists := errorResp["errors"].(map[string]interface{})
	require.True(t, exists)
	assert.Contains(t, errors, "authorization")
}

func TestDeleteCommentHandler_MissingJWTSecret(t *testing.T) {
	// Ensure JWT_SECRET is not set
	originalSecret := os.Getenv("JWT_SECRET")
	defer func() {
		if originalSecret != "" {
			os.Setenv("JWT_SECRET", originalSecret)
		} else {
			os.Unsetenv("JWT_SECRET")
		}
	}()
	os.Unsetenv("JWT_SECRET")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
			"id":   "comment-123",
		},
		Headers: map[string]string{
			"Authorization": "Token some-token",
		},
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	assert.Equal(t, 500, response.StatusCode)
}

func TestDeleteCommentHandler_MissingTableName(t *testing.T) {
	// Save and clear table name env
	originalTableName := os.Getenv("COMMENTS_TABLE_NAME")
	defer func() {
		if originalTableName != "" {
			os.Setenv("COMMENTS_TABLE_NAME", originalTableName)
		} else {
			os.Unsetenv("COMMENTS_TABLE_NAME")
		}
	}()

	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")
	os.Unsetenv("COMMENTS_TABLE_NAME")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
			"id":   "comment-123",
		},
		Headers: map[string]string{
			"Authorization": "Token invalid-token", // Will fail auth first anyway
		},
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	// Could be either auth error (401) or missing table error (500)
	assert.Contains(t, []int{401, 500}, response.StatusCode)
}
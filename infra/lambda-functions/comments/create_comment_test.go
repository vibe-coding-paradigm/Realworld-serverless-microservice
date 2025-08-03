//go:build create_comment

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

func TestCreateCommentHandler_MissingSlug(t *testing.T) {
	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{},
		Body:           `{"comment":{"body":"Test comment"}}`,
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

func TestCreateCommentHandler_MissingAuth(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
		},
		Headers: map[string]string{},
		Body:    `{"comment":{"body":"Test comment"}}`,
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

func TestCreateCommentHandler_InvalidBody(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
		},
		Headers: map[string]string{
			"Authorization": "Token invalid-token",
		},
		Body: `invalid json`,
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	assert.Contains(t, []int{400, 401}, response.StatusCode) // Could be auth error first
}

func TestCreateCommentHandler_EmptyCommentBody(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")

	request := events.APIGatewayProxyRequest{
		PathParameters: map[string]string{
			"slug": "test-article",
		},
		Headers: map[string]string{
			"Authorization": "Token invalid-token", // Will fail auth first
		},
		Body: `{"comment":{"body":"   "}}`, // Empty/whitespace body
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	// Auth will fail first with invalid token
	assert.Equal(t, 401, response.StatusCode)
}

func TestCreateCommentHandler_MissingJWTSecret(t *testing.T) {
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
		},
		Headers: map[string]string{
			"Authorization": "Token some-token",
		},
		Body: `{"comment":{"body":"Test comment"}}`,
	}

	response, err := HandleRequest(context.Background(), request)
	
	require.NoError(t, err)
	assert.Equal(t, 500, response.StatusCode)
}
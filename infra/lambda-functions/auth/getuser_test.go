package main

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetUserHandler_ValidToken(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Path:       "/auth/user",
		Headers: map[string]string{
			"Authorization": "Bearer valid-jwt-token",
			"Content-Type":  "application/json",
		},
	}
	
	// Act
	response, err := HandleGetUser(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	user, ok := responseBody["user"].(map[string]interface{})
	require.True(t, ok, "Response should contain user object")
	
	assert.NotEmpty(t, user["email"])
	assert.NotEmpty(t, user["username"])
	assert.NotEmpty(t, user["token"])
}

func TestGetUserHandler_MissingAuthorizationHeader(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Path:       "/auth/user",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		// Missing Authorization header
	}
	
	// Act
	response, err := HandleGetUser(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 401, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	tokenErrors, ok := errors["token"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, tokenErrors[0], "Authorization header required")
}

func TestGetUserHandler_InvalidTokenFormat(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Path:       "/auth/user",
		Headers: map[string]string{
			"Authorization": "invalid-token-format", // No "Bearer " prefix
			"Content-Type":  "application/json",
		},
	}
	
	// Act
	response, err := HandleGetUser(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 401, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	tokenErrors, ok := errors["token"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, tokenErrors[0], "Invalid token format")
}

func TestGetUserHandler_InvalidToken(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Path:       "/auth/user",
		Headers: map[string]string{
			"Authorization": "Bearer invalid.jwt.token",
			"Content-Type":  "application/json",
		},
	}
	
	// Act
	response, err := HandleGetUser(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 401, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	tokenErrors, ok := errors["token"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, tokenErrors[0], "Invalid token")
}

func TestGetUserHandler_MethodNotAllowed(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST", // Wrong method
		Headers: map[string]string{
			"Authorization": "Bearer valid-jwt-token",
		},
	}
	
	// Act
	response, err := HandleGetUser(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 405, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	methodErrors, ok := errors["method"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, methodErrors[0], "Method not allowed")
}

func TestGetUserHandler_OptionsMethod(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "OPTIONS",
	}
	
	// Act
	response, err := HandleGetUser(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
	
	// Check CORS headers
	assert.Contains(t, response.Headers, "Access-Control-Allow-Origin")
	assert.Equal(t, "*", response.Headers["Access-Control-Allow-Origin"])
}
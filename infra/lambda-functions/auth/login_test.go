package main

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/models"
)

func TestLoginHandler_ValidCredentials(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	loginReq := models.LoginRequest{
		User: struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: "password123",
		},
	}
	
	reqBody, err := json.Marshal(loginReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Path:       "/auth/login",
		Body:       string(reqBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
	
	// Act
	response, err := HandleLogin(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	user, ok := responseBody["user"].(map[string]interface{})
	require.True(t, ok, "Response should contain user object")
	
	assert.Equal(t, "test@example.com", user["email"])
	assert.NotEmpty(t, user["token"])
	assert.NotEmpty(t, user["username"])
}

func TestLoginHandler_MissingEmail(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	loginReq := models.LoginRequest{
		User: struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "", // Missing email
			Password: "password123",
		},
	}
	
	reqBody, err := json.Marshal(loginReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       string(reqBody),
	}
	
	// Act
	response, err := HandleLogin(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 422, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	emailErrors, ok := errors["email"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, emailErrors[0], "required")
}

func TestLoginHandler_MissingPassword(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	loginReq := models.LoginRequest{
		User: struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: "", // Missing password
		},
	}
	
	reqBody, err := json.Marshal(loginReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       string(reqBody),
	}
	
	// Act
	response, err := HandleLogin(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 422, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	passwordErrors, ok := errors["password"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, passwordErrors[0], "required")
}

func TestLoginHandler_InvalidCredentials(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	loginReq := models.LoginRequest{
		User: struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "nonexistent@example.com", // Non-existent user
			Password: "wrongpassword",
		},
	}
	
	reqBody, err := json.Marshal(loginReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       string(reqBody),
	}
	
	// Act
	response, err := HandleLogin(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 401, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	emailErrors, ok := errors["email"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, emailErrors[0], "Invalid email or password")
}

func TestLoginHandler_InvalidJSON(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       "invalid json",
	}
	
	// Act
	response, err := HandleLogin(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 400, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	bodyErrors, ok := errors["body"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, bodyErrors[0], "Invalid JSON")
}

func TestLoginHandler_MethodNotAllowed(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET", // Wrong method
		Body:       `{"user": {"email": "test@example.com", "password": "password123"}}`,
	}
	
	// Act
	response, err := HandleLogin(context.Background(), request)
	
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

func TestLoginHandler_OptionsMethod(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "OPTIONS",
	}
	
	// Act
	response, err := HandleLogin(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
	
	// Check CORS headers
	assert.Contains(t, response.Headers, "Access-Control-Allow-Origin")
	assert.Equal(t, "*", response.Headers["Access-Control-Allow-Origin"])
}
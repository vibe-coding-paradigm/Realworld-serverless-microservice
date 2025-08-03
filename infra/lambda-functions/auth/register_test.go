package main

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/models"
)

func TestMain(m *testing.M) {
	// Set up test environment
	os.Setenv("JWT_SECRET", "test-jwt-secret-key-for-unit-tests")
	os.Setenv("USERS_TABLE_NAME", "test-conduit-users")
	
	// Run tests
	code := m.Run()
	
	// Clean up
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("USERS_TABLE_NAME")
	
	os.Exit(code)
}

func TestRegisterHandler_ValidRequest(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	registerReq := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "password123",
		},
	}
	
	reqBody, err := json.Marshal(registerReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Path:       "/auth/register",
		Body:       string(reqBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
	
	// Act
	response, err := HandleRegister(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 201, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	user, ok := responseBody["user"].(map[string]interface{})
	require.True(t, ok, "Response should contain user object")
	
	assert.Equal(t, "test@example.com", user["email"])
	assert.Equal(t, "testuser", user["username"])
	assert.NotEmpty(t, user["token"])
	assert.Equal(t, "", user["bio"])
	assert.Equal(t, "", user["image"])
}

func TestRegisterHandler_MissingEmail(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	registerReq := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "testuser",
			Email:    "", // Missing email
			Password: "password123",
		},
	}
	
	reqBody, err := json.Marshal(registerReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       string(reqBody),
	}
	
	// Act
	response, err := HandleRegister(context.Background(), request)
	
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

func TestRegisterHandler_MissingUsername(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	registerReq := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "", // Missing username
			Email:    "test@example.com",
			Password: "password123",
		},
	}
	
	reqBody, err := json.Marshal(registerReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       string(reqBody),
	}
	
	// Act
	response, err := HandleRegister(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 422, response.StatusCode)
	
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	errors, ok := responseBody["errors"].(map[string]interface{})
	require.True(t, ok)
	
	usernameErrors, ok := errors["username"].([]interface{})
	require.True(t, ok)
	assert.Contains(t, usernameErrors[0], "required")
}

func TestRegisterHandler_MissingPassword(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	registerReq := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "", // Missing password
		},
	}
	
	reqBody, err := json.Marshal(registerReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       string(reqBody),
	}
	
	// Act
	response, err := HandleRegister(context.Background(), request)
	
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

func TestRegisterHandler_InvalidEmail(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	registerReq := models.RegisterRequest{
		User: struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Username: "testuser",
			Email:    "invalid-email", // Invalid email format
			Password: "password123",
		},
	}
	
	reqBody, err := json.Marshal(registerReq)
	require.NoError(t, err)
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       string(reqBody),
	}
	
	// Act
	response, err := HandleRegister(context.Background(), request)
	
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
	assert.Contains(t, emailErrors[0], "Invalid email format")
}

func TestRegisterHandler_InvalidJSON(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Body:       "invalid json",
	}
	
	// Act
	response, err := HandleRegister(context.Background(), request)
	
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

func TestRegisterHandler_MethodNotAllowed(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET", // Wrong method
		Body:       `{"user": {"email": "test@example.com", "username": "testuser", "password": "password123"}}`,
	}
	
	// Act
	response, err := HandleRegister(context.Background(), request)
	
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

func TestRegisterHandler_OptionsMethod(t *testing.T) {
	// TDD Red: This test should fail initially
	
	// Arrange
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "OPTIONS",
	}
	
	// Act
	response, err := HandleRegister(context.Background(), request)
	
	// Assert
	require.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
	
	// Check CORS headers
	assert.Contains(t, response.Headers, "Access-Control-Allow-Origin")
	assert.Equal(t, "*", response.Headers["Access-Control-Allow-Origin"])
}
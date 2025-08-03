package main

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/stretchr/testify/assert"
	"github.com/vibe-coding-paradigm/realworld-serverless-articles/models"
)

func TestListArticlesHandler_ValidRequest(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("ARTICLES_TABLE_NAME", "test-articles-table")
	os.Setenv("JWT_SECRET", "test-secret")

	// Create a valid request
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Path:       "/articles",
		QueryStringParameters: map[string]string{
			"limit":  "20",
			"offset": "0",
		},
	}

	// Call the handler
	response, err := ListArticlesHandler(context.Background(), request)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
	
	// Parse response body
	var articlesResponse models.ArticlesResponse
	err = json.Unmarshal([]byte(response.Body), &articlesResponse)
	assert.NoError(t, err)
	
	// Should have articles array and count
	assert.NotNil(t, articlesResponse.Articles)
	assert.GreaterOrEqual(t, articlesResponse.ArticlesCount, 0)
}

func TestListArticlesHandler_WithFilters(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("ARTICLES_TABLE_NAME", "test-articles-table")
	os.Setenv("JWT_SECRET", "test-secret")

	// Create a request with filters
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Path:       "/articles",
		QueryStringParameters: map[string]string{
			"tag":    "react",
			"author": "testuser",
			"limit":  "10",
			"offset": "0",
		},
	}

	// Call the handler
	response, err := ListArticlesHandler(context.Background(), request)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
	
	// Parse response body
	var articlesResponse models.ArticlesResponse
	err = json.Unmarshal([]byte(response.Body), &articlesResponse)
	assert.NoError(t, err)
	
	// Should have articles array and count
	assert.NotNil(t, articlesResponse.Articles)
	assert.GreaterOrEqual(t, articlesResponse.ArticlesCount, 0)
}

func TestListArticlesHandler_WithAuthentication(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("ARTICLES_TABLE_NAME", "test-articles-table")
	os.Setenv("JWT_SECRET", "test-secret")

	// Create a request with authentication
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Path:       "/articles",
		Headers: map[string]string{
			"Authorization": "Token valid-jwt-token",
		},
		QueryStringParameters: map[string]string{
			"limit":  "20",
			"offset": "0",
		},
	}

	// Call the handler
	response, err := ListArticlesHandler(context.Background(), request)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
}

func TestListArticlesHandler_InvalidPagination(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("ARTICLES_TABLE_NAME", "test-articles-table")
	os.Setenv("JWT_SECRET", "test-secret")

	// Create a request with invalid pagination
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Path:       "/articles",
		QueryStringParameters: map[string]string{
			"limit":  "invalid",
			"offset": "invalid",
		},
	}

	// Call the handler
	response, err := ListArticlesHandler(context.Background(), request)

	// Should still work with default values
	assert.NoError(t, err) 
	assert.Equal(t, 200, response.StatusCode)
}

func TestListArticlesHandler_MethodNotAllowed(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("ARTICLES_TABLE_NAME", "test-articles-table")
	os.Setenv("JWT_SECRET", "test-secret")

	// Create a request with wrong HTTP method
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Path:       "/articles",
	}

	// Call the handler
	response, err := ListArticlesHandler(context.Background(), request)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 405, response.StatusCode)
}

func TestListArticlesHandler_OptionsMethod(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("ARTICLES_TABLE_NAME", "test-articles-table")
	os.Setenv("JWT_SECRET", "test-secret")

	// Create a request with OPTIONS method (CORS preflight)
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "OPTIONS",
		Path:       "/articles",
	}

	// Call the handler
	response, err := ListArticlesHandler(context.Background(), request)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, response.StatusCode)
}
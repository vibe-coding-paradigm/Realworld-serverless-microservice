package utils

import (
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

// APIResponse represents a standard API response
type APIResponse struct {
	StatusCode int               `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

// ErrorResponseBody represents an error response body
type ErrorResponseBody struct {
	Errors map[string][]string `json:"errors"`
}

// SuccessResponse creates a successful API Gateway response
func SuccessResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	headers := map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
	}

	body, err := json.Marshal(data)
	if err != nil {
		return ErrorResponse(500, "server", "Failed to marshal response")
	}

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    headers,
		Body:       string(body),
	}
}

// ErrorResponse creates an error API Gateway response
func ErrorResponse(statusCode int, field, message string) events.APIGatewayProxyResponse {
	headers := map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
	}

	errorResp := ErrorResponseBody{
		Errors: map[string][]string{
			field: {message},
		},
	}

	body, err := json.Marshal(errorResp)
	if err != nil {
		// Fallback error response
		body = []byte(fmt.Sprintf(`{"errors": {"server": ["Internal server error"]}}`))
	}

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    headers,
		Body:       string(body),
	}
}
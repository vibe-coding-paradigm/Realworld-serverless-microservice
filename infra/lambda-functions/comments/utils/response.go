package utils

import (
	"encoding/json"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
)

// APIResponse represents a standard API response
type APIResponse struct {
	StatusCode int               `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Errors map[string][]string `json:"errors"`
}

// NewResponse creates a new API Gateway proxy response
func NewResponse(statusCode int, body interface{}) (events.APIGatewayProxyResponse, error) {
	headers := map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return events.APIGatewayProxyResponse{}, err
	}

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    headers,
		Body:       string(bodyBytes),
	}, nil
}

// NewErrorResponse creates a new error response
func NewErrorResponse(statusCode int, field, message string) (events.APIGatewayProxyResponse, error) {
	errorResp := ErrorResponse{
		Errors: map[string][]string{
			field: {message},
		},
	}
	return NewResponse(statusCode, errorResp)
}

// NewValidationErrorResponse creates a validation error response
func NewValidationErrorResponse(errors map[string][]string) (events.APIGatewayProxyResponse, error) {
	errorResp := ErrorResponse{
		Errors: errors,
	}
	return NewResponse(http.StatusUnprocessableEntity, errorResp)
}
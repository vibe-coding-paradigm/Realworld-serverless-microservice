package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

// ErrorResponseBody represents an error response body
type ErrorResponseBody struct {
	Errors map[string][]string `json:"errors"`
}

// SuccessResponse creates a successful API Gateway response
func SuccessResponse(statusCode int, body interface{}) (events.APIGatewayProxyResponse, error) {
	bodyJSON, err := json.Marshal(body)
	if err != nil {
		log.Printf("Error marshalling response body: %v", err)
		return ErrorResponse(500, "Internal server error", "Failed to process response")
	}

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
		},
		Body: string(bodyJSON),
	}, nil
}

// ErrorResponse creates an error API Gateway response
func ErrorResponse(statusCode int, field string, message string) (events.APIGatewayProxyResponse, error) {
	errorBody := ErrorResponseBody{
		Errors: map[string][]string{
			field: {message},
		},
	}

	bodyJSON, err := json.Marshal(errorBody)
	if err != nil {
		log.Printf("Error marshalling error response: %v", err)
		bodyJSON = []byte(`{"errors":{"server":["Internal server error"]}}`)
	}

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
		},
		Body: string(bodyJSON),
	}, nil
}

// ValidateRequired checks if required fields are present
func ValidateRequired(fieldName, value string) error {
	if strings.TrimSpace(value) == "" {
		return fmt.Errorf("%s is required", fieldName)
	}
	return nil
}
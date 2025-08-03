package utils

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewResponse_Success(t *testing.T) {
	testData := map[string]interface{}{
		"message": "success",
		"data":    []string{"item1", "item2"},
	}

	response, err := NewResponse(http.StatusOK, testData)
	
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, response.StatusCode)
	
	// Check headers
	assert.Equal(t, "application/json", response.Headers["Content-Type"])
	assert.Equal(t, "*", response.Headers["Access-Control-Allow-Origin"])
	assert.Contains(t, response.Headers, "Access-Control-Allow-Methods")
	assert.Contains(t, response.Headers, "Access-Control-Allow-Headers")
	
	// Check body
	var responseBody map[string]interface{}
	err = json.Unmarshal([]byte(response.Body), &responseBody)
	require.NoError(t, err)
	
	assert.Equal(t, "success", responseBody["message"])
	assert.Contains(t, responseBody, "data")
}

func TestNewResponse_EmptyBody(t *testing.T) {
	response, err := NewResponse(http.StatusNoContent, nil)
	
	require.NoError(t, err)
	assert.Equal(t, http.StatusNoContent, response.StatusCode)
	assert.Equal(t, "null", response.Body)
}

func TestNewResponse_InvalidJSON(t *testing.T) {
	// Create a value that cannot be marshaled to JSON
	invalidData := map[string]interface{}{
		"invalid": make(chan int), // channels cannot be marshaled to JSON
	}

	response, err := NewResponse(http.StatusOK, invalidData)
	
	assert.Error(t, err)
	assert.Empty(t, response.Body)
}

func TestNewErrorResponse(t *testing.T) {
	response, err := NewErrorResponse(http.StatusBadRequest, "username", "Username is required")
	
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, response.StatusCode)
	
	var errorResp ErrorResponse
	err = json.Unmarshal([]byte(response.Body), &errorResp)
	require.NoError(t, err)
	
	assert.Contains(t, errorResp.Errors, "username")
	assert.Equal(t, []string{"Username is required"}, errorResp.Errors["username"])
}

func TestNewValidationErrorResponse(t *testing.T) {
	errors := map[string][]string{
		"username": {"Username is required", "Username must be at least 3 characters"},
		"email":    {"Email is required"},
		"password": {"Password is required", "Password must be at least 8 characters"},
	}

	response, err := NewValidationErrorResponse(errors)
	
	require.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, response.StatusCode)
	
	var errorResp ErrorResponse
	err = json.Unmarshal([]byte(response.Body), &errorResp)
	require.NoError(t, err)
	
	assert.Equal(t, errors, errorResp.Errors)
	assert.Len(t, errorResp.Errors["username"], 2)
	assert.Len(t, errorResp.Errors["email"], 1)
	assert.Len(t, errorResp.Errors["password"], 2)
}

func TestErrorResponse_Structure(t *testing.T) {
	errors := map[string][]string{
		"field1": {"Error message 1"},
		"field2": {"Error message 2", "Error message 3"},
	}

	errorResp := ErrorResponse{
		Errors: errors,
	}

	jsonData, err := json.Marshal(errorResp)
	require.NoError(t, err)

	var unmarshaled map[string]interface{}
	err = json.Unmarshal(jsonData, &unmarshaled)
	require.NoError(t, err)

	assert.Contains(t, unmarshaled, "errors")
	
	errorsMap := unmarshaled["errors"].(map[string]interface{})
	assert.Contains(t, errorsMap, "field1")
	assert.Contains(t, errorsMap, "field2")
}

func TestNewResponse_DifferentStatusCodes(t *testing.T) {
	testCases := []struct {
		statusCode int
		name       string
	}{
		{http.StatusOK, "OK"},
		{http.StatusCreated, "Created"},
		{http.StatusBadRequest, "Bad Request"},
		{http.StatusUnauthorized, "Unauthorized"},
		{http.StatusForbidden, "Forbidden"},
		{http.StatusNotFound, "Not Found"},
		{http.StatusInternalServerError, "Internal Server Error"},
	}

	testData := map[string]string{"test": "data"}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			response, err := NewResponse(tc.statusCode, testData)
			
			require.NoError(t, err)
			assert.Equal(t, tc.statusCode, response.StatusCode)
			
			var responseBody map[string]interface{}
			err = json.Unmarshal([]byte(response.Body), &responseBody)
			require.NoError(t, err)
			assert.Equal(t, "data", responseBody["test"])
		})
	}
}
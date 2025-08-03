package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/db"
)

func TestHealthCheckHandler(t *testing.T) {
	tests := []struct {
		name           string
		setupDatabase  bool
		expectedStatus int
		expectedFields []string
	}{
		{
			name:           "health check with database",
			setupDatabase:  true,
			expectedStatus: http.StatusOK,
			expectedFields: []string{"status", "service", "version", "database"},
		},
		{
			name:           "health check without database",
			setupDatabase:  false,
			expectedStatus: http.StatusServiceUnavailable,
			expectedFields: []string{"status", "service", "version", "database"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			if tt.setupDatabase {
				// Use in-memory database for testing
				originalDBPath := os.Getenv("DATABASE_URL")
				os.Setenv("DATABASE_URL", ":memory:")
				defer os.Setenv("DATABASE_URL", originalDBPath)
				
				var err error
				database, err = db.NewConnection()
				if err != nil {
					t.Fatalf("Failed to setup test database: %v", err)
				}
				defer func() {
					if database != nil {
						database.Close()
					}
				}()
			} else {
				database = nil
			}

			// Create request
			req, err := http.NewRequest("GET", "/health", nil)
			if err != nil {
				t.Fatal(err)
			}

			// Create response recorder
			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(healthCheckHandler)

			// Execute request
			handler.ServeHTTP(rr, req)

			// Check status code
			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v", status, tt.expectedStatus)
			}

			// Check Content-Type
			expectedContentType := "application/json"
			if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
				t.Errorf("handler returned wrong content type: got %v want %v", contentType, expectedContentType)
			}

			// Parse response
			var response map[string]interface{}
			if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
				t.Fatalf("Failed to parse response JSON: %v", err)
			}

			// Check expected fields
			for _, field := range tt.expectedFields {
				if _, exists := response[field]; !exists {
					t.Errorf("Expected field %s not found in response", field)
				}
			}

			// Check service field
			if service, ok := response["service"].(string); !ok || service != "conduit-api" {
				t.Errorf("Expected service to be 'conduit-api', got %v", response["service"])
			}

			// Check version field
			if version, ok := response["version"].(string); !ok || version != "1.0.0" {
				t.Errorf("Expected version to be '1.0.0', got %v", response["version"])
			}
		})
	}
}

func TestHealthCheckHandlerDatabaseConnected(t *testing.T) {
	// Use in-memory database for testing
	originalDBPath := os.Getenv("DATABASE_URL")
	os.Setenv("DATABASE_URL", ":memory:")
	defer os.Setenv("DATABASE_URL", originalDBPath)
	
	// Setup database
	var err error
	database, err = db.NewConnection()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}
	defer func() {
		if database != nil {
			database.Close()
		}
	}()

	req, err := http.NewRequest("GET", "/health", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(healthCheckHandler)

	handler.ServeHTTP(rr, req)

	// Should return 200 OK
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response JSON: %v", err)
	}

	// Check status is ok
	if status, ok := response["status"].(string); !ok || status != "ok" {
		t.Errorf("Expected status to be 'ok', got %v", response["status"])
	}

	// Check database is connected
	if dbStatus, ok := response["database"].(string); !ok || dbStatus != "connected" {
		t.Errorf("Expected database status to be 'connected', got %v", response["database"])
	}
}
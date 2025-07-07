package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/db"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/handlers"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize database connection
	database, err := db.NewConnection()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Initialize repositories
	userRepo := db.NewUserRepository(database.DB)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userRepo)

	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/health", healthCheckHandler)

	// User API routes
	mux.HandleFunc("/api/users", userHandler.Register)
	mux.HandleFunc("/api/users/login", userHandler.Login)
	mux.HandleFunc("/api/user", handlers.AuthMiddleware(userHandler.GetCurrentUser))

	// Default API route
	mux.HandleFunc("/api/", apiHandler)

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handlers.CORSMiddleware(mux)))
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "ok", "service": "conduit-api"}`))
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	// Handle different endpoints based on the path
	path := strings.TrimPrefix(r.URL.Path, "/api")

	switch {
	case path == "/" || path == "":
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "Conduit API - RealWorld implementation"}`))
	default:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"errors": {"path": ["Endpoint not found"]}}`))
	}
}

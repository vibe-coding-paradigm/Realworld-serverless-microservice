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
	articleRepo := db.NewArticleRepository(database.DB)
	commentRepo := db.NewCommentRepository(database.DB)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userRepo)
	articleHandler := handlers.NewArticleHandler(articleRepo, userRepo)
	commentHandler := handlers.NewCommentHandler(commentRepo, userRepo)

	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/health", healthCheckHandler)

	// User API routes
	mux.HandleFunc("/api/users", userHandler.Register)
	mux.HandleFunc("/api/users/login", userHandler.Login)
	mux.HandleFunc("/api/user", handlers.AuthMiddleware(userHandler.GetCurrentUser))

	// Article API routes
	mux.HandleFunc("/api/articles", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			articleHandler.GetArticles(w, r)
		} else if r.Method == http.MethodPost {
			handlers.AuthMiddleware(articleHandler.CreateArticle)(w, r)
		} else {
			handlers.WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
		}
	})

	// Article CRUD routes
	mux.HandleFunc("/api/articles/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/articles/")
		parts := strings.Split(path, "/")

		if len(parts) == 1 && parts[0] != "" {
			// /api/articles/{slug}
			if r.Method == http.MethodGet {
				articleHandler.GetArticle(w, r)
			} else if r.Method == http.MethodPut {
				handlers.AuthMiddleware(articleHandler.UpdateArticle)(w, r)
			} else if r.Method == http.MethodDelete {
				handlers.AuthMiddleware(articleHandler.DeleteArticle)(w, r)
			} else {
				handlers.WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
			}
		} else if len(parts) == 2 && parts[1] == "comments" {
			// /api/articles/{slug}/comments
			if r.Method == http.MethodGet {
				commentHandler.GetComments(w, r)
			} else if r.Method == http.MethodPost {
				handlers.AuthMiddleware(commentHandler.CreateComment)(w, r)
			} else {
				handlers.WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
			}
		} else if len(parts) == 3 && parts[1] == "comments" {
			// /api/articles/{slug}/comments/{id}
			if r.Method == http.MethodDelete {
				handlers.AuthMiddleware(commentHandler.DeleteComment)(w, r)
			} else {
				handlers.WriteErrorResponse(w, http.StatusMethodNotAllowed, "method", "Method not allowed")
			}
		} else {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "path", "Endpoint not found")
		}
	})

	// Default API route
	mux.HandleFunc("/api/", apiHandler)

	fmt.Printf("🚀 RealWorld Conduit API server starting on port %s - Final Verification Test\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handlers.CORSMiddleware(mux)))
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte(`{"status": "ok", "service": "conduit-api", "version": "1.0.0"}`)); err != nil {
		log.Printf("Failed to write health check response: %v", err)
	}
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	// Handle different endpoints based on the path
	path := strings.TrimPrefix(r.URL.Path, "/api")

	switch {
	case path == "/" || path == "":
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write([]byte(`{"message": "Conduit API - RealWorld implementation"}`)); err != nil {
			log.Printf("Failed to write API response: %v", err)
		}
	default:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		if _, err := w.Write([]byte(`{"errors": {"path": ["Endpoint not found"]}}`)); err != nil {
			log.Printf("Failed to write error response: %v", err)
		}
	}
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **RealWorld application implementation** using **Vibe Coding methodology** and **Armin Ronacher's recommended tech stack**. The goal is to build a Medium.com clone (social blogging platform) that demonstrates rapid MVP development with pragmatic technology choices.

### Key Principles
- **Vibe Coding**: Intuitive, fast development prioritizing working code over perfect design
- **Armin Ronacher Philosophy**: Simplicity first, standard libraries, practical approach
- **RealWorld Standard**: Following established API specifications for consistency

## Architecture

### Backend (Go)
- **Framework**: Standard `net/http` library with custom middleware (no frameworks like Gin/Echo)
- **Database**: SQLite with raw SQL queries (no ORM)
- **Authentication**: JWT token-based stateless authentication
- **Structure**: Clean Architecture pattern with `cmd/` and `internal/` directories

### Frontend (React + TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router
- **State Management**: Context API for auth + React Query for server state
- **Architecture**: Component-based with feature folders

### Database Schema
Core entities: `users`, `articles`, `comments`, `follows`, `favorites`, `tags`
- Designed for SQLite constraints
- Focus on simplicity over complex relationships

## Development Commands

### Initial Setup
```bash
# Install dependencies
make deps                          # Install all dependencies
make check-deps                    # Verify required tools are available

# Database setup
make migrate                       # Run database migrations
```

### Development Workflow
```bash
# Primary development (Docker-based)
make dev                           # Start full development environment
make dev-detach                    # Start in background
make dev-stop                      # Stop development environment

# Backend development (standalone)
cd backend
go run cmd/server/main.go          # Start server (port 8080)
go test ./...                      # Run all tests
go test ./internal/handlers        # Run specific package tests
make test-backend                  # Test via Makefile
golangci-lint run                  # Lint code (install: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)

# Frontend development (standalone)
cd frontend
npm run dev                        # Start dev server (port 3000)
npm test                           # Run tests interactively
npm run test:run                   # Run tests once
npm run build                      # Production build
npm run lint                       # Lint code

# Database operations
make migrate                       # Run migrations
make db-reset                      # Reset database
make db-backup                     # Backup database

# Code quality
make lint                          # Lint all code
make fmt                           # Format all code
make test                          # Run all tests

# Utilities
make health                        # Check service health
make logs                          # View all logs
make clean                         # Clean containers and images
```

## Implementation Status

**Backend**: Core infrastructure implemented with JWT auth, SQLite database, and Clean Architecture
**Frontend**: React TypeScript app with Tailwind CSS, routing, and component structure

**Completed:**
- Project structure and Docker setup
- Authentication system (JWT, bcrypt, handlers, tests)
- Database models and repositories for users, articles, comments
- Basic handlers for user operations
- Frontend components: Auth pages, article components, layout
- React Query integration and auth context

**Key Files:**
- `docs/PRD.md` - Product Requirements Document
- `docs/design.md` - System design with Mermaid diagrams
- `docs/tasks.md` - MVP implementation checklist
- Backend: `internal/` contains handlers, models, db repositories, auth
- Frontend: `src/` contains components, pages, hooks, contexts

## API Design

Following RealWorld API specification:
- **Authentication**: `POST /api/users`, `POST /api/users/login`, `GET /api/user`
- **Articles**: `GET /api/articles`, `POST /api/articles`, `GET/PUT/DELETE /api/articles/:slug`
- **Comments**: `GET/POST /api/articles/:slug/comments`, `DELETE /api/articles/:slug/comments/:id`
- **Profiles**: `GET /api/profiles/:username`, `POST/DELETE /api/profiles/:username/follow`

All responses follow standard RealWorld JSON format with consistent error handling.

## Key Implementation Decisions

### Backend Constraints
- No external frameworks - use Go standard library
- SQLite only - no PostgreSQL/MySQL complexity
- JWT stored client-side - no session management
- Middleware chain: CORS → Logging → Auth → Business Logic

### Frontend Constraints  
- No complex state management libraries (Redux/Zustand)
- Minimal external dependencies beyond core stack
- Component composition over inheritance
- Form handling with native HTML5 validation + manual JS

### Security Model
- bcrypt password hashing
- JWT with 24-hour expiration
- CORS configured for development
- SQL injection prevention through prepared statements

## Development Methodology

### Backend Development Guidelines
- **Test-Driven Development (TDD)**: All backend and core logic implementation must follow TDD principles
  - Write failing tests first
  - Implement minimal code to pass tests
  - Refactor while maintaining test coverage
- **SOLID Principles**: Adhere to Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles
- **Clean Architecture**: Implement using Clean Architecture pattern with clear separation of concerns
  - Domain layer: Business entities and rules
  - Application layer: Use cases and application services
  - Infrastructure layer: External dependencies (database, HTTP, etc.)
  - Presentation layer: HTTP handlers and request/response models

### Progress Tracking and Issue Management
- **Commit-level Completion**: Each commit should represent a complete, working increment of functionality
- **GitHub Operations**: Always use `gh` CLI for all GitHub-related operations (issues, PRs, comments)
  - **Issue Management**: Use `gh issue` commands for creating, updating, and commenting on issues
  - **Pull Request Management**: Use `gh pr` commands for creating and managing pull requests
  - **Repository Operations**: Use `gh repo` and `gh api` for repository-level operations
- **Issue Status Updates**: After each significant commit, update the corresponding GitHub issue with:
  - Progress comment describing what was completed using `gh issue comment`
  - Mark relevant acceptance criteria as completed using checkboxes
  - Include commit hash reference for traceability
- **Issue Closing Policy**: **NEVER close issues before committing changes**
  - Only close issues AFTER all related changes have been committed and pushed
  - Use `gh issue close` only when all acceptance criteria are met AND code is committed
  - If work is complete but not yet committed, add a completion comment but keep issue open

## Testing Strategy

### Backend Testing
- Unit tests for business logic in `internal/` packages
- Integration tests for API endpoints
- Test database isolation using separate SQLite files
- **TDD Implementation**: Tests written before implementation code
- Minimum 80% code coverage for core business logic

### Frontend Testing
- Component tests with Vitest/Jest
- API integration tests with MSW (Mock Service Worker)
- Basic E2E for critical user flows

## Architecture Implementation

### Backend Structure (Go + SQLite)
```
backend/
  cmd/
    server/main.go      # HTTP server entry point
    migrate/main.go     # Database migration runner
  internal/
    handlers/           # HTTP handlers (user, article, comment)
    models/             # Domain models (User, Article, Comment)
    auth/               # JWT authentication and middleware
    db/                 # Repository pattern database access
    utils/              # Utilities (slug generation, etc.)
  migrations/           # SQL migration files
```

### Frontend Structure (React + TypeScript)
```
frontend/src/
  components/
    article/            # ArticleCard, CommentForm, CommentList
    layout/             # Header, Layout
    ui/                 # Reusable UI components (button, card, etc.)
  contexts/             # AuthContext for authentication state
  hooks/                # Custom hooks (useAuth, useArticles, useComments)
  lib/                  # API client, query config, utilities
  pages/                # Route components (HomePage, LoginPage, etc.)
  types/                # TypeScript definitions
```

### Key Architecture Patterns
- **Clean Architecture**: Domain models separate from infrastructure
- **Repository Pattern**: Database access abstraction
- **Middleware Chain**: CORS → Logging → Auth → Business Logic
- **Context + React Query**: Frontend state management

## Common Development Patterns

### Error Handling
- Backend: Structured error responses with consistent JSON format
- Frontend: Error boundaries + toast notifications for user feedback

### API Integration
- Frontend uses axios/fetch with automatic JWT header injection
- Optimistic updates for better UX on create/delete operations

### Database Patterns
- Repository pattern for data access
- Transaction wrapping for multi-table operations
- Prepared statements for all dynamic queries

## Tech Stack & Dependencies

### Backend (Go)
- **Core**: Standard `net/http`, no web frameworks
- **Database**: `github.com/mattn/go-sqlite3`
- **Authentication**: `github.com/golang-jwt/jwt/v5`, `golang.org/x/crypto/bcrypt`
- **Testing**: Standard `testing` package

### Frontend (React + TypeScript)
- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, `class-variance-authority`, `clsx`
- **Routing**: React Router v7
- **HTTP**: Axios
- **Testing**: Vitest, Testing Library, jsdom
- **Dev Tools**: ESLint, Prettier integration

### Dependencies Philosophy
Following Armin Ronacher's approach:
- Minimize external dependencies
- Prefer standard library solutions (Go `net/http` vs frameworks)
- Only add dependencies that provide significant value
- Avoid framework lock-in where possible

## MVP Focus Areas

Priority order for implementation:
1. Authentication system (login/register)
2. Article CRUD operations
3. Basic commenting system
4. Essential UI components
5. Integration testing

Advanced features (following, favoriting, tags) are explicitly deprioritized for rapid MVP delivery.
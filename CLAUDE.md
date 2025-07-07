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

### Initial Setup (when backend/frontend exist)
```bash
# Backend setup
cd backend
go mod tidy
go run cmd/server/main.go

# Frontend setup  
cd frontend
npm install
npm run dev

# Database migration
cd backend
go run cmd/migrate/main.go
```

### Development Workflow
```bash
# Start development environment
make dev  # or docker-compose up if available

# Backend development
cd backend
go run cmd/server/main.go          # Start server
go test ./...                      # Run all tests
go test ./internal/handlers        # Run specific package tests
golangci-lint run                  # Lint code

# Frontend development
cd frontend
npm run dev                        # Start dev server
npm test                           # Run tests
npm run build                      # Production build
npm run lint                       # Lint code
```

## Implementation Status

Currently in **planning phase** with comprehensive documentation:
- `docs/PRD.md` - Product Requirements Document
- `docs/design.md` - System design with Mermaid diagrams
- `docs/tasks.md` - MVP implementation checklist
- GitHub Issues #4-#9 track implementation phases

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

## File Structure Expectations

```
backend/
  cmd/
    server/     # Main application entry
    migrate/    # Database migration utility
  internal/
    handlers/   # HTTP handlers
    models/     # Data models
    auth/       # Authentication logic
    db/         # Database connection and queries

frontend/
  src/
    components/ # Reusable UI components
    pages/      # Route-level components  
    hooks/      # Custom React hooks
    services/   # API client and utilities
    types/      # TypeScript type definitions
```

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

## Dependencies Philosophy

Following Armin Ronacher's approach:
- Minimize external dependencies
- Prefer standard library solutions
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
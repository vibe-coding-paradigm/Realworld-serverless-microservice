# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **RealWorld application implementation** demonstrating **monolithic to serverless microservices migration** using **Vibe Coding methodology** and **Armin Ronacher's recommended tech stack**. The project builds a Medium.com clone (social blogging platform) while showcasing practical migration strategies for modern cloud architectures.

### Migration Phases
1. **Phase 1**: Monolithic application (Go + React + SQLite + Docker)
2. **Phase 2**: Cloud transition (AWS ECS/Fargate + GitHub Pages)
3. **Phase 3**: Microservices decomposition (API Gateway + Lambda + DynamoDB)
4. **Phase 4**: Serverless optimization (Event-driven architecture)

### Key Principles
- **Vibe Coding**: Intuitive, fast development prioritizing working code over perfect design
- **Armin Ronacher Philosophy**: Simplicity first, standard libraries, practical approach
- **RealWorld Standard**: Following established API specifications for consistency
- **Progressive Migration**: Incremental transformation from monolith to serverless

## Architecture

### Current State (Phase 1)
- **Backend**: Go with standard `net/http` library, Clean Architecture pattern
- **Frontend**: React 19 + TypeScript, deployed to GitHub Pages
- **Database**: SQLite with raw SQL queries (no ORM)
- **Authentication**: JWT token-based stateless authentication
- **Deployment**: Frontend via GitHub Actions to Pages, Backend containerized

### Deployment Architecture
- **Frontend**: Automatically deployed to GitHub Pages via GitHub Actions
  - URL: https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/
  - Triggered on changes to `frontend/**` directory
- **Backend**: Docker container (localhost:8080 for development)
- **CI/CD**: GitHub Actions workflows for both frontend and backend

## Development Commands

### Quick Start
```bash
# Backend only (since frontend is deployed to GitHub Pages)
docker-compose up backend

# Or for development
cd backend && go run cmd/server/main.go
```

### Frontend Development
```bash
cd frontend
npm ci                          # Install dependencies
npm run dev                     # Start dev server (port 3000)
npm run build                   # Production build
npm run test                    # Run tests interactively
npm run test:run                # Run tests once
npm run lint                    # Lint code
```

### Backend Development
```bash
cd backend
go run cmd/server/main.go       # Start server (port 8080)
go test ./...                   # Run all tests
go test ./internal/handlers     # Run specific package tests
golangci-lint run               # Lint code
```

### Database Operations
```bash
# Run migrations
cd backend && go run cmd/migrate/main.go

# Reset database (remove data/conduit.db)
rm -f data/conduit.db && cd backend && go run cmd/migrate/main.go
```

### Docker Operations
```bash
docker-compose up backend       # Start backend only
docker-compose down             # Stop all services
docker-compose logs backend     # View backend logs
```

### Deployment and Debugging (Makefile Scripts)
```bash
# Deployment Status and Monitoring
make deploy-check               # Check deployment status of both frontend and backend
make deploy-logs               # View recent deployment logs
make status                    # Quick health check for entire system

# Debugging and Troubleshooting
make debug                     # Collect comprehensive debugging information
make deploy-debug              # Deployment-specific debugging info
make gh-login-check            # Verify GitHub CLI authentication

# CDK Infrastructure Management
make cdk-deploy               # Deploy infrastructure with CDK
make cdk-destroy              # Delete CDK infrastructure
make cdk-diff                 # Show CDK changes before deployment
make cdk-synth                # Generate CloudFormation templates

# GitHub Actions Integration
make gh-workflow-run          # Manual workflow execution guide
```

These Makefile scripts automate repetitive deployment and debugging tasks, making it easier to manage the migration process.

## Architecture Implementation

### Backend Structure (Clean Architecture)
```
backend/
  cmd/
    server/main.go              # HTTP server entry point
    migrate/main.go             # Database migration runner
  internal/
    handlers/                   # HTTP handlers (user, article, comment)
    models/                     # Domain models (User, Article, Comment)
    auth/                      # JWT authentication and middleware
    db/                        # Repository pattern database access
    utils/                     # Utilities (slug generation, etc.)
  migrations/                   # SQL migration files
```

### Frontend Structure (Feature-based)
```
frontend/src/
  components/
    article/                    # ArticleCard, CommentForm, CommentList
    layout/                     # Header, Layout
    ui/                         # Reusable UI components (shadcn/ui)
  contexts/                     # AuthContext for authentication state
  hooks/                        # Custom hooks (useAuth, useArticles, useComments)
  lib/                          # API client, query config, utilities
  pages/                        # Route components (HomePage, LoginPage, etc.)
  types/                        # TypeScript definitions
```

### Key Architecture Patterns
- **Clean Architecture**: Domain models separate from infrastructure
- **Repository Pattern**: Database access abstraction with interfaces
- **Middleware Chain**: CORS → Logging → Auth → Business Logic
- **React Query**: Server state management with optimistic updates
- **Component Composition**: UI built with composable shadcn/ui components

## Deployment and CI/CD

### Frontend Deployment
- **Platform**: GitHub Pages
- **URL**: https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/
- **Build Tool**: Vite with base path `/Realworld-serverless-microservice/`
- **Trigger**: Automatic on changes to `frontend/**` via GitHub Actions
- **Dependencies**: React Query, Tailwind CSS, shadcn/ui components

### Backend Deployment
- **Current**: Docker container for local development
- **Target**: AWS ECS/Fargate (Phase 2 migration)
- **Database**: SQLite file mounted as volume
- **Health Check**: `GET /health` endpoint

### Environment Configuration
- **Frontend**: `VITE_API_URL` environment variable for API endpoint
- **Backend**: `DATABASE_URL`, `JWT_SECRET`, `PORT` environment variables
- **Development**: Backend runs on localhost:8080, Frontend served from GitHub Pages

## API Design

Following RealWorld API specification:
- **Authentication**: `POST /api/users`, `POST /api/users/login`, `GET /api/user`
- **Articles**: `GET /api/articles`, `POST /api/articles`, `GET/PUT/DELETE /api/articles/:slug`
- **Comments**: `GET/POST /api/articles/:slug/comments`, `DELETE /api/articles/:slug/comments/:id`
- **Profiles**: `GET /api/profiles/:username`, `POST/DELETE /api/profiles/:username/follow`

All responses follow standard RealWorld JSON format with consistent error handling.

## Implementation Constraints

### Backend Constraints
- **No external frameworks**: Use Go standard library only
- **SQLite only**: No PostgreSQL/MySQL complexity (until Phase 3)
- **JWT client-side storage**: No session management
- **Prepared statements**: Prevent SQL injection
- **Clean Architecture**: Strict layer separation

### Frontend Constraints
- **No complex state management**: Context API + React Query only
- **Minimal dependencies**: Beyond core React ecosystem
- **Component composition**: Over inheritance patterns
- **Native HTML5 validation**: With manual JavaScript enhancement

## Development Methodology

### Backend Development (TDD Required)
- **Test-Driven Development**: Write failing tests first
- **Clean Architecture**: Domain → Application → Infrastructure → Presentation
- **Repository Pattern**: Database access abstraction
- **SOLID Principles**: Especially Single Responsibility and Dependency Inversion

### Issue Management (Critical)
- **GitHub CLI Required**: Use `gh` for all GitHub operations
- **Evidence-Based Closing**: Always include proof when closing issues
- **Commit-Level Tracking**: Each commit should represent complete functionality
- **Never close before commit**: Commit first, then close with evidence

### Issue Closing Evidence Requirements
When closing issues, include:
- **Logs**: Command output, test results, deployment logs
- **Functional Demo**: Screenshots, API responses, working URLs
- **Verification Steps**: Clear reproduction instructions
- **Commit Reference**: Include commit hash for traceability

## Testing Strategy

### Backend Testing
- **Unit Tests**: All business logic in `internal/` packages
- **Integration Tests**: API endpoints with test database
- **TDD Implementation**: Tests written before implementation
- **Coverage Target**: 80% minimum for core business logic
- **Test Database**: Separate SQLite files for isolation

### Frontend Testing
- **Component Tests**: Vitest + Testing Library
- **API Integration**: Mock Service Worker (MSW)
- **Type Safety**: TypeScript strict mode enabled

## Tech Stack

### Backend
- **Language**: Go 1.21+
- **HTTP**: Standard `net/http` library
- **Database**: SQLite with `github.com/mattn/go-sqlite3`
- **Auth**: JWT with `github.com/golang-jwt/jwt/v5`
- **Password**: bcrypt with `golang.org/x/crypto/bcrypt`

### Frontend
- **Framework**: React 19 + TypeScript
- **Build**: Vite with base path configuration
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Routing**: React Router v7
- **HTTP**: Axios with automatic JWT injection
- **State**: Context API + React Query (@tanstack/react-query)

### Deployment
- **Frontend**: GitHub Actions → GitHub Pages
- **Backend**: Docker → AWS ECS (planned)
- **Database**: SQLite → RDS/DynamoDB (planned)
- **Infrastructure**: AWS CDK for cloud resources

## Migration Planning

Current focus is Phase 1 completion before moving to Phase 2 cloud migration. Key files for migration planning:
- `docs/migration/PRD.md` - Migration requirements
- `docs/migration/github-issue-guidelines.md` - Issue management process
- GitHub Issues track all migration progress with evidence-based completion

## Workflow Management
Do not manually trigger workflows; only start workflows through PR merges to avoid duplicate executions and failures.
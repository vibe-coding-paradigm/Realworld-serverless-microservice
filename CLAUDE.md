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

## Project Testing Strategies

### Test Execution Guidelines
- 테스트만 고쳤을땐 로컬에서 make e2e-cloud로 검증하고, 백엔드나 프론트 변경시엔 클라우드 배포후에 e2e 테스트 워크 플로우로 확인할 것

## Commands Reference

### Essential Development Commands
```bash
# Quick Setup (New Project)
make quick-start              # Complete project setup (deps + hooks + migration + dev environment)

# Development Workflow  
make start                    # Start development environment (detached)
make dev-logs                 # View development logs
make test-watch              # Run tests in watch mode
make lint-fix                # Auto-fix linting issues
make stop                    # Stop development environment

# Testing
make test                    # Run all tests (backend + frontend)
make e2e                     # Run E2E tests locally
make e2e-cloud              # Run E2E tests against cloud environment
make load-test-local        # Run local load tests

# Build and Deploy
make frontend-build         # Build frontend for production
make backend-build          # Build backend binary
make deploy-check           # Check deployment status
make deploy-logs            # View deployment logs
```

### Database Management
```bash
make migrate               # Run database migrations
make db-reset             # Reset database (SQLite for local development)
make seed-db              # Insert test data
```

### Development Environment
```bash
make frontend-dev         # Start only frontend (Vite dev server on :3000)
make backend-dev          # Start only backend (Go server on :8080)
make watch               # File watching mode with auto-restart
```

## Architecture Overview

This is a **RealWorld Medium.com clone** implementing **progressive migration from monolith to serverless microservices**.

### Current Architecture (Phase 4 - Complete Serverless)
- **Frontend**: React 19 + TypeScript + Tailwind CSS (GitHub Pages)
- **Backend**: Go Lambda functions (serverless microservices)
- **Database**: DynamoDB (fully serverless)
- **API Gateway**: AWS API Gateway with Lambda Proxy Integration
- **Infrastructure**: AWS CDK (TypeScript)

### Microservices Breakdown
1. **Auth Service** (`infra/lambda-functions/auth/`)
   - Register: `POST /users`
   - Login: `POST /users/login` 
   - Get User: `GET /user`

2. **Articles Service** (`infra/lambda-functions/articles/`)
   - CRUD operations: `/articles`
   - Favorites: `/articles/:slug/favorite`

3. **Comments Service** (`infra/lambda-functions/comments/`)
   - CRUD operations: `/articles/:slug/comments`

### Technology Stack

#### Backend (Go 1.23.6)
- **Runtime**: AWS Lambda with Go (PROVIDED_AL2)
- **Database**: DynamoDB with Single Table Design
- **Authentication**: JWT tokens
- **Architecture**: Clean Architecture pattern
- **Testing**: Go standard testing + testify

#### Frontend (React 19)
- **Framework**: React 19 + TypeScript 5.8
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Build Tool**: Vite 7
- **State Management**: React Context + TanStack Query (React Query)
- **Routing**: React Router v7
- **Testing**: Vitest 3 + Playwright 1.54 (E2E)

#### Infrastructure
- **IaC**: AWS CDK (TypeScript)
- **Deployment**: GitHub Actions CI/CD
- **Monitoring**: CloudWatch Logs + Alarms
- **Cost Optimization**: Pay-per-use serverless (70%+ cost reduction)

## Key File Locations

### Backend Structure
```
backend/
├── cmd/                    # Application entry points
│   ├── server/main.go     # Main HTTP server (legacy)
│   └── migrate/main.go    # Database migration tool
├── internal/              # Private packages
│   ├── auth/              # JWT authentication
│   ├── db/                # Database repositories
│   ├── handlers/          # HTTP handlers
│   ├── models/            # Domain models
│   └── utils/             # Utilities
└── migrations/            # SQL migrations
```

### Serverless Functions
```
infra/lambda-functions/
├── auth/                  # Authentication microservice
├── articles/              # Articles microservice  
└── comments/              # Comments microservice
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and configurations
│   └── types/            # TypeScript type definitions
├── e2e/                  # Playwright E2E tests
└── public/               # Static assets
```

## Environment Configuration

### Local Development URLs
- Frontend: `http://localhost:3000` (Vite dev server)
- Backend: `http://localhost:8080` (Go HTTP server)
- Database: SQLite file (`backend/data/conduit.db`)

### Production URLs  
- Frontend: `https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/`
- Backend: `https://5hlad3iru9.execute-api.ap-northeast-2.amazonaws.com/prod/`
- Database: DynamoDB tables (`conduit-users`, `conduit-articles`, `conduit-comments`)

## Testing Strategy

### Unit Tests
- **Backend**: `cd backend && go test ./...`
- **Frontend**: `cd frontend && npm test`

### Integration Tests  
- **E2E Local**: `make e2e` (tests against localhost:8080 + localhost:3000)
- **E2E Cloud**: `make e2e-cloud` (tests against production environment)
- **Load Tests**: `make load-test-local` (k6 performance testing)

### Test Coverage
- **29 E2E test scenarios** covering authentication, CRUD operations, and UI workflows
- **47 unit tests** for backend business logic
- **Cross-browser testing**: Chrome, Firefox, Safari

## Deployment Guidelines

### GitHub Actions Only Policy
**All deployments must use GitHub Actions workflows. Manual deployments are prohibited.**

#### Deployment Workflows
- **Frontend**: Triggers on `frontend/` changes → GitHub Pages
- **Backend**: Triggers on `backend/` or `infra/lambda-functions/` changes → AWS Lambda
- **Infrastructure**: Triggers on `infra/` changes → AWS CDK deployment

#### Deployment Commands (Read-Only)
```bash
make deploy-check          # Check deployment status
make deploy-logs          # View all workflow logs  
make deploy-logs-failed   # View only failed deployments
make verify-all           # Comprehensive deployment verification
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
lsof -i :3000  # Frontend port
lsof -i :8080  # Backend port

# Kill processes
pkill -f "port 3000"
pkill -f "port 8080"
```

#### Development Environment
```bash
make dev-debug            # Collect debugging information
make dev-status          # Check container status
make clean               # Clean Docker containers/images
```

#### E2E Test Failures
```bash
make e2e-debug           # Debug mode with browser UI
make e2e-ui              # Interactive test UI
cd frontend && npx playwright test --headed  # Run with visible browser
```

## Code Quality Standards

### Automatic Quality Checks (Git Hooks)
- **Pre-commit**: Unit tests + linting (blocks commits on failure)
- **Pre-push**: E2E tests (blocks pushes on failure)  

### Manual Quality Commands
```bash
make lint                # Run all linters
make lint-fix           # Auto-fix linting issues
make fmt                # Format code
```

### Linting Tools
- **Backend**: `golangci-lint` (Go)
- **Frontend**: `eslint` + `typescript-eslint` (TypeScript/React)

## Migration History

This project demonstrates **progressive migration from monolith to serverless**:

1. **Phase 1**: Monolithic app (Go + React + SQLite + Docker) ✅
2. **Phase 2**: Cloud transition (AWS ECS/Fargate) ✅  
3. **Phase 3**: Microservices decomposition (API Gateway + Lambda + DynamoDB) ✅
4. **Phase 4**: Serverless optimization (Complete serverless, 70%+ cost reduction) ✅

The codebase preserves the legacy monolithic backend (`backend/`) alongside the new serverless functions (`infra/lambda-functions/`) for educational purposes and comparison.
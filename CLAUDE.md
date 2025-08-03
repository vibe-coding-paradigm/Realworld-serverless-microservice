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

### Current State (Phase 2 Complete)
- **Backend**: Go with standard `net/http` library, Clean Architecture pattern
- **Frontend**: React 19 + TypeScript, deployed to GitHub Pages
- **Database**: SQLite with raw SQL queries (no ORM)
- **Authentication**: JWT token-based stateless authentication (fully functional)  
- **Infrastructure**: AWS ECS/Fargate + Application Load Balancer (ALB)
- **Deployment**: Full CI/CD via GitHub Actions with automatic E2E testing
- **Testing**: Comprehensive E2E (Playwright) + Load Testing (k6) infrastructure

### Deployment Architecture
- **Frontend**: Automatically deployed to GitHub Pages via GitHub Actions
  - URL: https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/
  - Triggered on changes to `frontend/**` directory
- **Backend**: AWS ECS/Fargate with Docker containers
  - **Phase 2**: Cloud deployment completed ✅
  - **ALB**: conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com 
  - **Initial Deployment**: Must be done locally (`make deploy-initial`)
  - **Updates**: Automated via GitHub Actions after initial deployment
- **Infrastructure**: AWS CDK (TypeScript) - ECS, ECR, ALB, VPC
- **CI/CD**: GitHub Actions workflows with automatic E2E testing
- **Testing**: E2E tests run on all deployments, load tests manual trigger

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

### AWS Deployment (Makefile Scripts)
```bash
# ⚠️ INITIAL DEPLOYMENT (Local Only - Required First!)
make deploy-initial              # Complete initial infrastructure setup

# After initial deployment, GitHub Actions handles updates automatically
# For manual operations:
make deploy-check               # Check deployment status
make deploy-logs               # View deployment logs
make cdk-deploy               # Deploy infrastructure only
make cdk-destroy              # Delete infrastructure
```

### Testing Commands
```bash
# End-to-End Testing (Playwright)
cd frontend && npm run test:e2e           # Run all E2E tests
cd frontend && npx playwright test --ui   # Run E2E tests with UI mode
cd frontend && npx playwright test --project=chromium  # Test specific browser

# Load Testing (k6)
cd load-tests && k6 run basic-load-test.js     # Basic load test
cd load-tests && k6 run performance-baseline.js  # Performance baseline
cd load-tests && k6 run auth-load-test.js      # Authentication load test

# Unit Tests
cd backend && go test ./...               # Run all Go unit tests
cd frontend && npm run test:run           # Run all frontend unit tests
```

### Comprehensive Development Commands (Makefile Scripts)

#### 🚀 빠른 시작 - 프로젝트 전체 초기 설정
```bash
make quick-start              # Complete project setup automation (recommended)
make setup-dev               # Development environment initial setup
make install-hooks           # Install Git hooks
```

#### 🛠️ 개발 환경 관리
```bash
make dev                     # Start development environment (Docker Compose)
make dev-detach             # Start development environment in background
make dev-stop               # Stop development environment
make dev-logs               # View development logs
make frontend-dev           # Start frontend only in development mode
make backend-dev            # Start backend only in development mode
make watch                  # File change detection with auto-restart
```

#### 🔨 빌드 및 의존성
```bash
make frontend-build         # Build frontend only
make backend-build          # Build backend only
make build                  # Build production images
make deps                   # Install all dependencies (backend + frontend)
make check-deps             # Verify required dependencies are installed
make install-deps           # Show installation guide for dev dependencies
```

#### 🧪 테스트 실행
```bash
make test                   # Run all tests (backend + frontend)
make test-watch             # Run tests in watch mode

# E2E Testing (Local Development)
make e2e                    # Run E2E tests (Playwright)
make e2e-local              # Complete local E2E with backend startup
make e2e-ui                 # Run E2E tests with UI mode
make e2e-debug              # Run E2E tests in debug mode

# E2E Testing (Serverless/Cloud)
make e2e-cloud              # Run E2E tests against deployed AWS services
make e2e-serverless         # Deploy to AWS and run E2E tests (full pipeline)

# Load & API Testing
make load-test-local        # Run local load testing (k6)
make api-test               # Test API endpoints directly
```

#### 🔧 코드 품질 관리
```bash
make lint                   # Run linters for both backend and frontend
make lint-fix               # Auto-fix linting issues
make fmt                    # Format code (Go + frontend)
```

#### 🗄️ 데이터베이스 관리
```bash
make migrate                # Run database migrations
make seed-db                # Insert test data (TODO: implementation needed)
make db-reset               # Reset database completely
make db-backup              # Backup current database
```

#### 🧹 환경 관리
```bash
make clean                  # Clean containers and images
make reset-env              # Complete environment reset (destructive)
make dev-status             # Check development environment status
make dev-debug              # Collect development debugging information
make logs-all               # View integrated logs
```

#### ☁️ 배포 상태 및 모니터링
```bash
make deploy-check           # Check deployment status of both frontend and backend
make deploy-logs            # View recent workflow logs (all)
make deploy-logs-frontend   # View frontend deployment logs
make deploy-logs-backend    # View backend deployment logs
make deploy-logs-failed     # View failed deployments only
make deploy-logs-e2e        # View E2E test logs
make deploy-logs-load       # View load test logs
make status                 # Quick health check for entire system
```

#### 🏗️ 배포 및 인프라 (⚠️ GitHub Actions 전용)
```bash
make deploy-initial         # Initial infrastructure deployment (local only - required first!)
make verify-deployment      # Verify AWS deployment status
make verify-all             # Complete deployment verification
```

#### 🐛 디버깅 및 문제 해결
```bash
make debug                  # Collect comprehensive debugging information
make deploy-debug           # Deployment-specific debugging info
make gh-login-check         # Verify GitHub CLI authentication
```

#### 🏗️ CDK 인프라 관리 (⚠️ GitHub Actions 권장)
```bash
make cdk-deploy             # Deploy infrastructure with CDK
make cdk-destroy            # Delete CDK infrastructure
make cdk-diff               # Show CDK changes before deployment
make cdk-synth              # Generate CloudFormation templates
```

#### 🔄 GitHub Actions 통합
```bash
make gh-workflow-run        # Manual workflow execution guide (query-only)
```

#### ⚡ 자주 사용하는 조합 명령어
```bash
make start                  # Alias for dev-detach
make stop                   # Alias for dev-stop
make restart                # Stop and start development environment
make health                 # Service health check
```

### 📋 Makefile 사용 권장 패턴

#### 🚀 프로젝트 첫 시작 시
```bash
make quick-start            # 모든 설정을 자동으로 완료
# 또는 단계별로:
make check-deps && make deps && make install-hooks && make migrate && make dev
```

#### 🛠️ 일상적인 개발 작업
```bash
make start                  # 개발 환경 시작
make dev-logs              # 로그 확인
make test-watch            # 테스트 watch 모드
make lint-fix              # 코드 정리
make stop                  # 개발 환경 종료
```

#### 🧪 테스트 및 검증
```bash
make e2e                   # E2E 테스트 실행
make e2e-ui                # E2E 테스트 UI 모드로 디버깅
make load-test-local       # 로컬 성능 테스트
make api-test              # API 엔드포인트 직접 테스트
```

#### 🔍 배포 및 모니터링
```bash
make deploy-check          # 배포 상태 확인
make deploy-logs-failed    # 실패한 배포만 확인
make verify-all            # 전체 시스템 검증
make debug                 # 종합 디버깅 정보 수집
```

#### 🧹 환경 정리 및 재설정
```bash
make clean                 # Docker 정리
make db-reset              # 데이터베이스 초기화
make reset-env             # 전체 환경 재설정 (주의: 파괴적)
```

### 🎯 Claude Code를 위한 특별 지침

#### 워크플로우 로그 조회 시스템
- **스크립트**: `scripts/get-workflow-logs.sh` (조회 전용, GitHub CLI 사용)
- **주요 명령어**: `make deploy-logs`, `make deploy-logs-failed`
- **특징**: 로컬 실행 방지, 환경 차이 최소화, 컬러 출력

#### 개발 효율성 우선순위
1. `make quick-start` - 새 환경 설정 시 최우선
2. `make deploy-logs-failed` - 문제 발생 시 첫 번째 확인
3. `make debug` - 종합적인 문제 진단
4. `make verify-all` - 배포 후 전체 검증

These comprehensive Makefile scripts provide automated workflows for all development, testing, deployment, and debugging tasks, significantly streamlining the migration process and daily development work.

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

### End-to-End Testing (Playwright)
- **Framework**: Playwright with TypeScript configuration
- **Browser Coverage**: Chrome, Firefox, Safari (WebKit)
- **Test Scenarios**: 35+ comprehensive E2E test cases
- **Authentication Flow**: Complete signup/login/JWT validation
- **CRUD Operations**: Articles and comments full lifecycle testing
- **Cross-browser**: Parallel execution across all supported browsers
- **CI Integration**: Automatic execution on every deployment

### Load Testing (k6)
- **Tool**: k6 performance testing framework
- **Test Types**: Performance baseline, basic load, authentication load, spike tests
- **Performance Thresholds**: 95% requests < 2s, error rate < 1%
- **Scenarios**: Single user, 5-20 concurrent users, sustained load patterns
- **Execution**: Manual trigger via GitHub Actions, comprehensive reporting
- **Metrics**: Response times, throughput, error rates, resource utilization

### CI/CD Testing Integration
- **Automatic E2E**: Runs on all frontend/backend deployments
- **Manual Load Testing**: Triggered manually via GitHub Actions workflow_dispatch
- **Dynamic URL Management**: Automatic detection of deployed backend/frontend URLs
- **Test Evidence**: Comprehensive reporting with artifacts and HTML reports
- **Failure Handling**: Clear error messages and debugging information

## Tech Stack

### Backend
- **Language**: Go 1.23.6
- **HTTP**: Standard `net/http` library
- **Database**: SQLite with `github.com/mattn/go-sqlite3`
- **Auth**: JWT with `github.com/golang-jwt/jwt/v5`
- **Password**: bcrypt with `golang.org/x/crypto/bcrypt`

### Frontend
- **Framework**: React 19 + TypeScript
- **Build**: Vite 7 with base path configuration
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Routing**: React Router v7
- **HTTP**: Axios with automatic JWT injection
- **State**: Context API + React Query (@tanstack/react-query)

### Deployment
- **Frontend**: GitHub Actions → GitHub Pages ✅
- **Backend**: Docker → AWS ECS/Fargate with ALB ✅
- **Database**: SQLite file storage (local, MVP approach)
- **Infrastructure**: AWS CDK for cloud resources ✅
- **Testing**: Playwright E2E + k6 Load Testing ✅

## Migration Planning

**Phase 2 Complete** ✅ - Cloud migration successfully completed. Current focus is Phase 3 preparation. Key files for migration planning:
- `docs/migration/PRD.md` - Migration requirements
- `docs/migration/github-issue-guidelines.md` - Issue management process
- `docs/github-variables.md` - CI/CD environment configuration guide
- GitHub Issues track all migration progress with evidence-based completion

### Completed Infrastructure:
- **ECS/Fargate**: Container orchestration with Auto Scaling
- **Application Load Balancer**: conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com
- **JWT Authentication**: Fully functional with proper secret management
- **CI/CD Pipeline**: Automated deployments with E2E testing
- **Monitoring**: Comprehensive testing and verification infrastructure

## Workflow Management
Do not manually trigger workflows; only start workflows through PR merges to avoid duplicate executions and failures.

## Git Hooks and Serverless Testing

### Pre-push Hook (Husky)
The project uses Husky pre-push hooks to ensure code quality before pushing to GitHub:

#### **Phase 1 (Local Testing)**:
```bash
# Old workflow - local backend + local E2E
make e2e-local  # Spins up local backend, runs E2E tests
```

#### **Phase 2+ (Serverless Testing)**:
```bash
# New workflow - AWS deployment + cloud E2E  
make e2e-serverless  # Deploys to AWS, runs E2E against real services
```

#### Pre-push Process:
1. **AWS Credentials Check**: Verifies AWS CLI is configured
2. **CDK Environment Check**: Ensures CDK is properly set up
3. **Serverless Deployment**: Deploys Lambda functions and DynamoDB to AWS
4. **Cloud E2E Testing**: Runs Playwright tests against real AWS services
5. **Push Allow/Block**: Only allows push if all tests pass

#### Manual Cloud Testing:
```bash
# Test against existing deployment
make e2e-cloud

# Full deployment + test cycle
make e2e-serverless

# Get current API Gateway URL
make get-api-url
```

This approach ensures that:
- Lambda functions work correctly in AWS environment
- DynamoDB integration functions properly
- API Gateway routing is configured correctly
- Real network latency and AWS service behavior is tested

## Deployment Policy (CRITICAL)

### 🚨 MANDATORY GitHub Actions Only Deployment
**ALL deployments MUST be performed exclusively through GitHub Actions workflows. Manual deployment commands are STRICTLY PROHIBITED.**

#### Prohibited Commands:
```bash
# ❌ NEVER use these commands directly
npx cdk deploy
make cdk-deploy
aws cloudformation deploy
```

#### Required Deployment Process:
1. **Code Changes**: Make infrastructure or application changes
2. **Commit & Push**: Commit changes and push to main branch
3. **GitHub Actions**: Let workflows handle deployment automatically
4. **Verification**: Use workflow verification scripts to confirm deployment

#### Rationale:
- **Consistency**: Ensures all deployments follow the same process
- **Auditability**: Complete deployment history in GitHub Actions
- **Security**: Prevents unauthorized or inconsistent deployments
- **Reliability**: Standardized deployment environment and dependencies
- **Team Collaboration**: All team members follow same deployment process

#### Emergency Override:
Only in extreme emergencies where GitHub Actions is unavailable, manual deployment may be considered with explicit approval and documentation.
.PHONY: help dev build test clean lint fmt migrate deps install-deps check-deps

# Default target
help:
	@echo "Available commands:"
	@echo "  dev            - Start development environment"
	@echo "  build          - Build production images"
	@echo "  test           - Run all tests"
	@echo "  lint           - Run linters"
	@echo "  fmt            - Format code"
	@echo "  migrate        - Run database migrations"
	@echo "  clean          - Clean up containers and images"
	@echo "  deps           - Install dependencies"
	@echo "  check-deps     - Check if required tools are installed"

# Development commands
dev: check-deps
	@echo "🚀 Starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build

dev-detach: check-deps
	@echo "🚀 Starting development environment (detached)..."
	docker-compose -f docker-compose.dev.yml up --build -d

dev-logs:
	@echo "📋 Showing development logs..."
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop:
	@echo "🛑 Stopping development environment..."
	docker-compose -f docker-compose.dev.yml down

# Production commands
build:
	@echo "🔨 Building production images..."
	docker-compose build

prod:
	@echo "🚀 Starting production environment..."
	docker-compose up --build

prod-detach:
	@echo "🚀 Starting production environment (detached)..."
	docker-compose up --build -d

# Testing commands
test: test-backend test-frontend

test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && go test ./...

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test -- --run

test-integration:
	@echo "🔧 Running integration tests..."
	# TODO: Add integration tests

# Code quality commands
lint: lint-backend lint-frontend

lint-backend:
	@echo "🔍 Linting backend code..."
	cd backend && golangci-lint run || echo "⚠️  golangci-lint not found, install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"

lint-frontend:
	@echo "🔍 Linting frontend code..."
	cd frontend && npm run lint

fmt: fmt-backend fmt-frontend

fmt-backend:
	@echo "📝 Formatting backend code..."
	cd backend && go fmt ./...

fmt-frontend:
	@echo "📝 Formatting frontend code..."
	cd frontend && npm run format || echo "⚠️  No format script found"

# Database commands
migrate:
	@echo "🗄️  Running database migrations..."
	cd backend && go run cmd/migrate/main.go

migrate-docker:
	@echo "🗄️  Running database migrations in Docker..."
	docker-compose exec backend ./migrate

# Dependency management
deps: deps-backend deps-frontend

deps-backend:
	@echo "📦 Installing backend dependencies..."
	cd backend && go mod tidy && go mod download

deps-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

install-deps:
	@echo "🛠️  Installing development dependencies..."
	@echo "Please install the following tools:"
	@echo "  - Docker & Docker Compose"
	@echo "  - Go 1.24+ (https://go.dev/doc/install)"
	@echo "  - Node.js 20+ (https://nodejs.org/en/download)"
	@echo "  - golangci-lint: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"

check-deps:
	@echo "✅ Checking dependencies..."
	@command -v docker >/dev/null 2>&1 || (echo "❌ Docker not found"; exit 1)
	@command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || (echo "❌ Docker Compose not found"; exit 1)
	@command -v go >/dev/null 2>&1 || (echo "❌ Go not found"; exit 1)
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js not found"; exit 1)
	@command -v npm >/dev/null 2>&1 || (echo "❌ npm not found"; exit 1)
	@echo "✅ All required dependencies found"

# Cleanup commands
clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

clean-all:
	@echo "🧹 Deep cleaning..."
	docker-compose down -v --rmi all
	docker-compose -f docker-compose.dev.yml down -v --rmi all
	docker system prune -a -f

# Database commands
db-reset:
	@echo "🗄️  Resetting database..."
	rm -f data/conduit.db
	$(MAKE) migrate

db-backup:
	@echo "💾 Backing up database..."
	cp data/conduit.db data/conduit_backup_$$(date +%Y%m%d_%H%M%S).db

# Health checks
health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:8080/health || echo "❌ Backend health check failed"
	@curl -f http://localhost:3000 || echo "❌ Frontend health check failed"

# Development utilities
logs:
	@echo "📋 Showing all logs..."
	docker-compose logs -f

logs-backend:
	@echo "📋 Showing backend logs..."
	docker-compose logs -f backend

logs-frontend:
	@echo "📋 Showing frontend logs..."
	docker-compose logs -f frontend

shell-backend:
	@echo "🐚 Opening backend shell..."
	docker-compose exec backend sh

shell-frontend:
	@echo "🐚 Opening frontend shell..."
	docker-compose exec frontend sh
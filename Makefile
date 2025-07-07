.PHONY: help dev build test clean lint fmt migrate deps install-deps check-deps

# 기본 타겟
help:
	@echo "사용 가능한 명령어:"
	@echo "  dev            - 개발 환경 시작"
	@echo "  build          - 프로덕션 이미지 빌드"
	@echo "  test           - 모든 테스트 실행"
	@echo "  lint           - 린터 실행"
	@echo "  fmt            - 코드 포맷팅"
	@echo "  migrate        - 데이터베이스 마이그레이션 실행"
	@echo "  clean          - 컨테이너와 이미지 정리"
	@echo "  deps           - 의존성 설치"
	@echo "  check-deps     - 필요한 도구 설치 확인"

# 개발 명령어
dev: check-deps
	@echo "🚀 개발 환경을 시작하는 중..."
	docker-compose -f docker-compose.dev.yml up --build

dev-detach: check-deps
	@echo "🚀 개발 환경을 시작하는 중 (백그라운드)..."
	docker-compose -f docker-compose.dev.yml up --build -d

dev-logs:
	@echo "📋 개발 로그를 표시하는 중..."
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop:
	@echo "🛑 개발 환경을 중단하는 중..."
	docker-compose -f docker-compose.dev.yml down

# 프로덕션 명령어
build:
	@echo "🔨 프로덕션 이미지를 빌드하는 중..."
	docker-compose build

prod:
	@echo "🚀 프로덕션 환경을 시작하는 중..."
	docker-compose up --build

prod-detach:
	@echo "🚀 프로덕션 환경을 시작하는 중 (백그라운드)..."
	docker-compose up --build -d

# 테스트 명령어
test: test-backend test-frontend

test-backend:
	@echo "🧪 백엔드 테스트를 실행하는 중..."
	cd backend && go test ./...

test-frontend:
	@echo "🧪 프론트엔드 테스트를 실행하는 중..."
	cd frontend && npm test -- --run

test-integration:
	@echo "🔧 통합 테스트를 실행하는 중..."
	# TODO: 통합 테스트 추가

# 코드 품질 명령어
lint: lint-backend lint-frontend

lint-backend:
	@echo "🔍 백엔드 코드를 린팅하는 중..."
	cd backend && golangci-lint run || echo "⚠️  golangci-lint를 찾을 수 없습니다. 설치하세요: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"

lint-frontend:
	@echo "🔍 프론트엔드 코드를 린팅하는 중..."
	cd frontend && npm run lint

fmt: fmt-backend fmt-frontend

fmt-backend:
	@echo "📝 백엔드 코드를 포맷팅하는 중..."
	cd backend && go fmt ./...

fmt-frontend:
	@echo "📝 프론트엔드 코드를 포맷팅하는 중..."
	cd frontend && npm run format || echo "⚠️  format 스크립트를 찾을 수 없습니다"

# 데이터베이스 명령어
migrate:
	@echo "🗄️  데이터베이스 마이그레이션을 실행하는 중..."
	cd backend && go run cmd/migrate/main.go

migrate-docker:
	@echo "🗄️  Docker에서 데이터베이스 마이그레이션을 실행하는 중..."
	docker-compose exec backend ./migrate

# 의존성 관리
deps: deps-backend deps-frontend

deps-backend:
	@echo "📦 백엔드 의존성을 설치하는 중..."
	cd backend && go mod tidy && go mod download

deps-frontend:
	@echo "📦 프론트엔드 의존성을 설치하는 중..."
	cd frontend && npm install

install-deps:
	@echo "🛠️  개발 의존성을 설치하는 중..."
	@echo "다음 도구들을 설치해주세요:"
	@echo "  - Docker & Docker Compose"
	@echo "  - Go 1.24+ (https://go.dev/doc/install)"
	@echo "  - Node.js 20+ (https://nodejs.org/en/download)"
	@echo "  - golangci-lint: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"

check-deps:
	@echo "✅ 의존성을 확인하는 중..."
	@command -v docker >/dev/null 2>&1 || (echo "❌ Docker를 찾을 수 없습니다"; exit 1)
	@command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || (echo "❌ Docker Compose를 찾을 수 없습니다"; exit 1)
	@command -v go >/dev/null 2>&1 || (echo "❌ Go를 찾을 수 없습니다"; exit 1)
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js를 찾을 수 없습니다"; exit 1)
	@command -v npm >/dev/null 2>&1 || (echo "❌ npm을 찾을 수 없습니다"; exit 1)
	@echo "✅ 모든 필요한 의존성을 찾았습니다"

# 정리 명령어
clean:
	@echo "🧹 정리하는 중..."
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

clean-all:
	@echo "🧹 전체 정리하는 중..."
	docker-compose down -v --rmi all
	docker-compose -f docker-compose.dev.yml down -v --rmi all
	docker system prune -a -f

# 데이터베이스 명령어
db-reset:
	@echo "🗄️  데이터베이스를 재설정하는 중..."
	rm -f data/conduit.db
	$(MAKE) migrate

db-backup:
	@echo "💾 데이터베이스를 백업하는 중..."
	cp data/conduit.db data/conduit_backup_$$(date +%Y%m%d_%H%M%S).db

# 헬스 체크
health:
	@echo "🏥 서비스 헬스를 확인하는 중..."
	@curl -f http://localhost:8080/health || echo "❌ 백엔드 헬스 체크 실패"
	@curl -f http://localhost:3000 || echo "❌ 프론트엔드 헬스 체크 실패"

# 개발 유틸리티
logs:
	@echo "📋 모든 로그를 표시하는 중..."
	docker-compose logs -f

logs-backend:
	@echo "📋 백엔드 로그를 표시하는 중..."
	docker-compose logs -f backend

logs-frontend:
	@echo "📋 프론트엔드 로그를 표시하는 중..."
	docker-compose logs -f frontend

shell-backend:
	@echo "🐚 백엔드 쉘을 여는 중..."
	docker-compose exec backend sh

shell-frontend:
	@echo "🐚 프론트엔드 쉘을 여는 중..."
	docker-compose exec frontend sh
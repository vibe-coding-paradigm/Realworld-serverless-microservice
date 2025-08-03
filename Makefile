.PHONY: help dev build test clean lint fmt migrate deps install-deps check-deps deploy debug deploy-check deploy-logs deploy-logs-frontend deploy-logs-backend deploy-logs-failed deploy-logs-e2e deploy-logs-load deploy-debug cdk-deploy deploy-initial cdk-destroy cdk-diff cdk-synth gh-login-check gh-workflow-run status verify-deployment verify-deployment-install verify-all quick-start setup-dev watch test-watch lint-fix git-hooks install-hooks e2e e2e-local e2e-local-cleanup e2e-ui e2e-debug e2e-cloud e2e-serverless get-api-url load-test-local api-test frontend-build frontend-dev backend-dev backend-build seed-db reset-env deploy-serverless deploy-serverless-auth deploy-serverless-articles deploy-serverless-comments deploy-infra deploy-infra-destroy deploy-logs-serverless deploy-logs-infra get-serverless-api-url verify-serverless

# 기본 타겟
help:
	@echo "🚀 RealWorld Serverless Microservice - Makefile 명령어 가이드"
	@echo ""
	@echo "📚 빠른 시작:"
	@echo "  quick-start    - 프로젝트 전체 초기 설정 (권장)"
	@echo "  setup-dev      - 개발 환경 초기 설정"
	@echo "  install-hooks  - Git hooks 설치"
	@echo ""
	@echo "🛠️ 개발 환경:"
	@echo "  dev            - 개발 환경 시작 (Docker Compose)"
	@echo "  dev-detach     - 개발 환경 백그라운드 시작"
	@echo "  dev-stop       - 개발 환경 중단"
	@echo "  frontend-dev   - 프론트엔드만 개발 모드 시작"
	@echo "  backend-dev    - 백엔드만 개발 모드 시작"
	@echo "  watch          - 파일 변경 감지 및 자동 재시작"
	@echo ""
	@echo "🧪 테스트:"
	@echo "  test           - 모든 테스트 실행"
	@echo "  test-watch     - 테스트 watch 모드"
	@echo "  e2e            - E2E 테스트 실행"
	@echo "  e2e-local      - E2E 테스트 완전 자동화 로컬 모드 (프로세스 정리+백엔드 시작+테스트+정리)"
	@echo "  e2e-cloud      - 클라우드 환경에서 E2E 테스트 실행 (서버리스용)"
	@echo "  e2e-serverless - CDK 배포 후 서버리스 환경에서 E2E 테스트"
	@echo "  e2e-ui         - E2E 테스트 UI 모드"
	@echo "  e2e-debug      - E2E 테스트 디버그 모드"
	@echo "  load-test-local - 로컬 부하 테스트"
	@echo "  api-test       - API 테스트 실행"
	@echo ""
	@echo "🔧 코드 품질:"
	@echo "  lint           - 린터 실행"
	@echo "  lint-fix       - 린터 자동 수정"
	@echo "  fmt            - 코드 포맷팅"
	@echo ""
	@echo "🗄️ 데이터베이스:"
	@echo "  migrate        - 데이터베이스 마이그레이션"
	@echo "  seed-db        - 테스트 데이터 삽입"
	@echo "  db-reset       - 데이터베이스 초기화"
	@echo ""
	@echo "📦 빌드 및 의존성:"
	@echo "  build          - 프로덕션 이미지 빌드"
	@echo "  frontend-build - 프론트엔드만 빌드"
	@echo "  backend-build  - 백엔드만 빌드"
	@echo "  deps           - 의존성 설치"
	@echo "  check-deps     - 의존성 확인"
	@echo ""
	@echo "🧹 정리:"
	@echo "  clean          - 컨테이너와 이미지 정리"
	@echo "  reset-env      - 전체 환경 초기화"
	@echo ""
	@echo "☁️ 배포 및 모니터링:"
	@echo "  deploy-initial - 초기 인프라 배포 (로컬 전용)"
	@echo "  deploy-serverless - 서버리스 Lambda 함수 배포"
	@echo "  deploy-infra   - 인프라만 배포 (ECS, DynamoDB, ALB)"
	@echo "  deploy-check   - 배포 상태 확인"
	@echo "  deploy-logs    - 워크플로우 로그 확인"
	@echo "  deploy-logs-failed - 실패한 배포만"
	@echo "  deploy-debug   - 배포 디버깅"
	@echo "  verify-all     - 전체 시스템 검증"
	@echo ""
	@echo "💡 자세한 사용법: make <command> 또는 CLAUDE.md 참조"

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

# 배포 및 디버깅 명령어
deploy-check:
	@echo "🔍 배포 상태를 확인하는 중..."
	@command -v gh >/dev/null 2>&1 || (echo "❌ GitHub CLI를 찾을 수 없습니다. 설치하세요: https://cli.github.com/"; exit 1)
	@echo "📊 프론트엔드 배포 상태:"
	@gh run list --workflow="frontend-deploy.yml" --limit 3
	@echo ""
	@echo "📊 백엔드 배포 상태:"
	@gh run list --workflow="backend-deploy.yml" --limit 3

deploy-logs:
	@echo "📋 최근 배포 로그를 확인하는 중..."
	@bash scripts/get-workflow-logs.sh all --status

deploy-logs-frontend:
	@echo "📋 프론트엔드 배포 로그를 확인하는 중..."
	@bash scripts/get-workflow-logs.sh frontend

deploy-logs-backend:
	@echo "📋 백엔드 배포 로그를 확인하는 중..."
	@bash scripts/get-workflow-logs.sh backend

deploy-logs-failed:
	@echo "📋 실패한 배포 로그를 확인하는 중..."
	@bash scripts/get-workflow-logs.sh all --failed

deploy-logs-e2e:
	@echo "📋 E2E 테스트 로그를 확인하는 중..."
	@bash scripts/get-workflow-logs.sh e2e

deploy-logs-load:
	@echo "📋 부하 테스트 로그를 확인하는 중..."
	@bash scripts/get-workflow-logs.sh load

deploy-debug:
	@echo "🐛 배포 디버깅 정보를 수집하는 중..."
	@echo "📍 현재 브랜치: $$(git branch --show-current)"
	@echo "📍 마지막 커밋: $$(git log --oneline -1)"
	@echo "📍 워킹 디렉터리 상태:"
	@git status --porcelain | head -10
	@echo ""
	@echo "🔧 CDK 상태 확인:"
	@cd infra && npx cdk list 2>/dev/null || echo "CDK 스택 목록을 가져올 수 없습니다"
	@echo ""
	@echo "🌐 GitHub Pages 설정:"
	@gh api repos/vibe-coding-paradigm/Realworld-serverless-microservice/pages 2>/dev/null | \
		jq -r '.html_url // "GitHub Pages가 설정되지 않음"' || echo "GitHub Pages 정보를 가져올 수 없습니다"

# CDK 관련 명령어
cdk-deploy:
	@echo "🚀 CDK로 인프라를 배포하는 중..."
	@command -v npm >/dev/null 2>&1 || (echo "❌ npm을 찾을 수 없습니다"; exit 1)
	cd infra && npm install && npx cdk deploy --require-approval never

# 초기 배포 (로컬에서만 실행)
deploy-initial:
	@echo "🏗️  초기 인프라 배포를 시작합니다..."
	@echo "1️⃣  ECR 리포지토리 확인/생성 중..."
	@aws ecr describe-repositories --repository-names conduit-backend --region ap-northeast-2 >/dev/null 2>&1 || \
		aws ecr create-repository --repository-name conduit-backend --region ap-northeast-2
	@echo "2️⃣  ECR 로그인 중..."
	@aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $$(aws sts get-caller-identity --query Account --output text).dkr.ecr.ap-northeast-2.amazonaws.com
	@echo "3️⃣  Docker 이미지 빌드 중 (AMD64)..."
	@cd backend && docker build --platform linux/amd64 -t $$(aws sts get-caller-identity --query Account --output text).dkr.ecr.ap-northeast-2.amazonaws.com/conduit-backend:latest .
	@echo "4️⃣  Docker 이미지 푸시 중..."
	@docker push $$(aws sts get-caller-identity --query Account --output text).dkr.ecr.ap-northeast-2.amazonaws.com/conduit-backend:latest
	@echo "5️⃣  CDK 인프라 배포 중..."
	@cd infra && npm install && npx cdk bootstrap --require-approval never && npx cdk deploy --require-approval never
	@echo "✅ 초기 배포가 완료되었습니다!"

cdk-destroy:
	@echo "🗑️  CDK 인프라를 삭제하는 중..."
	cd infra && npx cdk destroy --force

cdk-diff:
	@echo "📋 CDK 변경사항을 확인하는 중..."
	cd infra && npx cdk diff

cdk-synth:
	@echo "📄 CDK 템플릿을 생성하는 중..."
	cd infra && npx cdk synth

# GitHub Actions 디버깅
gh-login-check:
	@echo "🔐 GitHub CLI 로그인 상태 확인:"
	@gh auth status || echo "❌ GitHub CLI에 로그인하지 않았습니다. 'gh auth login' 명령어를 실행하세요"

gh-workflow-run:
	@echo "▶️  워크플로우 수동 실행 가이드:"
	@echo ""
	@echo "⚠️  주의: 로컬에서 직접 워크플로우를 실행하지 마세요!"
	@echo "   환경 차이로 인한 문제가 발생할 수 있습니다."
	@echo ""
	@echo "✅ 권장 방법:"
	@echo "  1. 코드 변경 후 git push"
	@echo "  2. GitHub Actions가 자동으로 실행"
	@echo "  3. make deploy-logs로 상태 확인"
	@echo ""
	@echo "🔧 긴급한 경우에만 GitHub 웹에서 수동 실행:"
	@echo "  - 프론트엔드: https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/frontend-deploy.yml"
	@echo "  - 백엔드: https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/backend-deploy.yml"
	@echo "  - E2E 테스트: https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/e2e-tests.yml"

# 통합 디버깅 명령어
debug: deploy-debug gh-login-check
	@echo "🔍 전체 디버깅 정보 수집 완료"

# AWS 배포 검증
verify-deployment:
	@echo "🔍 AWS 배포 상태를 검증하는 중..."
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js를 찾을 수 없습니다"; exit 1)
	@if [ ! -d "infra/verify-deployment/node_modules" ]; then \
		echo "📦 검증 스크립트 의존성 설치 중..."; \
		cd infra/verify-deployment && npm install; \
	fi
	@cd infra/verify-deployment && node verify-deployment.js

verify-deployment-install:
	@echo "📦 검증 스크립트 의존성을 설치하는 중..."
	@command -v npm >/dev/null 2>&1 || (echo "❌ npm을 찾을 수 없습니다"; exit 1)
	cd infra/verify-deployment && npm install

# 빠른 배포 상태 확인
status: deploy-check health
	@echo "✅ 전체 시스템 상태 확인 완료"

# 완전한 검증 (배포 상태 + AWS 리소스 검증)
verify-all: deploy-check verify-deployment
	@echo "🎯 전체 배포 검증 완료"

# ============================================================================
# 개발 효율성 명령어
# ============================================================================

# 빠른 시작 - 프로젝트 전체 초기 설정
quick-start:
	@echo "🚀 프로젝트 전체 초기 설정을 시작합니다..."
	@echo "1️⃣ 의존성 확인 중..."
	@$(MAKE) check-deps
	@echo "2️⃣ 의존성 설치 중..."
	@$(MAKE) deps
	@echo "3️⃣ Git hooks 설치 중..."
	@$(MAKE) install-hooks
	@echo "4️⃣ 데이터베이스 마이그레이션 중..."
	@$(MAKE) migrate
	@echo "5️⃣ 개발 환경 시작 중..."
	@$(MAKE) dev-detach
	@echo "✅ 프로젝트 설정 완료!"
	@echo ""
	@echo "🎯 다음 단계:"
	@echo "  • 브라우저에서 http://localhost:3000 확인"
	@echo "  • API 상태: http://localhost:8080/health"
	@echo "  • 로그 확인: make dev-logs"
	@echo "  • 개발 중단: make dev-stop"

# 개발 환경 초기 설정
setup-dev:
	@echo "🛠️ 개발 환경 초기 설정 중..."
	@$(MAKE) check-deps
	@$(MAKE) deps
	@$(MAKE) install-hooks
	@$(MAKE) migrate
	@echo "✅ 개발 환경 설정 완료"

# Git hooks 설치
install-hooks:
	@echo "🔧 Git hooks 설치 중..."
	@npm run install-hooks

# 파일 변경 감지 및 자동 재시작
watch:
	@echo "👀 파일 변경 감지 모드 시작..."
	@echo "백엔드 파일 변경 시 자동 재시작됩니다"
	@cd backend && find . -name "*.go" | entr -r go run cmd/server/main.go

# 개별 서비스 개발 모드
frontend-dev:
	@echo "🎨 프론트엔드 개발 모드 시작..."
	@cd frontend && npm run dev

backend-dev:
	@echo "⚙️ 백엔드 개발 모드 시작..."
	@echo "🔑 JWT_SECRET 환경변수 설정 중..."
	@cd backend && JWT_SECRET="local-development-secret-key-$(shell date +%s)" go run cmd/server/main.go

# 개별 서비스 빌드
frontend-build:
	@echo "🔨 프론트엔드 빌드 중..."
	@cd frontend && npm run build

backend-build:
	@echo "🔨 백엔드 빌드 중..."
	@cd backend && go build -o bin/server cmd/server/main.go

# 테스트 watch 모드
test-watch:
	@echo "🧪 테스트 watch 모드 시작..."
	@echo "프론트엔드 테스트 watch 모드"
	@cd frontend && npm run test

# E2E 테스트 명령어들
e2e:
	@echo "🧪 E2E 테스트 실행 중..."
	@cd frontend && npm run test:e2e

e2e-local:
	@echo "🧪 E2E 테스트 로컬 모드 시작..."
	@echo "🧹 기존 8080 포트 프로세스 정리 중..."
	@lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || true
	@echo "🔄 잠시 기다리는 중 (포트 해제)..."
	@sleep 2
	@echo "🚀 JWT_SECRET과 함께 백엔드 서버 시작 중..."
	@cd backend && JWT_SECRET="local-dev-secret-$$(date +%s)" nohup go run cmd/server/main.go > /tmp/backend.log 2>&1 &
	@echo "⏳ 백엔드 서버가 준비될 때까지 대기 중..."
	@for i in $$(seq 1 30); do \
		if curl -f http://localhost:8080/health >/dev/null 2>&1; then \
			echo "✅ 백엔드 서버가 준비되었습니다 ($$i초)"; \
			break; \
		fi; \
		if [ $$i -eq 30 ]; then \
			echo "❌ 백엔드 서버 시작 실패"; \
			echo "📋 백엔드 로그:"; \
			cat /tmp/backend.log 2>/dev/null || echo "로그 파일을 찾을 수 없습니다"; \
			exit 1; \
		fi; \
		echo "대기 중... ($$i/30)"; \
		sleep 1; \
	done
	@echo "🎯 완전한 로컬 E2E 테스트 실행 중 (프론트엔드: localhost:3000, 백엔드: localhost:8080)..."
	@cd frontend && npm run test:e2e:local; \
	echo "🧹 E2E 테스트 완료 후 백엔드 프로세스 정리 중..."; \
	lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || true; \
	echo "✅ 로컬 E2E 테스트 완료 및 정리 완료"

e2e-local-cleanup:
	@echo "🧹 로컬 E2E 테스트 환경 정리 중..."
	@lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || true
	@echo "✅ 8080 포트 프로세스 정리 완료"

e2e-ui:
	@echo "🧪 E2E 테스트 UI 모드 시작..."
	@cd frontend && npx playwright test --ui

e2e-debug:
	@echo "🧪 E2E 테스트 디버그 모드 시작..."
	@cd frontend && npx playwright test --debug

# 클라우드 E2E 테스트 (서버리스 환경용)
e2e-cloud:
	@echo "☁️ 클라우드 E2E 테스트 시작..."
	@echo "🔍 GitHub CLI 인증 확인 중..."
	@gh auth status > /dev/null 2>&1 || (echo "❌ GitHub CLI 인증이 필요합니다. 'gh auth login' 실행하세요"; exit 1)
	@echo "📦 GitHub Variables 가져오는 중..."
	@set -e; \
	BACKEND_URL=$$(gh variable get BACKEND_URL 2>/dev/null || echo ""); \
	BACKEND_URL_ECS=$$(gh variable get BACKEND_URL_ECS 2>/dev/null || echo ""); \
	FRONTEND_URL=$$(gh variable get FRONTEND_URL 2>/dev/null || echo ""); \
	AWS_REGION=$$(gh variable get AWS_REGION 2>/dev/null || echo "ap-northeast-2"); \
	echo "🌐 GitHub Variables:"; \
	echo "  BACKEND_URL: $$BACKEND_URL"; \
	echo "  BACKEND_URL_ECS: $$BACKEND_URL_ECS"; \
	echo "  FRONTEND_URL: $$FRONTEND_URL"; \
	echo "  AWS_REGION: $$AWS_REGION"; \
	if [ -z "$$BACKEND_URL" ]; then \
		echo "⚠️  BACKEND_URL이 설정되지 않음, CDK에서 API URL 추출 시도..."; \
		API_URL=$$(make get-api-url); \
		if [ -z "$$API_URL" ]; then \
			echo "❌ API URL을 찾을 수 없습니다"; \
			exit 1; \
		fi; \
		BACKEND_URL="$$API_URL"; \
		echo "🔗 CDK에서 추출한 API URL: $$BACKEND_URL"; \
	fi; \
	echo "🧪 클라우드 환경에서 E2E 테스트 실행 중..."; \
	cd frontend && \
	PLAYWRIGHT_BASE_URL="$$FRONTEND_URL" \
	BACKEND_URL="$$BACKEND_URL" \
	BACKEND_URL_ECS="$$BACKEND_URL_ECS" \
	API_URL="$$BACKEND_URL" \
	VITE_API_URL="$$BACKEND_URL" \
	AWS_REGION="$$AWS_REGION" \
	npm run test:e2e
	@echo "✅ 클라우드 E2E 테스트 완료"

# 서버리스 배포 후 E2E 테스트 (CDK 배포 + 테스트)
e2e-serverless:
	@echo "🚀 서버리스 배포 및 E2E 테스트 시작..."
	@echo "📦 CDK 배포 중..."
	@cd infra && npx cdk deploy --require-approval never || (echo "❌ CDK 배포 실패"; exit 1)
	@echo "⏳ 배포 완료 대기 중..."
	@sleep 30
	@echo "🧪 배포된 서버리스 환경에서 E2E 테스트 실행..."
	@make e2e-cloud
	@echo "✅ 서버리스 배포 및 E2E 테스트 완료"

# API URL 추출 (CDK 출력에서)
get-api-url:
	@cd infra && aws cloudformation describe-stacks --stack-name ConduitStack --query 'Stacks[0].Outputs[?OutputKey==`AuthApiUrl`].OutputValue' --output text 2>/dev/null || echo ""

# 로컬 부하 테스트
load-test-local:
	@echo "📊 로컬 부하 테스트 실행 중..."
	@command -v k6 >/dev/null 2>&1 || (echo "❌ k6를 찾을 수 없습니다. 설치하세요: brew install k6"; exit 1)
	@cd load-tests && k6 run basic-load-test.js

# API 테스트
api-test:
	@echo "🔌 API 테스트 실행 중..."
	@echo "백엔드 헬스 체크..."
	@curl -f http://localhost:8080/health || echo "❌ 백엔드가 실행되지 않았습니다"
	@echo ""
	@echo "API 엔드포인트 테스트..."
	@curl -s http://localhost:8080/api/articles | jq . || echo "❌ API 응답 오류"

# 린터 자동 수정
lint-fix:
	@echo "🔧 린터 자동 수정 실행 중..."
	@cd backend && golangci-lint run --fix || echo "⚠️ 백엔드 lint-fix 완료 (일부 수동 수정 필요할 수 있음)"
	@cd frontend && npm run lint -- --fix || echo "⚠️ 프론트엔드 lint-fix 완료"

# 테스트 데이터 삽입
seed-db:
	@echo "🌱 테스트 데이터 삽입 중..."
	@echo "TODO: 테스트 데이터 생성 스크립트 구현 필요"
	@echo "현재는 수동으로 API를 통해 데이터를 생성하세요"

# 전체 환경 초기화
reset-env:
	@echo "🔄 전체 환경 초기화 중..."
	@echo "⚠️ 모든 데이터가 삭제됩니다. 계속하시겠습니까? (Ctrl+C로 취소)"
	@read -p "Enter를 눌러 계속..."
	@$(MAKE) clean
	@$(MAKE) db-reset
	@echo "✅ 환경 초기화 완료"

# 개발 상태 확인
dev-status:
	@echo "📊 개발 환경 상태 확인..."
	@echo ""
	@echo "🐳 Docker 컨테이너 상태:"
	@docker-compose ps || echo "Docker Compose가 실행되지 않음"
	@echo ""
	@echo "🌐 서비스 상태:"
	@curl -s http://localhost:8080/health > /dev/null && echo "✅ 백엔드: 실행 중" || echo "❌ 백엔드: 중단됨"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ 프론트엔드: 실행 중" || echo "❌ 프론트엔드: 중단됨"
	@echo ""
	@echo "📁 프로젝트 구조:"
	@ls -la | head -10

# 로그 통합 보기
logs-all:
	@echo "📋 통합 로그 보기..."
	@echo "Ctrl+C로 종료"
	@docker-compose logs -f

# 개발 디버그 정보
dev-debug:
	@echo "🐛 개발 디버그 정보 수집 중..."
	@echo ""
	@echo "📍 시스템 정보:"
	@echo "OS: $$(uname -s)"
	@echo "아키텍처: $$(uname -m)"
	@echo ""
	@echo "📍 도구 버전:"
	@docker --version 2>/dev/null || echo "Docker: 설치되지 않음"
	@node --version 2>/dev/null || echo "Node.js: 설치되지 않음"
	@go version 2>/dev/null || echo "Go: 설치되지 않음"
	@gh --version 2>/dev/null || echo "GitHub CLI: 설치되지 않음"
	@echo ""
	@echo "📍 포트 사용 상황:"
	@lsof -i :3000 2>/dev/null | head -2 || echo "포트 3000: 사용되지 않음"
	@lsof -i :8080 2>/dev/null | head -2 || echo "포트 8080: 사용되지 않음"
	@echo ""
	@echo "📍 파일 권한:"
	@ls -la scripts/ | head -5

# 자주 사용하는 명령어 조합
start: dev-detach
	@echo "🚀 개발 서버가 백그라운드에서 시작되었습니다"
	@echo "로그 확인: make dev-logs"

stop: dev-stop
	@echo "🛑 개발 서버가 중단되었습니다"

restart: stop start
	@echo "🔄 개발 서버가 재시작되었습니다"

# 서버리스 배포 명령어들
deploy-serverless:
	@echo "🚀 서버리스 Lambda 함수 배포 중..."
	@echo "GitHub Actions 워크플로우를 실행합니다: serverless-deploy.yml"
	@gh workflow run serverless-deploy.yml
	@echo "✅ 서버리스 배포 워크플로우가 시작되었습니다"
	@echo "📊 상태 확인: make deploy-logs-serverless"

deploy-serverless-auth:
	@echo "🔐 인증 서비스만 배포 중..."
	@gh workflow run serverless-deploy.yml -f service=auth
	@echo "✅ 인증 서비스 배포 워크플로우가 시작되었습니다"

deploy-serverless-articles:
	@echo "📝 게시글 서비스만 배포 중..."
	@gh workflow run serverless-deploy.yml -f service=articles
	@echo "✅ 게시글 서비스 배포 워크플로우가 시작되었습니다"

deploy-serverless-comments:
	@echo "💬 댓글 서비스만 배포 중..."
	@gh workflow run serverless-deploy.yml -f service=comments
	@echo "✅ 댓글 서비스 배포 워크플로우가 시작되었습니다"

deploy-infra:
	@echo "🏗️  인프라 배포 중..."
	@echo "GitHub Actions 워크플로우를 실행합니다: infra-deploy.yml"
	@gh workflow run infra-deploy.yml
	@echo "✅ 인프라 배포 워크플로우가 시작되었습니다"
	@echo "📊 상태 확인: make deploy-logs-infra"

deploy-infra-destroy:
	@echo "🗑️  인프라 삭제 중..."
	@echo "⚠️  이 작업은 모든 AWS 리소스를 삭제합니다!"
	@read -p "계속하시겠습니까? (y/N): " confirm && [ "$$confirm" = "y" ]
	@gh workflow run infra-deploy.yml -f destroy=true
	@echo "✅ 인프라 삭제 워크플로우가 시작되었습니다"

# 서버리스 관련 로그 확인
deploy-logs-serverless:
	@echo "📋 서버리스 배포 로그 확인 중..."
	@bash scripts/get-workflow-logs.sh "Deploy Serverless Lambda Functions" 5

deploy-logs-infra:
	@echo "📋 인프라 배포 로그 확인 중..."
	@bash scripts/get-workflow-logs.sh "Deploy Infrastructure" 5

# 서버리스 API URL 확인
get-serverless-api-url:
	@echo "🔗 서버리스 API URL 확인 중..."
	@cd infra && aws cloudformation describe-stacks --stack-name ConduitStack --query 'Stacks[0].Outputs[?OutputKey==`CombinedApiUrl`].OutputValue' --output text 2>/dev/null || echo "서버리스 스택이 배포되지 않았습니다"

# 서버리스 상태 확인
verify-serverless:
	@echo "🔍 서버리스 배포 상태 확인 중..."
	@echo ""
	@echo "📊 Lambda 함수 상태:"
	@aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `conduit-`)].{Name:FunctionName,Runtime:Runtime,State:State,LastModified:LastModified}' --output table || echo "AWS CLI 설정 또는 Lambda 함수를 확인하세요"
	@echo ""
	@echo "📊 DynamoDB 테이블 상태:"
	@aws dynamodb list-tables --query 'TableNames[?starts_with(@, `conduit-`)]' --output table || echo "DynamoDB 테이블을 확인하세요"
	@echo ""
	@echo "🔗 API Gateway URL:"
	@make get-serverless-api-url
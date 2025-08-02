.PHONY: help dev build test clean lint fmt migrate deps install-deps check-deps deploy debug deploy-check deploy-logs deploy-logs-frontend deploy-logs-backend deploy-logs-failed deploy-logs-e2e deploy-logs-load deploy-debug cdk-deploy deploy-initial cdk-destroy cdk-diff cdk-synth gh-login-check gh-workflow-run status verify-deployment verify-deployment-install verify-all

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
	@echo ""
	@echo "배포 및 디버깅:"
	@echo "  deploy-initial - 초기 인프라 전체 배포 (로컬 전용)"
	@echo "  deploy-check   - 배포 상태 확인"
	@echo "  deploy-logs    - 모든 워크플로우 로그 상태 확인"
	@echo "  deploy-logs-frontend - 프론트엔드 배포 로그"
	@echo "  deploy-logs-backend  - 백엔드 배포 로그"
	@echo "  deploy-logs-failed   - 실패한 배포 로그만"
	@echo "  deploy-logs-e2e      - E2E 테스트 로그"
	@echo "  deploy-logs-load     - 부하 테스트 로그"
	@echo "  deploy-debug   - 배포 디버깅 정보"
	@echo "  gh-workflow-run      - 워크플로우 수동 실행 가이드 (조회 전용)"
	@echo "  cdk-deploy     - CDK로 인프라 배포"
	@echo "  cdk-destroy    - CDK 인프라 삭제"
	@echo "  cdk-diff       - CDK 변경사항 확인"
	@echo "  verify-deployment - AWS 배포 상태 검증"
	@echo "  verify-all     - 완전한 배포 검증"

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
	@if [ ! -d "scripts/node_modules" ]; then \
		echo "📦 검증 스크립트 의존성 설치 중..."; \
		cd scripts && npm install; \
	fi
	@cd scripts && node verify-deployment.js

verify-deployment-install:
	@echo "📦 검증 스크립트 의존성을 설치하는 중..."
	@command -v npm >/dev/null 2>&1 || (echo "❌ npm을 찾을 수 없습니다"; exit 1)
	cd scripts && npm install

# 빠른 배포 상태 확인
status: deploy-check health
	@echo "✅ 전체 시스템 상태 확인 완료"

# 완전한 검증 (배포 상태 + AWS 리소스 검증)
verify-all: deploy-check verify-deployment
	@echo "🎯 전체 배포 검증 완료"
# RealWorld 앱 구현 - 바이브 코딩 & 아르민 로나허 기술 스택

## 🚀 워크플로우 상태
[![Frontend Deploy](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/frontend-deploy.yml)
[![Backend Deploy](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/backend-deploy.yml/badge.svg)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/backend-deploy.yml)
[![E2E Tests](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/e2e-tests.yml)
[![Load Tests](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/load-tests.yml/badge.svg)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/load-tests.yml)

## 📊 프로젝트 정보
[![Issues](https://img.shields.io/github/issues/vibe-coding-paradigm/Realworld-serverless-microservice)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/vibe-coding-paradigm/Realworld-serverless-microservice)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/vibe-coding-paradigm/Realworld-serverless-microservice)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/commits/main)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🛠️ 기술 스택
[![Go Version](https://img.shields.io/badge/Go-1.23.6-00ADD8?logo=go&logoColor=white)](https://golang.org/)
[![React Version](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite Version](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![AWS](https://img.shields.io/badge/AWS-ECS/Fargate-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

> **"The mother of all demo apps"** — 실제 운영 가능한 수준의 Medium.com 클론 구축

## 🔄 모노리식에서 서버리스 마이크로서비스로의 마이그레이션

이 프로젝트는 **단일 애플리케이션(모노리식)에서 서버리스 마이크로서비스 아키텍처로의 실전 마이그레이션 과정**을 보여줍니다. Fast Campus의 "바이브 코딩 패러다임" 강의를 위한 실습 프로젝트로, 점진적 마이그레이션 전략과 현대적인 클라우드 아키텍처 구현 방법을 학습할 수 있습니다.

### 📈 마이그레이션 단계

1. **Phase 1: 모노리식 애플리케이션** ✅ **완료**
   - Go 백엔드 + React 프론트엔드 구현
   - SQLite 데이터베이스 + JWT 인증 시스템
   - Docker 컨테이너 기반 개발 환경
   - GitHub Pages 프론트엔드 배포
   - **Phase 1.8**: 통합 테스트 및 MVP 검증 완료 ✅

2. **Phase 2: 클라우드 전환** ✅ **완료**
   - AWS ECS/Fargate로 컨테이너 마이그레이션 ✅
   - Application Load Balancer (ALB) 배포 ✅
   - AWS CDK 인프라 코드 작성 ✅
   - CI/CD 파이프라인 구축 ✅
   - E2E/부하 테스트 인프라 구축 ✅

3. **Phase 3: 마이크로서비스 분해** 📋 **계획됨**
   - 도메인별 서비스 분리 (Auth, Articles, Comments)
   - API Gateway + Lambda 함수
   - DynamoDB/RDS 데이터 분산

4. **Phase 4: 서버리스 최적화** 📋 **계획됨**
   - 완전한 서버리스 아키텍처
   - 이벤트 기반 아키텍처
   - 모니터링 및 관찰성 구현

## 📋 프로젝트 개요

이 프로젝트는 [RealWorld](https://github.com/gothinkster/realworld) 사양을 사용하여 **바이브 코딩(Vibe Coding) 기법**과 **아르민 로나허(Armin Ronacher)의 추천 기술 스택**을 활용해 실제 운영 가능한 소셜 블로깅 플랫폼을 구현하는 것을 목표로 합니다.

### 🎯 핵심 목표

- **바이브 코딩 실습**: 직관적이고 빠른 개발 방법론 적용
- **검증된 기술 스택**: 아르민 로나허가 추천하는 실용적인 기술들 활용
- **실제 운영 가능한 애플리케이션**: 단순한 토이 프로젝트가 아닌 실제 서비스 수준의 구현
- **학습 중심**: 복잡한 기능보다는 핵심 기능에 집중하여 빠른 MVP 개발

## 🚀 데모 및 참고 자료

### 배포된 애플리케이션
- **[현재 프론트엔드 데모](https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/)** - GitHub Pages 배포된 React 앱
- **백엔드 API** - AWS ECS/Fargate 배포 완료 (ALB: `conduit-alb-*.ap-northeast-2.elb.amazonaws.com`)
- **인증 시스템** - JWT 기반 완전 기능 인증 (회원가입, 로그인, 보호된 API 접근)
- **데이터베이스** - 영구 데이터 저장 (SQLite 파일 시스템)

### 참고 자료
- **[RealWorld 공식 데모](https://demo.realworld.io/)** - 완성된 애플리케이션 미리보기
- **[RealWorld 프로젝트](https://github.com/gothinkster/realworld)** - 공식 사양 및 다양한 구현체들
- **[API 문서](https://realworld-docs.netlify.app/)** - 구현해야 할 API 명세

### 마이그레이션 문서
- **[마이그레이션 PRD](docs/migration/PRD.md)** - 마이그레이션 제품 요구사항 문서
- **[GitHub 이슈 관리 가이드](docs/migration/github-issue-guidelines.md)** - 프로젝트 이슈 관리 방법론
- **[GitHub Variables 설정 가이드](docs/github-variables.md)** - CI/CD 환경 변수 설정 방법
- **[작업 진행 상황](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/issues)** - GitHub Issues로 추적되는 실시간 진행 상황

## 🔧 해결된 주요 이슈

### Phase 2 완료 과정에서 해결된 인프라 문제들:

1. **JWT_SECRET 환경변수 누락** ✅ 해결됨
   - **문제**: 사용자 등록 시 JWT 토큰 생성 실패 (500 에러)
   - **해결**: ECS Task Definition에 JWT_SECRET 환경변수 추가
   - **검증**: 완전한 인증 플로우 E2E 테스트 통과

2. **Application Load Balancer 배포 누락** ✅ 해결됨
   - **문제**: 로드 밸런서 미배포로 인한 부하 분산 불가
   - **해결**: CDK를 통한 ALB 완전 배포 및 설정
   - **현재 상태**: `conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com` 운영 중

3. **EFS 마운팅 권한 문제** ✅ 해결됨
   - **문제**: EFS 파일 시스템 마운팅 실패로 새 태스크 배포 불가
   - **해결**: MVP를 위해 로컬 스토리지 사용으로 우회, IAM 권한 수정
   - **상태**: 현재 태스크 정의 리비전 6 안정 운영

4. **동적 URL 관리 시스템 구축** ✅ 완료됨
   - **문제**: 하드코딩된 URL로 인한 환경별 배포 어려움
   - **해결**: ALB DNS 자동 감지 및 GitHub Pages URL 동적 생성
   - **기능**: CI/CD 워크플로우에서 배포 환경별 URL 자동 설정

### 테스트 검증 완료 상태:
- **인증 시스템**: 회원가입, 로그인, JWT 토큰 검증 완료 ✅
- **게시글 CRUD**: 생성, 조회, 수정, 삭제 모든 기능 검증 완료 ✅
- **댓글 시스템**: 댓글 작성, 삭제, 인증 확인 완료 ✅
- **크로스 브라우저**: Chrome, Firefox, Safari 모든 브라우저 테스트 통과 ✅
- **부하 테스트**: 기본 부하, 인증 부하, 성능 기준점 측정 완료 ✅

## 🛠️ 기술 스택

### 백엔드 (아르민 로나허 추천 스택)
- **언어**: Go 1.23.6
- **웹 프레임워크**: net/http 표준 라이브러리 + 커스텀 미들웨어
- **데이터베이스**: SQLite (순수 SQL 사용, ORM 없음)
- **인증**: JWT 토큰 기반
- **빌드 도구**: Makefile

### 프론트엔드
- **프레임워크**: React 19 + TypeScript
- **스타일링**: Tailwind CSS 4 + shadcn/ui
- **라우팅**: React Router v7
- **상태 관리**: Context API + React Query (@tanstack/react-query)
- **빌드 도구**: Vite 7

### 배포 및 인프라
- **컨테이너**: Docker & Docker Compose
- **클라우드**: AWS (ECS/Fargate, ECR, EFS, VPC)
- **인프라 코드**: AWS CDK (TypeScript)
- **CI/CD**: GitHub Actions

### 개발 도구
- **AI 도구**: Claude Code
- **테스트**: Go 표준 테스트 + Vitest 3 + Playwright 1.54 (E2E) + k6 (Load Testing)
- **린터**: golangci-lint, ESLint 9
- **타입 체크**: TypeScript 5.8

## ✨ 주요 기능

이 애플리케이션은 Medium.com과 유사한 소셜 블로깅 플랫폼으로 다음 기능들을 포함합니다:

- **🔐 인증 시스템**: 회원가입, 로그인, JWT 기반 인증
- **📝 게시글 관리**: CRUD 작업, 마크다운 지원
- **💬 댓글 시스템**: 게시글별 댓글 작성 및 관리
- **👥 소셜 기능**: 사용자 팔로우, 게시글 좋아요
- **🏷️ 태그 시스템**: 게시글 분류 및 필터링
- **📱 반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 🧪 테스트 인프라

이 프로젝트는 **포괄적인 테스트 인프라**를 포함하여 코드 품질과 성능을 보장합니다:

### End-to-End (E2E) 테스트
- **프레임워크**: Playwright
- **브라우저 지원**: Chrome, Firefox, Safari
- **테스트 시나리오**: 35개 이상의 E2E 테스트 케이스
- **자동 실행**: 프론트엔드/백엔드 배포 시 자동 실행

#### 주요 E2E 테스트 케이스
- **인증 플로우**: 회원가입, 로그인, JWT 토큰 검증
- **게시글 관리**: CRUD 작업, 마크다운 렌더링, 슬러그 생성
- **댓글 시스템**: 댓글 작성, 삭제, 인증 확인
- **사용자 프로필**: 프로필 페이지, 팔로우 기능

### 부하 테스트 (Load Testing)
- **도구**: k6
- **테스트 패턴**: 기본 부하, 스트레스, 지속 부하 테스트
- **성능 기준**: 95% 요청 < 2초, 에러율 < 1%
- **실행 방식**: 수동 트리거 (GitHub Actions)

#### 부하 테스트 시나리오
- **Performance Baseline**: 단일 사용자 성능 기준점
- **Basic Load Test**: 5-20명 동시 사용자
- **Authentication Load**: 인증 시스템 부하 테스트
- **Spike Test**: 급격한 트래픽 증가 시뮬레이션

### CI/CD 통합 테스트
- **자동 E2E 테스트**: 모든 배포에서 자동 실행
- **수동 부하 테스트**: 필요시 GitHub Actions에서 수동 실행
- **동적 URL 관리**: 배포된 환경의 URL 자동 감지
- **크로스 브라우저 테스트**: Chrome, Firefox, Safari 동시 테스트

### 테스트 명령어
```bash
# 로컬 E2E 테스트
cd frontend && npm run test:e2e

# E2E 테스트 UI 모드
cd frontend && npm run test:e2e:ui

# 특정 브라우저 E2E 테스트
cd frontend && npx playwright test --project=chromium

# 백엔드 전용 E2E 테스트
cd frontend && npm run test:e2e:backend

# 부하 테스트 (로컬)
cd load-tests && k6 run basic-load-test.js

# 성능 기준점 테스트
cd load-tests && k6 run performance-baseline.js

# 인증 부하 테스트
cd load-tests && k6 run auth-load-test.js
```

## 📁 프로젝트 구조

```
.
├── backend/                 # Go 백엔드 애플리케이션
│   ├── cmd/                # 실행 가능한 애플리케이션
│   ├── internal/           # 내부 패키지 (Clean Architecture)
│   ├── migrations/         # 데이터베이스 마이그레이션
│   └── Dockerfile          # 백엔드 컨테이너 이미지
├── frontend/               # React 프론트엔드 애플리케이션
│   ├── src/               # 소스 코드
│   ├── public/            # 정적 파일
│   ├── e2e/               # Playwright E2E 테스트
│   └── dist/              # 빌드 결과물
├── infra/                  # AWS CDK 인프라 코드
│   ├── lib/               # CDK 스택 정의
│   └── bin/               # CDK 앱 진입점
├── docs/                  # 프로젝트 문서
│   ├── migration/         # 마이그레이션 관련 문서
│   ├── PRD.md            # 제품 요구사항 문서
│   └── tasks.md          # 구현 작업 목록
├── load-tests/             # k6 부하 테스트 스크립트
├── .github/workflows/      # GitHub Actions CI/CD
├── docker-compose*.yml     # 로컬 개발 환경
├── Makefile              # 빌드, 개발, 배포 명령어
└── README.md             # 프로젝트 개요 (이 파일)
```

## 🚀 시작하기

### 사전 요구사항

#### 로컬 개발
- **Go 1.23.6+**
- **Node.js 18+**
- **Docker & Docker Compose**
- **Make**

#### AWS 배포 (선택사항)
- **AWS CLI**
- **GitHub CLI (gh)**
- **AWS 계정 및 IAM 권한**

### 로컬 개발 환경 설정

1. **저장소 클론**
   ```bash
   git clone https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice.git
   cd Realworld-serverless-microservice
   ```

2. **개발 환경 시작**
   ```bash
   make dev
   ```

3. **애플리케이션 접속**
   - 프론트엔드: http://localhost:3000
   - 백엔드 API: http://localhost:8080

### AWS 클라우드 배포

#### 초기 배포 (최초 1회만 실행)

⚠️ **중요**: 초기 배포는 **반드시 로컬**에서 실행해야 합니다. GitHub Actions 토큰 만료 문제로 인해 클라우드에서 초기 배포가 실패할 수 있습니다.

1. **AWS 계정 설정**
   ```bash
   # AWS CLI 설정
   aws configure
   
   # 또는 환경변수로 설정
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_DEFAULT_REGION=ap-northeast-2
   ```

2. **초기 인프라 배포**
   ```bash
   # 전체 초기 배포 (ECR + Docker 빌드 + CDK 배포)
   make deploy-initial
   ```

#### 이후 업데이트 (GitHub Actions 자동 배포)

초기 배포 완료 후에는 GitHub Actions가 자동으로 처리합니다:

- **백엔드 코드 변경**: `backend/` 디렉터리 변경 시 자동 배포
- **수동 배포**: GitHub Actions에서 "Update Backend Service" 워크플로우 실행

## 🚨 배포 정책 (중요)

### GitHub Actions 전용 배포
**모든 배포는 반드시 GitHub Actions를 통해서만 진행됩니다. 수동 배포 명령어 사용은 금지됩니다.**

#### ❌ 금지된 명령어:
```bash
npx cdk deploy          # CDK 직접 배포 금지
make cdk-deploy         # Makefile CDK 배포 금지  
aws cloudformation deploy  # CloudFormation 직접 배포 금지
```

#### ✅ 올바른 배포 프로세스:
1. **코드 변경** → 로컬에서 개발 및 테스트
2. **커밋 & 푸시** → `git commit` 후 `git push origin main`
3. **GitHub Actions** → 워크플로우가 자동으로 배포 처리
4. **검증** → 워크플로우 검증 스크립트로 배포 확인

#### 배포 규칙을 지키는 이유:
- **일관성**: 모든 배포가 동일한 프로세스를 따름
- **안전성**: 표준화된 환경에서 검증된 배포
- **추적성**: 모든 배포 이력이 GitHub Actions에 기록
- **팀 협업**: 모든 팀원이 동일한 방식으로 배포

### 주요 명령어

#### 개발 및 테스트
```bash
# 개발 서버 시작
make dev

# 테스트 실행
make test

# E2E 테스트 실행 (Playwright)
cd frontend && npm run test:e2e

# 부하 테스트 실행 (k6)
cd load-tests && k6 run basic-load-test.js

# 프로덕션 빌드
make build

# 데이터베이스 마이그레이션
make migrate

# 코드 포맷팅
make fmt

# 린터 실행
make lint
```

#### Git Hooks 설정
프로젝트에는 커밋 전 자동으로 E2E 테스트를 실행하는 pre-commit hook이 포함되어 있습니다.

```bash
# Git hooks 설치 (최초 1회)
npm run install-hooks

# 또는 직접 실행
bash scripts/install-hooks.sh

# 로컬 환경에서 E2E 테스트 실행
npm run test:e2e:local
```

**Git Hooks 기능:**
- 🔍 커밋 전 자동으로 E2E 테스트 실행
- 🚀 백엔드가 실행되지 않은 경우 자동으로 docker-compose 시작
- ❌ 테스트 실패 시 커밋 차단
- 💡 `git commit --no-verify`로 hook 임시 우회 가능

#### 배포 및 디버깅
```bash
# 🏗️ 초기 인프라 배포 (최초 1회, 로컬에서만)
make deploy-initial

# 배포 상태 확인
make deploy-check

# 배포 로그 확인
make deploy-logs

# 전체 디버깅 정보
make debug

# CDK 인프라 배포 (개별)
make cdk-deploy

# CDK 인프라 삭제
make cdk-destroy

# 시스템 상태 종합 확인
make status
```

#### GitHub Actions 관련
```bash
# GitHub CLI 로그인 확인
make gh-login-check

# 워크플로우 수동 실행 안내
make gh-workflow-run
```

## 📚 프로젝트 문서

프로젝트의 상세한 설계, 요구사항, 마이그레이션 계획 등은 [`docs/`](./docs/) 폴더에서 확인할 수 있습니다.

### 🎯 핵심 문서
- **[📋 제품 요구사항 문서 (PRD)](./docs/PRD.md)** - RealWorld 애플리케이션의 핵심 기능 및 요구사항
- **[🏗️ 시스템 설계 문서](./docs/design.md)** - 아키텍처, 데이터베이스, API 설계
- **[🔄 마이그레이션 PRD](./docs/migration/PRD.md)** - 모노리식에서 서버리스로의 전환 계획

### 🛠️ 개발 및 운영 가이드
- **[📝 GitHub 이슈 관리 가이드](./docs/migration/github-issue-guidelines.md)** - 프로젝트 이슈 관리 방법론
- **[⚙️ GitHub Actions 환경변수 가이드](./docs/github-variables.md)** - CI/CD 파이프라인 설정
- **[🔧 트러블슈팅 가이드](./docs/troubleshooting.md)** - 실제 문제들과 해결책
- **[📖 튜토리얼](./docs/tutorial.md)** - 프로젝트 시작하기 가이드

### 📋 작업 계획
- **[✅ 전체 작업 목록](./docs/tasks.md)** - 프로젝트 구현 계획
- **[🎯 마이그레이션 작업](./docs/migration/tasks.md)** - 단계별 마이그레이션 체크리스트
- **[🎬 Phase 1 데모 시나리오](./docs/phase1-demo-scenario.md)** - 주요 기능 사용 예시

> 💡 **전체 문서 목록과 사용 가이드는 [docs/README.md](./docs/README.md)에서 확인하세요!**

## 📚 학습 리소스

### 바이브 코딩 관련
- **직관적 개발**: 복잡한 설계보다는 직관적이고 빠른 구현에 집중
- **점진적 개선**: 완벽한 설계보다는 동작하는 코드를 먼저 만들고 개선

### 아르민 로나허의 철학
- **단순함 우선**: 가장 단순한 작동 방식을 선택
- **표준 라이브러리 활용**: 외부 의존성 최소화
- **실용적 접근**: 이론적 완벽함보다는 실제 동작하는 코드

## 📋 구현 계획

상세한 구현 계획은 [docs/tasks.md](docs/tasks.md)에서 확인할 수 있습니다.

1. **프로젝트 설정 및 기본 구조**
2. **백엔드 MVP 구현**
3. **프론트엔드 MVP 구현**
4. **통합 및 테스트**

## 🤝 기여하기

이 프로젝트는 학습 목적으로 만들어졌으며, **체계적인 이슈 관리**를 통해 진행됩니다. 기여를 원하시는 분은:

1. **[GitHub Issues](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/issues)**를 통해 논의해주세요
2. **[이슈 관리 가이드라인](docs/migration/github-issue-guidelines.md)**을 숙지해주세요
3. 포크 후 기능 브랜치를 생성해주세요
4. 변경사항은 증거와 함께 이슈에 업데이트해주세요
5. 풀 리퀘스트를 제출해주세요

### 📊 프로젝트 추적

- **[GitHub Issues](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/issues)** - 모든 작업이 이슈로 추적됩니다
- **[GitHub Actions](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions)** - CI/CD 파이프라인 상태 확인
- **[GitHub Pages 배포](https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/)** - 자동 배포된 프론트엔드

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)를 따릅니다.

## 🔗 관련 링크

- **[RealWorld 프로젝트](https://github.com/gothinkster/realworld)**
- **[RealWorld 명세](https://realworld-docs.netlify.app/)**
- **[아르민 로나허 블로그](https://lucumr.pocoo.org/)**
- **[바이브 코딩 리소스](https://github.com/vibe-coding-paradigm)**

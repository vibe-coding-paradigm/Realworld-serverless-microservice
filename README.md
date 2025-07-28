# RealWorld 앱 구현 - 바이브 코딩 & 아르민 로나허 기술 스택

[![Frontend Deploy](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/frontend-deploy.yml)
[![Backend Deploy](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/backend-deploy-cdk.yml/badge.svg)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions/workflows/backend-deploy-cdk.yml)
[![Issues](https://img.shields.io/github/issues/vibe-coding-paradigm/Realworld-serverless-microservice)](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/issues)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **"The mother of all demo apps"** — 실제 운영 가능한 수준의 Medium.com 클론 구축

## 🔄 모노리식에서 서버리스 마이크로서비스로의 마이그레이션

이 프로젝트는 **단일 애플리케이션(모노리식)에서 서버리스 마이크로서비스 아키텍처로의 실전 마이그레이션 과정**을 보여줍니다. Fast Campus의 "바이브 코딩 패러다임" 강의를 위한 실습 프로젝트로, 점진적 마이그레이션 전략과 현대적인 클라우드 아키텍처 구현 방법을 학습할 수 있습니다.

### 📈 마이그레이션 단계

1. **Phase 1: 모노리식 애플리케이션** ✅ **완료**
   - Go 백엔드 + React 프론트엔드 구현
   - SQLite 데이터베이스
   - Docker 컨테이너 기반 개발 환경
   - GitHub Pages 프론트엔드 배포

2. **Phase 2: 클라우드 전환** 🔄 **진행 중**
   - AWS ECS/Fargate로 컨테이너 마이그레이션
   - AWS CDK 인프라 코드 작성
   - CI/CD 파이프라인 구축

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
- **백엔드 API** - AWS ECS/Fargate 배포 (Phase 2 진행 중)

### 참고 자료
- **[RealWorld 공식 데모](https://demo.realworld.io/)** - 완성된 애플리케이션 미리보기
- **[RealWorld 프로젝트](https://github.com/gothinkster/realworld)** - 공식 사양 및 다양한 구현체들
- **[API 문서](https://realworld-docs.netlify.app/)** - 구현해야 할 API 명세

### 마이그레이션 문서
- **[마이그레이션 PRD](docs/migration/PRD.md)** - 마이그레이션 제품 요구사항 문서
- **[GitHub 이슈 관리 가이드](docs/migration/github-issue-guidelines.md)** - 프로젝트 이슈 관리 방법론
- **[작업 진행 상황](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/issues)** - GitHub Issues로 추적되는 실시간 진행 상황

## 🛠️ 기술 스택

### 백엔드 (아르민 로나허 추천 스택)
- **언어**: Go 1.21+
- **웹 프레임워크**: net/http 표준 라이브러리 + 커스텀 미들웨어
- **데이터베이스**: SQLite (순수 SQL 사용, ORM 없음)
- **인증**: JWT 토큰 기반
- **빌드 도구**: Makefile

### 프론트엔드
- **프레임워크**: React 18+ with TypeScript
- **스타일링**: Tailwind CSS + shadcn/ui
- **라우팅**: React Router
- **상태 관리**: Context API + React Query
- **빌드 도구**: Vite

### 배포 및 인프라
- **컨테이너**: Docker & Docker Compose
- **클라우드**: AWS (ECS/Fargate, ECR, EFS, VPC)
- **인프라 코드**: AWS CDK (TypeScript)
- **CI/CD**: GitHub Actions

### 개발 도구
- **AI 도구**: Claude Code
- **테스트**: Go 표준 테스트 + Vitest
- **린터**: golangci-lint, ESLint

## ✨ 주요 기능

이 애플리케이션은 Medium.com과 유사한 소셜 블로깅 플랫폼으로 다음 기능들을 포함합니다:

- **🔐 인증 시스템**: 회원가입, 로그인, JWT 기반 인증
- **📝 게시글 관리**: CRUD 작업, 마크다운 지원
- **💬 댓글 시스템**: 게시글별 댓글 작성 및 관리
- **👥 소셜 기능**: 사용자 팔로우, 게시글 좋아요
- **🏷️ 태그 시스템**: 게시글 분류 및 필터링
- **📱 반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

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
│   └── dist/              # 빌드 결과물
├── infra/                  # AWS CDK 인프라 코드
│   ├── lib/               # CDK 스택 정의
│   └── bin/               # CDK 앱 진입점
├── docs/                  # 프로젝트 문서
│   ├── migration/         # 마이그레이션 관련 문서
│   ├── PRD.md            # 제품 요구사항 문서
│   └── tasks.md          # 구현 작업 목록
├── .github/workflows/      # GitHub Actions CI/CD
├── docker-compose*.yml     # 로컬 개발 환경
├── Makefile              # 빌드, 개발, 배포 명령어
└── README.md             # 프로젝트 개요 (이 파일)
```

## 🚀 시작하기

### 사전 요구사항

#### 로컬 개발
- **Go 1.21+**
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

# 프로덕션 빌드
make build

# 데이터베이스 마이그레이션
make migrate

# 코드 포맷팅
make fmt

# 린터 실행
make lint
```

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

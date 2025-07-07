# RealWorld 앱 구현 - 바이브 코딩 & 아르민 로나허 기술 스택

> **"The mother of all demo apps"** — 실제 운영 가능한 수준의 Medium.com 클론 구축

## 📋 프로젝트 개요

이 프로젝트는 [RealWorld](https://github.com/gothinkster/realworld) 사양을 사용하여 **바이브 코딩(Vibe Coding) 기법**과 **아르민 로나허(Armin Ronacher)의 추천 기술 스택**을 활용해 실제 운영 가능한 소셜 블로깅 플랫폼을 구현하는 것을 목표로 합니다.

### 🎯 핵심 목표

- **바이브 코딩 실습**: 직관적이고 빠른 개발 방법론 적용
- **검증된 기술 스택**: 아르민 로나허가 추천하는 실용적인 기술들 활용
- **실제 운영 가능한 애플리케이션**: 단순한 토이 프로젝트가 아닌 실제 서비스 수준의 구현
- **학습 중심**: 복잡한 기능보다는 핵심 기능에 집중하여 빠른 MVP 개발

## 🚀 데모 및 참고 자료

- **[라이브 데모](https://demo.realworld.io/)** - 완성된 애플리케이션 미리보기
- **[RealWorld 프로젝트](https://github.com/gothinkster/realworld)** - 공식 사양 및 다양한 구현체들
- **[API 문서](https://realworld-docs.netlify.app/)** - 구현해야 할 API 명세

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

### 개발 도구
- **컨테이너**: Docker & Docker Compose
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
│   ├── internal/           # 내부 패키지
│   └── migrations/         # 데이터베이스 마이그레이션
├── frontend/               # React 프론트엔드 애플리케이션
│   ├── src/               # 소스 코드
│   └── public/            # 정적 파일
├── docs/                  # 프로젝트 문서
│   ├── PRD.md            # 제품 요구사항 문서
│   └── tasks.md          # 구현 작업 목록
├── docker-compose.yml     # 로컬 개발 환경
├── Makefile              # 빌드 및 개발 명령어
└── README.md             # 프로젝트 개요 (이 파일)
```

## 🚀 시작하기

### 사전 요구사항

- **Go 1.21+**
- **Node.js 18+**
- **Docker & Docker Compose**
- **Make**

### 로컬 개발 환경 설정

1. **저장소 클론**
   ```bash
   git clone https://github.com/vibe-coding-paradigm/Realworld-build-from-prd.git
   cd Realworld-build-from-prd
   ```

2. **개발 환경 시작**
   ```bash
   make dev
   ```

3. **애플리케이션 접속**
   - 프론트엔드: http://localhost:3000
   - 백엔드 API: http://localhost:8080

### 주요 명령어

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

이 프로젝트는 학습 목적으로 만들어졌습니다. 기여를 원하시는 분은:

1. 이슈를 통해 논의해주세요
2. 포크 후 기능 브랜치를 생성해주세요
3. 풀 리퀘스트를 제출해주세요

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)를 따릅니다.

## 🔗 관련 링크

- **[RealWorld 프로젝트](https://github.com/gothinkster/realworld)**
- **[RealWorld 명세](https://realworld-docs.netlify.app/)**
- **[아르민 로나허 블로그](https://lucumr.pocoo.org/)**
- **[바이브 코딩 리소스](https://github.com/vibe-coding-paradigm)**

# Backend - Go REST API Server

RealWorld 애플리케이션의 백엔드 구현체입니다. Go 표준 라이브러리와 Clean Architecture 패턴을 사용하여 구현되었습니다.

## 📋 개요

- **언어**: Go 1.21+
- **아키텍처**: Clean Architecture (Domain → Application → Infrastructure → Presentation)
- **데이터베이스**: SQLite with raw SQL queries (ORM 사용 안함)
- **인증**: JWT 토큰 기반 stateless 인증
- **API 규격**: [RealWorld API Specification](https://realworld-docs.netlify.app/) 준수

## 🏗️ 프로젝트 구조

```
backend/
├── cmd/                     # 실행 가능한 애플리케이션
│   ├── server/              # HTTP 서버 메인 엔트리포인트
│   │   └── main.go
│   └── migrate/             # 데이터베이스 마이그레이션 실행기
│       └── main.go
├── internal/                # 내부 패키지 (Clean Architecture)
│   ├── handlers/            # HTTP 핸들러 (Presentation Layer)
│   │   ├── user_handler.go      # 사용자 인증 및 프로필 API
│   │   ├── article_handler.go   # 게시글 CRUD API
│   │   ├── comment_handler.go   # 댓글 CRUD API
│   │   └── middleware.go        # JWT 인증, CORS, 로깅 미들웨어
│   ├── models/              # 도메인 모델 (Domain Layer)
│   │   ├── user.go             # 사용자 도메인 모델
│   │   ├── article.go          # 게시글 도메인 모델
│   │   └── comment.go          # 댓글 도메인 모델
│   ├── db/                  # 데이터베이스 접근 (Infrastructure Layer)
│   │   ├── connection.go        # SQLite 연결 관리
│   │   ├── user_repository.go   # 사용자 데이터 접근
│   │   ├── article_repository.go # 게시글 데이터 접근
│   │   └── comment_repository.go # 댓글 데이터 접근
│   ├── auth/                # 인증 서비스 (Application Layer)
│   │   └── jwt.go              # JWT 토큰 생성/검증
│   └── utils/               # 유틸리티
│       └── slug.go             # URL 슬러그 생성
├── migrations/              # 데이터베이스 스키마 마이그레이션
│   └── 001_initial_schema.sql
├── Dockerfile              # 프로덕션 컨테이너 이미지
├── Dockerfile.dev          # 개발용 컨테이너 이미지
├── go.mod                  # Go 모듈 의존성
└── go.sum                  # Go 모듈 체크섬
```

## 🚀 시작하기

### 사전 요구사항
- Go 1.21+ 설치
- SQLite3 (보통 Go SQLite 드라이버에 포함됨)

### 로컬 개발 환경 설정

1. **의존성 설치**
   ```bash
   cd backend
   go mod download
   ```

2. **데이터베이스 마이그레이션**
   ```bash
   go run cmd/migrate/main.go
   ```

3. **개발 서버 시작**
   ```bash
   go run cmd/server/main.go
   ```

4. **서버 확인**
   ```bash
   curl http://localhost:8080/health
   # 응답: {"status": "ok"}
   ```

### Docker를 사용한 실행

```bash
# 개발용 이미지 빌드 및 실행
docker build -f Dockerfile.dev -t conduit-backend:dev .
docker run -p 8080:8080 conduit-backend:dev

# 프로덕션 이미지 빌드 및 실행
docker build -t conduit-backend:prod .
docker run -p 8080:8080 conduit-backend:prod
```

## 🧪 테스트

### 단위 테스트 실행
```bash
# 모든 테스트 실행
go test ./...

# 특정 패키지 테스트
go test ./internal/handlers
go test ./internal/auth
go test ./internal/utils

# 테스트 커버리지 확인
go test -cover ./...
```

### 테스트 작성 가이드
- **TDD 접근법**: 테스트 먼저 작성, 구현 후 리팩토링
- **테스트 파일 위치**: `*_test.go` 파일로 같은 패키지에 위치
- **테스트 데이터베이스**: `:memory:` SQLite 사용으로 격리

## 🔧 API 엔드포인트

### 인증 API
```
POST   /api/users/login     # 로그인
POST   /api/users           # 회원가입
GET    /api/user            # 현재 사용자 정보 (JWT 필요)
PUT    /api/user            # 사용자 정보 업데이트 (JWT 필요)
```

### 프로필 API
```
GET    /api/profiles/:username        # 사용자 프로필 조회
POST   /api/profiles/:username/follow # 사용자 팔로우 (JWT 필요)
DELETE /api/profiles/:username/follow # 사용자 언팔로우 (JWT 필요)
```

### 게시글 API
```
GET    /api/articles              # 게시글 목록 조회
GET    /api/articles/feed         # 팔로우한 사용자 게시글 (JWT 필요)
GET    /api/articles/:slug        # 특정 게시글 조회
POST   /api/articles              # 게시글 작성 (JWT 필요)
PUT    /api/articles/:slug        # 게시글 수정 (JWT 필요)
DELETE /api/articles/:slug        # 게시글 삭제 (JWT 필요)
```

### 댓글 API
```
GET    /api/articles/:slug/comments        # 댓글 목록 조회
POST   /api/articles/:slug/comments        # 댓글 작성 (JWT 필요)
DELETE /api/articles/:slug/comments/:id    # 댓글 삭제 (JWT 필요)
```

### 기타 API
```
GET    /health                   # 헬스 체크
GET    /api/tags                 # 태그 목록 조회
```

## 🔐 인증 시스템

### JWT 토큰 구조
- **헤더**: `Authorization: Token <JWT_TOKEN>`
- **페이로드**: 사용자 ID, 이메일, 만료 시간
- **서명**: HMAC SHA256 알고리즘 사용

### 환경 변수
```bash
JWT_SECRET=your-super-secure-jwt-secret-key  # JWT 서명용 비밀키
DATABASE_URL=./data/conduit.db               # SQLite 데이터베이스 파일 경로
PORT=8080                                    # 서버 포트
```

## 🏛️ Clean Architecture 구현

### 계층별 역할
1. **Domain Layer** (`models/`): 비즈니스 엔티티 및 규칙
2. **Application Layer** (`auth/`): 애플리케이션 서비스 로직
3. **Infrastructure Layer** (`db/`): 외부 시스템 연동 (데이터베이스)
4. **Presentation Layer** (`handlers/`): HTTP 요청/응답 처리

### 의존성 규칙
- 외부 계층은 내부 계층에만 의존
- 내부 계층은 외부 계층을 모름
- 인터페이스를 통한 의존성 역전

## 📊 데이터베이스 스키마

### 주요 테이블
- **users**: 사용자 정보 (id, email, username, bio, image, password_hash)
- **articles**: 게시글 (id, slug, title, description, body, created_at, updated_at, author_id)
- **comments**: 댓글 (id, body, created_at, article_id, author_id)
- **follows**: 팔로우 관계 (follower_id, following_id)
- **article_tags**: 게시글-태그 관계 (article_id, tag_name)

### 마이그레이션
```bash
# 새 마이그레이션 실행
go run cmd/migrate/main.go

# 데이터베이스 리셋 (개발용)
rm -f data/conduit.db && go run cmd/migrate/main.go
```

## 🚀 배포

### AWS ECS/Fargate 배포
현재 백엔드는 AWS ECS/Fargate에 배포되어 있습니다:
- **ALB**: conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com
- **컨테이너**: Docker 이미지로 패키징
- **자동 배포**: GitHub Actions를 통한 CI/CD

### 배포 명령어
```bash
# 로컬에서 초기 배포 (최초 1회만)
make deploy-initial

# 이후 업데이트는 GitHub Actions가 자동 처리
git push origin main
```

## 🐛 디버깅 및 로그

### 로그 확인
```bash
# 로컬 개발 시
go run cmd/server/main.go

# Docker 컨테이너 로그
docker logs <container_id>

# AWS ECS 로그
aws logs tail /ecs/conduit-backend --follow
```

### 일반적인 문제 해결
1. **포트 이미 사용 중**: `lsof -ti:8080 | xargs kill -9`
2. **데이터베이스 락**: SQLite 파일 권한 확인
3. **JWT 토큰 오류**: JWT_SECRET 환경변수 확인

## 📈 성능 최적화

### 데이터베이스 최적화
- 인덱스 활용 (username, email, slug, created_at)
- 준비된 명령문 사용 (SQL 인젝션 방지)
- 커넥션 풀링 (database/sql 패키지)

### 메모리 관리
- 구조체 포인터 사용으로 메모리 효율성
- 가비지 컬렉션 최적화
- 불필요한 메모리 할당 최소화

## 🤝 기여하기

### 코드 스타일
- `gofmt`로 코드 포맷팅
- `golangci-lint`로 린팅
- Go 표준 라이브러리 우선 사용
- 명확한 함수/변수명 사용

### 커밋 가이드라인
- 기능별 작은 단위 커밋
- 커밋 메시지는 한국어로 명확하게
- 테스트 포함된 상태로 커밋

---

**참고 자료**:
- [RealWorld API 사양](https://realworld-docs.netlify.app/)
- [Go 공식 문서](https://golang.org/doc/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
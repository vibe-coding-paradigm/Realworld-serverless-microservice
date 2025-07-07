# RealWorld 앱 설계 문서 (Design Document)

> **Conduit** - 바이브 코딩 & 아르민 로나허 기술 스택을 활용한 소셜 블로깅 플랫폼

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처 설계](#아키텍처-설계)
3. [데이터베이스 설계](#데이터베이스-설계)
4. [API 설계](#api-설계)
5. [프론트엔드 설계](#프론트엔드-설계)
6. [보안 설계](#보안-설계)
7. [배포 아키텍처](#배포-아키텍처)

## 1. 시스템 개요

### 1.1 프로젝트 비전

**"바이브 코딩으로 빠르게 구축하는 실제 운영 가능한 소셜 블로깅 플랫폼"**

- **바이브 코딩**: 직관적이고 빠른 개발을 통한 MVP 우선 접근
- **아르민 로나허 철학**: 단순함과 실용성을 중시하는 기술 스택
- **RealWorld 표준**: 검증된 사양을 통한 일관성 있는 구현

### 1.2 핵심 설계 원칙

```mermaid
mindmap
  root((설계 원칙))
    바이브 코딩
      직관적 구현
      빠른 프로토타이핑
      점진적 개선
    아르민 로나허 철학
      단순함 우선
      표준 라이브러리 활용
      실용적 접근
    RealWorld 표준
      검증된 API 스펙
      일관된 기능 구현
      커뮤니티 호환성
```

### 1.3 시스템 목표

- **개발 속도**: 빠른 MVP 개발 및 배포
- **유지보수성**: 단순하고 이해하기 쉬운 코드 구조
- **확장성**: 기능 추가가 용이한 모듈형 아키텍처
- **안정성**: 검증된 기술 스택과 패턴 활용

## 2. 아키텍처 설계

### 2.1 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "클라이언트"
        A[React SPA<br/>TypeScript + Tailwind]
    end
    
    subgraph "웹 계층"
        B[HTTP Router<br/>net/http + 미들웨어]
        C[CORS 미들웨어]
        D[JWT 인증 미들웨어]
        E[로깅 미들웨어]
    end
    
    subgraph "비즈니스 로직"
        F[사용자 서비스]
        G[게시글 서비스]
        H[댓글 서비스]
        I[인증 서비스]
    end
    
    subgraph "데이터 계층"
        J[SQLite DB<br/>순수 SQL]
        K[파일 시스템<br/>이미지 저장]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    F --> J
    G --> J
    H --> J
    I --> J
    G --> K
```

### 2.2 백엔드 아키텍처 (Clean Architecture 기반)

```mermaid
graph LR
    subgraph "Presentation Layer"
        A[HTTP Handlers]
        B[Middleware]
        C[Request/Response Models]
    end
    
    subgraph "Application Layer"
        D[Use Cases]
        E[DTOs]
        F[Validators]
    end
    
    subgraph "Domain Layer"
        G[Entities]
        H[Business Rules]
        I[Interfaces]
    end
    
    subgraph "Infrastructure Layer"
        J[SQLite Repository]
        K[JWT Service]
        L[File Storage]
    end
    
    A --> D
    B --> A
    D --> G
    D --> I
    I --> J
    I --> K
    I --> L
```

### 2.3 프론트엔드 아키텍처

```mermaid
graph TB
    subgraph "Presentation"
        A[Pages]
        B[Components]
        C[UI Components<br/>shadcn/ui]
    end
    
    subgraph "State Management"
        D[Context API<br/>인증 상태]
        E[React Query<br/>서버 상태]
        F[Local State<br/>컴포넌트 상태]
    end
    
    subgraph "Services"
        G[API Client]
        H[Auth Service]
        I[Storage Service]
    end
    
    subgraph "Routing"
        J[React Router]
        K[Protected Routes]
        L[Route Guards]
    end
    
    A --> B
    B --> C
    A --> D
    A --> E
    B --> F
    G --> H
    G --> I
    J --> K
    K --> L
    A --> J
```

## 3. 데이터베이스 설계

### 3.1 ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string username UK
        string password_hash
        string bio
        string image
        datetime created_at
        datetime updated_at
    }
    
    ARTICLE {
        string id PK
        string slug UK
        string title
        string description
        string body
        string author_id FK
        datetime created_at
        datetime updated_at
    }
    
    COMMENT {
        string id PK
        string body
        string author_id FK
        string article_id FK
        datetime created_at
        datetime updated_at
    }
    
    TAG {
        string id PK
        string name UK
        datetime created_at
    }
    
    ARTICLE_TAG {
        string article_id FK
        string tag_id FK
    }
    
    FOLLOW {
        string follower_id FK
        string following_id FK
        datetime created_at
    }
    
    FAVORITE {
        string user_id FK
        string article_id FK
        datetime created_at
    }
    
    USER ||--o{ ARTICLE : writes
    USER ||--o{ COMMENT : writes
    USER ||--o{ FOLLOW : follows
    USER ||--o{ FOLLOW : followed_by
    USER ||--o{ FAVORITE : favorites
    ARTICLE ||--o{ COMMENT : has
    ARTICLE ||--o{ ARTICLE_TAG : tagged_with
    ARTICLE ||--o{ FAVORITE : favorited_by
    TAG ||--o{ ARTICLE_TAG : used_in
```

### 3.2 테이블 스키마

#### Users 테이블
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    image TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Articles 테이블
```sql
CREATE TABLE articles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    body TEXT NOT NULL,
    author_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Comments 테이블
```sql
CREATE TABLE comments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    body TEXT NOT NULL,
    author_id TEXT NOT NULL,
    article_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
```

### 3.3 인덱스 전략

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_comments_article_id ON comments(article_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_article_id ON favorites(article_id);
```

## 4. API 설계

### 4.1 API 아키텍처

```mermaid
graph TB
    subgraph "API Gateway"
        A[HTTP Router]
        B[Rate Limiting]
        C[Request Logging]
    end
    
    subgraph "Authentication"
        D[JWT Middleware]
        E[Optional Auth]
        F[Required Auth]
    end
    
    subgraph "Business Logic"
        G[User Handlers]
        H[Article Handlers]
        I[Comment Handlers]
        J[Profile Handlers]
    end
    
    subgraph "Data Access"
        K[Repository Pattern]
        L[Transaction Management]
        M[Error Handling]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    E --> G
    F --> H
    F --> I
    E --> J
    G --> K
    H --> K
    I --> K
    J --> K
    K --> L
    L --> M
```

### 4.2 API 엔드포인트 설계

#### 인증 관련 API
```
POST   /api/users           # 회원가입
POST   /api/users/login     # 로그인
GET    /api/user            # 현재 사용자 정보 조회 (인증 필요)
PUT    /api/user            # 사용자 정보 수정 (인증 필요)
```

#### 프로필 관련 API
```
GET    /api/profiles/:username        # 프로필 조회
POST   /api/profiles/:username/follow # 팔로우 (인증 필요)
DELETE /api/profiles/:username/follow # 언팔로우 (인증 필요)
```

#### 게시글 관련 API
```
GET    /api/articles                  # 게시글 목록 조회
GET    /api/articles/feed             # 피드 조회 (인증 필요)
GET    /api/articles/:slug            # 게시글 상세 조회
POST   /api/articles                  # 게시글 작성 (인증 필요)
PUT    /api/articles/:slug            # 게시글 수정 (인증 필요)
DELETE /api/articles/:slug            # 게시글 삭제 (인증 필요)
POST   /api/articles/:slug/favorite   # 즐겨찾기 추가 (인증 필요)
DELETE /api/articles/:slug/favorite   # 즐겨찾기 제거 (인증 필요)
```

#### 댓글 관련 API
```
GET    /api/articles/:slug/comments    # 댓글 목록 조회
POST   /api/articles/:slug/comments    # 댓글 작성 (인증 필요)
DELETE /api/articles/:slug/comments/:id # 댓글 삭제 (인증 필요)
```

#### 태그 관련 API
```
GET    /api/tags                      # 태그 목록 조회
```

### 4.3 API 응답 형식

#### 성공 응답
```json
{
  "user": {
    "email": "jake@jake.jake",
    "token": "jwt.token.here",
    "username": "jake",
    "bio": "I work at statefarm",
    "image": null
  }
}
```

#### 에러 응답
```json
{
  "errors": {
    "body": [
      "can't be empty"
    ]
  }
}
```

## 5. 프론트엔드 설계

### 5.1 컴포넌트 아키텍처

```mermaid
graph TB
    subgraph "App Component"
        A[App.tsx]
        B[Router Setup]
        C[Global Providers]
    end
    
    subgraph "Layout Components"
        D[Header]
        E[Footer]
        F[Sidebar]
    end
    
    subgraph "Page Components"
        G[HomePage]
        H[LoginPage]
        I[ArticlePage]
        J[ProfilePage]
        K[EditorPage]
    end
    
    subgraph "Feature Components"
        L[ArticleList]
        M[ArticleCard]
        N[CommentSection]
        O[UserProfile]
    end
    
    subgraph "UI Components"
        P[Button]
        Q[Input]
        R[Modal]
        S[Spinner]
    end
    
    A --> B
    A --> C
    C --> D
    D --> G
    G --> L
    L --> M
    I --> N
    J --> O
    M --> P
    N --> Q
    O --> R
    L --> S
```

### 5.2 상태 관리 설계

```mermaid
graph LR
    subgraph "Global State"
        A[Auth Context]
        B[Theme Context]
    end
    
    subgraph "Server State"
        C[React Query]
        D[Articles Cache]
        E[User Cache]
        F[Comments Cache]
    end
    
    subgraph "Local State"
        G[Form State]
        H[UI State]
        I[Component State]
    end
    
    A --> G
    C --> D
    C --> E
    C --> F
    D --> H
    E --> H
    F --> H
    G --> I
    H --> I
```

### 5.3 라우팅 설계

```mermaid
graph TB
    A["Home (/)"] --> B["Login (/login)"]
    A --> C["Register (/register)"]
    A --> D["Article Detail (/article/:slug)"]
    A --> E["Profile (/profile/:username)"]
    A --> F["Editor (/editor)"]
    A --> G["Edit Article (/editor/:slug)"]
    A --> H["Settings (/settings)"]
    
    subgraph "Protected Routes"
        F
        G
        H
    end
    
    subgraph "Public Routes"
        B
        C
        D
        E
    end
```

## 6. 보안 설계

### 6.1 보안 아키텍처

```mermaid
graph TB
    subgraph "Frontend Security"
        A[XSS Protection]
        B[CSRF Protection]
        C[Input Validation]
    end
    
    subgraph "API Security"
        D[JWT Authentication]
        E[CORS Configuration]
        F[Rate Limiting]
    end
    
    subgraph "Data Security"
        G[Password Hashing]
        H[SQL Injection Prevention]
        I[Data Validation]
    end
    
    subgraph "Infrastructure Security"
        J[HTTPS Enforcement]
        K[Security Headers]
        L[Container Security]
    end
    
    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
    G --> J
    H --> K
    I --> L
```

### 6.2 인증 흐름

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant D as Database
    
    C->>A: POST /api/users/login
    A->>D: 사용자 인증 확인
    D-->>A: 사용자 정보 반환
    A->>A: JWT 토큰 생성
    A-->>C: JWT 토큰 반환
    
    Note over C: 토큰을 로컬스토리지에 저장
    
    C->>A: GET /api/articles (with JWT)
    A->>A: JWT 토큰 검증
    A->>D: 데이터 조회
    D-->>A: 데이터 반환
    A-->>C: 응답 데이터
```

### 6.3 보안 구현 사항

#### JWT 설정
```go
type Claims struct {
    UserID string `json:"user_id"`
    Email  string `json:"email"`
    jwt.RegisteredClaims
}

// JWT 토큰 생성
func GenerateToken(userID, email string) (string, error) {
    claims := Claims{
        UserID: userID,
        Email:  email,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
```

#### 비밀번호 해싱
```go
import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

## 7. 배포 아키텍처

### 7.1 개발 환경 아키텍처

```mermaid
graph TB
    subgraph "Local Development"
        A[Docker Compose]
        B[Frontend Container<br/>React Dev Server]
        C[Backend Container<br/>Go Application]
        D[Database<br/>SQLite File]
    end
    
    subgraph "Development Tools"
        E[Hot Reload]
        F[Live Logging]
        G[Database GUI]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    C --> F
    D --> G
```

### 7.2 프로덕션 배포 아키텍처

```mermaid
graph TB
    subgraph "Load Balancer"
        A[Nginx/Traefik]
    end
    
    subgraph "Application Layer"
        B[Frontend Container<br/>Static Files]
        C[Backend Container<br/>Go Binary]
    end
    
    subgraph "Data Layer"
        D[SQLite Database<br/>Persistent Volume]
        E[File Storage<br/>Static Assets]
    end
    
    subgraph "Monitoring"
        F[Logs Aggregation]
        G[Health Checks]
        H[Metrics Collection]
    end
    
    A --> B
    A --> C
    C --> D
    C --> E
    B --> F
    C --> F
    D --> G
    C --> H
```

### 7.3 Docker 구성

#### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - REACT_APP_API_URL=http://localhost:8080/api

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    volumes:
      - ./backend:/app
      - ./data:/data
    environment:
      - DATABASE_URL=/data/conduit.db
      - JWT_SECRET=your-secret-key
    depends_on:
      - db

  db:
    image: alpine:latest
    volumes:
      - ./data:/data
    command: sh -c "touch /data/conduit.db && tail -f /dev/null"
```

### 7.4 Makefile 명령어

```makefile
.PHONY: dev build test clean

# 개발 환경 시작
dev:
	docker-compose up --build

# 프로덕션 빌드
build:
	docker-compose -f docker-compose.prod.yml build

# 테스트 실행
test:
	cd backend && go test ./...
	cd frontend && npm test

# 데이터베이스 마이그레이션
migrate:
	cd backend && go run cmd/migrate/main.go

# 코드 포맷팅
fmt:
	cd backend && go fmt ./...
	cd frontend && npm run format

# 린터 실행
lint:
	cd backend && golangci-lint run
	cd frontend && npm run lint

# 환경 정리
clean:
	docker-compose down -v
	docker system prune -f
```

## 📊 성능 고려사항

### 성능 목표
- **API 응답 시간**: 평균 500ms 이하
- **페이지 로딩 시간**: 3초 이하
- **동시 사용자**: 최소 100명 지원

### 최적화 전략
- **데이터베이스**: 적절한 인덱싱 및 쿼리 최적화
- **프론트엔드**: 코드 스플리팅 및 레이지 로딩
- **캐싱**: React Query를 통한 클라이언트 사이드 캐싱
- **압축**: Gzip 압축 및 정적 파일 최적화

이 설계 문서는 바이브 코딩 원칙에 따라 단순하면서도 확장 가능한 아키텍처를 제시하며, 아르민 로나허의 철학에 맞춰 실용적이고 유지보수 가능한 시스템을 구축하는 것을 목표로 합니다.
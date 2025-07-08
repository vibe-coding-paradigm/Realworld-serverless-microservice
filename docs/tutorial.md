# RealWorld 애플리케이션 개발 튜토리얼

## 개요

이 튜토리얼은 Claude Code를 활용하여 RealWorld 애플리케이션을 구축하는 과정에서 배운 핵심 개념과 실무적인 접근법을 정리한 것입니다. Vibe Coding 방법론과 Armin Ronacher의 실용적 접근법을 기반으로 한 실제 개발 경험을 통해 얻은 인사이트를 공유합니다.

## 목차

1. [프로젝트 구조화와 문서화](#1-프로젝트-구조화와-문서화)
2. [백엔드 개발 - Go로 견고한 API 구축](#2-백엔드-개발---go로-견고한-api-구축)
3. [프론트엔드 개발 - React와 TypeScript로 모던 UI 구축](#3-프론트엔드-개발---react와-typescript로-모던-ui-구축)
4. [이슈 기반 개발과 Git 워크플로우](#4-이슈-기반-개발과-git-워크플로우)
5. [테스트 주도 개발 (TDD) 실천](#5-테스트-주도-개발-tdd-실천)
6. [AI 코딩 도구 활용 전략](#6-ai-코딩-도구-활용-전략)

---

## 1. 프로젝트 구조화와 문서화

### 🎯 프롬프트 의도

**초기 프롬프트**: "docs/PRD.md 에 비즈니스 요구사항을 정리해주세요."

### 💡 핵심 학습 포인트

#### 1.1 문서 우선 접근법 (Documentation-First Approach)

**결과**: 프로젝트 시작 전에 포괄적인 PRD(Product Requirements Document) 작성

```markdown
# PRD 작성 시 포함해야 할 핵심 요소
- 프로젝트 개요 및 목적
- 핵심 기능 요구사항 (User Stories)
- 기술 스택 및 아키텍처 결정
- API 명세 및 데이터베이스 스키마
- 보안 및 성능 요구사항
- 테스트 전략
```

**교육적 의미**: 
- 개발 시작 전 명확한 요구사항 정의로 스코프 크리프 방지
- 기술적 의사결정의 근거 제공
- 팀원 간 공통 이해 기반 구축

#### 1.2 CLAUDE.md를 통한 AI 컨텍스트 관리

**결과**: AI 도구가 프로젝트의 컨텍스트를 이해할 수 있는 가이드 문서 작성

```markdown
# CLAUDE.md의 핵심 구조
## Project Overview
- 프로젝트 목적과 범위
- 핵심 원칙 (Vibe Coding, Armin Ronacher Philosophy)

## Architecture
- 백엔드: Go + SQLite + 표준 라이브러리
- 프론트엔드: React + TypeScript + Vite
- 개발 철학: 단순함 우선, 표준 라이브러리 선호

## Development Commands
- 자주 사용하는 명령어들
- 테스트 실행 방법
- 빌드 및 배포 과정
```

**⚠️ 주의사항**:
- CLAUDE.md는 프로젝트 진행에 따라 지속적으로 업데이트해야 함
- 너무 상세하면 AI가 혼란스러워할 수 있으므로 핵심 내용에 집중
- 개발 명령어는 실제 테스트된 것만 포함

---

## 2. 백엔드 개발 - Go로 견고한 API 구축

### 🎯 프롬프트 의도

**핵심 프롬프트**: "이슈 #4를 진행해줘. 티켓 내용뿐만 아니라 @docs/PRD.md와 @docs/design.md 문서를 참고해서 진행해."

### 💡 핵심 학습 포인트

#### 2.1 표준 라이브러리 우선 접근법

**결과**: Gin, Echo 등의 웹 프레임워크 대신 `net/http` 표준 라이브러리 사용

```go
// 미들웨어 체인 구성 예시
func main() {
    mux := http.NewServeMux()
    
    // 미들웨어 체인: CORS → Logging → Auth → Business Logic
    handler := middleware.CORS(
        middleware.Logging(
            middleware.Auth(mux),
        ),
    )
    
    server := &http.Server{
        Addr:    ":8080",
        Handler: handler,
    }
}
```

**교육적 의미**:
- 외부 의존성 최소화로 유지보수성 향상
- Go 표준 라이브러리의 강력함 이해
- 프레임워크 록인(lock-in) 방지

**⚠️ 주의사항**:
- 표준 라이브러리만으로는 복잡한 라우팅이 어려울 수 있음
- 보일러플레이트 코드가 증가할 수 있음
- 개발 속도와 단순함 사이의 균형점 찾기 필요

#### 2.2 SQLite + 순수 SQL 접근법

**결과**: ORM 대신 `database/sql`과 준비된 명령문(prepared statements) 사용

```go
// 사용자 조회 예시
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
    query := `
        SELECT id, username, email, password_hash, bio, image, created_at, updated_at 
        FROM users 
        WHERE email = ?
    `
    
    var user models.User
    err := r.db.QueryRow(query, email).Scan(
        &user.ID, &user.Username, &user.Email, &user.PasswordHash,
        &user.Bio, &user.Image, &user.CreatedAt, &user.UpdatedAt,
    )
    
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    
    return &user, nil
}
```

**교육적 의미**:
- SQL 실력 향상 및 데이터베이스 이해도 증진
- 성능 최적화 여지 확보
- 복잡한 쿼리 작성 시 더 나은 제어권

**⚠️ 주의사항**:
- SQL 인젝션 방지를 위한 Prepared Statement 필수 사용
- 수동 스캔 작업으로 인한 실수 가능성
- 마이그레이션 관리의 복잡성

#### 2.3 JWT 기반 무상태 인증

**결과**: 세션 대신 JWT 토큰을 활용한 stateless 인증 시스템

```go
func (a *Auth) GenerateToken(userID int64) (string, error) {
    claims := &Claims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(a.secretKey)
}
```

**교육적 의미**:
- 확장성 있는 인증 시스템 구축
- 클라이언트 사이드 토큰 관리 학습
- 보안 토큰의 생명주기 이해

**⚠️ 주의사항**:
- 비밀 키 관리의 중요성 (환경 변수 사용)
- 토큰 만료 처리 로직 필요
- 토큰 폐기(revocation) 전략 고려

---

## 3. 프론트엔드 개발 - React와 TypeScript로 모던 UI 구축

### 🎯 프롬프트 의도

**핵심 프롬프트**: "다음 #8 이슈를 진행해 - 프론트엔드 MVP 구현: 게시글 관련 페이지"

### 💡 핵심 학습 포인트

#### 3.1 React Query를 활용한 서버 상태 관리

**결과**: 복잡한 상태 관리 라이브러리 대신 React Query로 서버 상태 최적화

```typescript
// 커스텀 훅을 통한 데이터 페칭
export function useArticles(params: ArticlesParams = {}) {
  return useQuery<ArticlesResponse>({
    queryKey: articleKeys.list(params),
    queryFn: () => articlesAPI.getArticles(params),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

// 낙관적 업데이트를 통한 UX 향상
export function useCreateArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: articlesAPI.createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}
```

**교육적 의미**:
- 서버 상태와 클라이언트 상태의 분리
- 캐싱과 동기화 자동화
- API 호출 최적화와 사용자 경험 개선

**⚠️ 주의사항**:
- Query Key 설계의 중요성 (적절한 캐시 무효화를 위해)
- 너무 많은 쿼리로 인한 성능 저하 가능성
- 에러 처리와 로딩 상태 관리 필수

#### 3.2 컴포넌트 기반 아키텍처

**결과**: 재사용 가능한 컴포넌트와 커스텀 훅을 통한 모듈화

```typescript
// 재사용 가능한 ArticleCard 컴포넌트
interface ArticleCardProps {
  article: Article;
  showAuthor?: boolean;
  showPreview?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  showAuthor = true, 
  showPreview = true 
}) => {
  const { user } = useAuth();
  const isAuthor = user?.username === article.author.username;

  return (
    <div className="article-preview">
      {showAuthor && (
        <div className="article-meta">
          <AuthorInfo author={article.author} date={article.createdAt} />
          {isAuthor && <EditButton slug={article.slug} />}
        </div>
      )}
      
      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        {showPreview && <p>{article.description}</p>}
      </Link>
      
      <TagList tags={article.tagList} />
    </div>
  );
};
```

**교육적 의미**:
- Props 인터페이스를 통한 타입 안전성
- 조건부 렌더링을 통한 컴포넌트 유연성
- 책임 분리와 단일 책임 원칙 적용

#### 3.3 TypeScript 타입 안전성 확보

**결과**: API 응답과 컴포넌트 Props에 대한 강타이핑

```typescript
// API 응답 타입 정의
interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Author;
}

// API 클라이언트 타입 안전성
export const articlesAPI = {
  getArticles: async (params: ArticlesParams): Promise<ArticlesResponse> => {
    const response = await api.get<ArticlesResponse>('/articles', { params });
    return response.data;
  },
  
  createArticle: async (articleData: CreateArticleRequest): Promise<ArticleResponse> => {
    const response = await api.post<ArticleResponse>('/articles', { article: articleData });
    return response.data;
  },
};
```

**교육적 의미**:
- 런타임 에러 사전 방지
- 개발자 경험 향상 (IDE 지원)
- API 계약(Contract) 명확화

**⚠️ 주의사항**:
- 타입 정의 유지보수 부담
- any 타입 남용 금지
- 백엔드 API 변경 시 타입 동기화 필요

---

## 4. 이슈 기반 개발과 Git 워크플로우

### 🎯 프롬프트 의도

**핵심 프롬프트**: "/commit - 커밋 작업: git status와 git diff로 변경사항을 확인하고, 연관된 변경사항들만 모아서 순차적으로 스테이징과 커밋을 진행한다."

### 💡 핵심 학습 포인트

#### 4.1 이슈 중심 개발 프로세스

**결과**: GitHub Issues를 활용한 체계적인 작업 추적

```bash
# 이슈 기반 커밋 메시지 패턴
feat: 게시글 CRUD API 구현 (#4)

- POST /api/articles: 게시글 생성
- GET /api/articles: 게시글 목록 조회  
- GET /api/articles/:slug: 게시글 상세 조회
- PUT /api/articles/:slug: 게시글 수정
- DELETE /api/articles/:slug: 게시글 삭제

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**교육적 의미**:
- 작업 단위의 명확한 정의
- 진행 상황 추적 용이성
- 코드 리뷰와 협업 효율성 향상

#### 4.2 원자적 커밋(Atomic Commits) 전략

**결과**: 논리적 단위로 커밋을 분리하여 가독성과 롤백 용이성 확보

```bash
# 단계별 커밋 예시
1. feat: React Query 설정 및 의존성 추가 (#9)
2. feat: 게시글 및 댓글 React Query 훅 구현 (#9)  
3. feat: 게시글 관련 컴포넌트 구현 (#9)
4. feat: 게시글 상세 및 에디터 페이지 구현 (#9)
5. feat: 게시글 시스템 라우팅 및 홈페이지 통합 (#9)
```

**교육적 의미**:
- 변경사항의 논리적 그룹화
- 버그 추적과 롤백의 용이성
- 코드 히스토리의 가독성 향상

**⚠️ 주의사항**:
- 커밋하기 전에는 이슈를 닫지 말 것
- 관련 없는 변경사항을 한 커밋에 포함하지 말 것
- 커밋 메시지에 이슈 번호 반드시 포함

#### 4.3 GitHub CLI 활용 워크플로우

**결과**: MCP 대신 GitHub CLI를 활용한 이슈 관리 자동화

```bash
# 이슈 생성과 커밋 연동
gh issue create --title "Add authentication system" \
  --body "Implement JWT-based authentication with login/logout endpoints"

# 이슈 상태 업데이트
gh issue comment 4 --body "✅ 인증 API 구현 완료. 다음 단계: 프론트엔드 연동"

# 이슈 종료
gh issue close 4 --comment "모든 요구사항 구현 완료"
```

**교육적 의미**:
- 명령줄 기반 효율적인 이슈 관리
- 자동화된 워크플로우 구축
- 개발과 프로젝트 관리의 통합

---

## 5. 테스트 주도 개발 (TDD) 실천

### 🎯 프롬프트 의도

**핵심 프롬프트**: "백엔드 개발은 TDD 방식으로 진행해서 테스트를 먼저 작성하고 구현해줘."

### 💡 핵심 학습 포인트

#### 5.1 백엔드 TDD 사이클

**결과**: Red-Green-Refactor 사이클을 통한 견고한 API 구현

```go
// 1. Red: 실패하는 테스트 작성
func TestCreateUser_Success(t *testing.T) {
    repo := NewUserRepository(testDB)
    
    user := &models.User{
        Username: "testuser",
        Email:    "test@example.com",
        Password: "password123",
    }
    
    createdUser, err := repo.Create(user)
    
    assert.NoError(t, err)
    assert.NotZero(t, createdUser.ID)
    assert.Equal(t, user.Username, createdUser.Username)
}

// 2. Green: 테스트를 통과하는 최소 구현
func (r *UserRepository) Create(user *models.User) (*models.User, error) {
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }
    
    query := `
        INSERT INTO users (username, email, password_hash) 
        VALUES (?, ?, ?) 
        RETURNING id, created_at, updated_at
    `
    
    err = r.db.QueryRow(query, user.Username, user.Email, hashedPassword).Scan(
        &user.ID, &user.CreatedAt, &user.UpdatedAt,
    )
    
    return user, err
}

// 3. Refactor: 코드 개선 (중복 제거, 가독성 향상)
```

**교육적 의미**:
- 요구사항을 테스트로 명세화
- 최소 구현을 통한 과도한 설계 방지
- 리팩토링 시 안전망 확보

#### 5.2 테스트 격리와 데이터베이스 관리

**결과**: 각 테스트가 독립적으로 실행될 수 있는 환경 구축

```go
func setupTestDB(t *testing.T) *sql.DB {
    db, err := sql.Open("sqlite3", ":memory:")
    if err != nil {
        t.Fatal(err)
    }
    
    // 스키마 생성
    if err := runMigrations(db); err != nil {
        t.Fatal(err)
    }
    
    t.Cleanup(func() {
        db.Close()
    })
    
    return db
}

func TestUserRepository(t *testing.T) {
    db := setupTestDB(t)
    repo := NewUserRepository(db)
    
    t.Run("Create user success", func(t *testing.T) {
        // 각 서브테스트가 격리된 환경에서 실행
    })
}
```

**교육적 의미**:
- 테스트 간 의존성 제거
- 안정적이고 예측 가능한 테스트 실행
- 병렬 테스트 실행 가능

**⚠️ 주의사항**:
- 테스트 데이터베이스와 운영 데이터베이스 분리 필수
- 테스트 실행 시간 고려 (인메모리 DB 활용)
- 테스트 커버리지 목표 설정 (80% 이상 권장)

---

## 6. AI 코딩 도구 활용 전략

### 🎯 프롬프트 의도

**핵심 프롬프트**: "구현된 부분을 puppeteer mcp로 확인해봐."

### 💡 핵심 학습 포인트

#### 6.1 컨텍스트 기반 프롬프팅

**결과**: AI가 프로젝트 컨텍스트를 이해하고 일관된 응답을 제공

```markdown
# 효과적인 프롬프트 패턴

## 1. 컨텍스트 제공
"@docs/PRD.md와 @docs/design.md 문서를 참고해서 진행해."

## 2. 구체적인 요구사항
"이슈 #4를 진행해줘 - 게시글 CRUD API 구현"

## 3. 제약사항 명시  
"표준 라이브러리만 사용하고, ORM은 사용하지 마."

## 4. 검증 요청
"구현된 기능을 테스트해서 동작하는지 확인해줘."
```

**교육적 의미**:
- AI와 효과적으로 소통하는 방법 학습
- 프로젝트 일관성 유지
- 자동화된 품질 검증

#### 6.2 점진적 복잡성 증가 전략

**결과**: 간단한 기능부터 시작해서 점진적으로 복잡한 기능 구현

```markdown
# 개발 순서 전략
1. 기본 프로젝트 구조 설정
2. 단순한 API 엔드포인트 (Health Check)
3. 사용자 인증 시스템
4. 게시글 CRUD
5. 댓글 시스템  
6. 프론트엔드 통합
7. 고급 기능 (팔로우, 즐겨찾기)
```

**교육적 의미**:
- MVP(Minimum Viable Product) 개념 적용
- 조기 피드백을 통한 방향 수정
- 리스크 관리와 안정적인 개발

#### 6.3 AI 도구의 한계 인식과 대응

**주요 제약사항과 해결책**:

1. **할루시네이션 문제**
   - 해결책: 중요한 코드는 반드시 테스트 실행으로 검증
   - 예시: API 응답 확인, 데이터베이스 연결 테스트

2. **컨텍스트 제한**
   - 해결책: CLAUDE.md로 프로젝트 컨텍스트 문서화
   - 예시: 기술 스택, 코딩 컨벤션, 디렉토리 구조

3. **보안 고려사항 부족**
   - 해결책: 보안 체크리스트 별도 관리
   - 예시: JWT 시크릿 관리, SQL 인젝션 방지

**⚠️ 중요한 주의사항**:
- AI 생성 코드는 반드시 검토 후 사용
- 보안에 민감한 부분은 수동 검증 필수
- 테스트 커버리지로 AI 코드 품질 검증

---

## 결론

### 🎖️ 주요 성과

1. **기술적 성과**
   - Go 표준 라이브러리 기반 백엔드 API 구현
   - React + TypeScript 기반 모던 프론트엔드 구현
   - TDD를 통한 견고한 코드 품질 확보
   - Docker를 활용한 개발 환경 표준화

2. **방법론적 성과**
   - Vibe Coding을 통한 빠른 MVP 개발
   - 이슈 기반 개발로 체계적인 진행 관리
   - AI 도구 활용을 통한 개발 생산성 향상

3. **학습 성과**
   - 실무적인 풀스택 개발 경험
   - 현대적인 개발 도구와 워크플로우 습득
   - AI와 협업하는 새로운 개발 패러다임 경험

### 🚀 다음 단계

1. **성능 최적화**: 데이터베이스 인덱싱, 캐싱 전략
2. **배포 자동화**: CI/CD 파이프라인 구축
3. **모니터링**: 로깅, 메트릭 수집 시스템
4. **확장 기능**: 팔로우, 즐겨찾기, 태그 시스템

### 💭 최종 통찰

RealWorld 애플리케이션 개발을 통해 배운 가장 중요한 교훈은 **단순함의 힘**입니다. 복잡한 프레임워크나 도구보다는 기본기가 탄탄한 기술 스택을 선택하고, AI 도구를 적절히 활용하면서도 본질적인 개발 역량을 키우는 것이 중요합니다.

또한 문서화와 테스트가 단순히 부가적인 작업이 아니라 개발 생산성과 코드 품질을 결정하는 핵심 요소임을 깨달았습니다. 특히 AI 도구와 협업할 때는 명확한 컨텍스트 제공과 결과 검증이 성공의 열쇠입니다.

---

*이 튜토리얼은 실제 개발 과정에서 얻은 경험을 바탕으로 작성되었으며, RealWorld 애플리케이션을 구축하고자 하는 개발자들에게 실무적인 가이드를 제공하는 것을 목표로 합니다.*
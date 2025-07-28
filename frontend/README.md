# Frontend - React TypeScript 애플리케이션

RealWorld 애플리케이션의 프론트엔드 구현체입니다. React 19, TypeScript, Vite를 사용하여 구현되었습니다.

**최근 업데이트**: Phase 1 데모 진행 중 - AWS ALB 동적 연결 테스트 (워크플로우 수정 완료)

## 📋 개요

- **프레임워크**: React 19 + TypeScript
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS + shadcn/ui 컴포넌트
- **상태 관리**: Context API + React Query (@tanstack/react-query)
- **라우팅**: React Router v7
- **배포**: GitHub Pages (자동 배포)

## 🏗️ 프로젝트 구조

```
frontend/
├── src/                     # 소스 코드
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── article/         # 게시글 관련 컴포넌트
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   └── CommentList.tsx
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   └── ui/              # shadcn/ui 기반 UI 컴포넌트
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── pages/               # 페이지 컴포넌트 (라우팅)
│   │   ├── HomePage.tsx         # 메인 페이지 (게시글 목록)
│   │   ├── ArticlePage.tsx      # 게시글 상세 페이지
│   │   ├── EditorPage.tsx       # 게시글 작성/수정 페이지
│   │   └── auth/               # 인증 관련 페이지
│   │       ├── LoginPage.tsx
│   │       └── RegisterPage.tsx
│   ├── contexts/            # React Context (전역 상태)
│   │   ├── AuthContext.tsx      # 인증 상태 관리
│   │   └── auth-context.ts
│   ├── hooks/               # 커스텀 훅
│   │   ├── useAuth.ts          # 인증 관련 로직
│   │   ├── useArticles.ts      # 게시글 관련 로직  
│   │   └── useComments.ts      # 댓글 관련 로직
│   ├── lib/                 # 라이브러리 및 유틸리티
│   │   ├── api.ts              # Axios API 클라이언트
│   │   ├── query-client.ts     # React Query 설정
│   │   ├── error-handler.ts    # 에러 처리 유틸리티
│   │   ├── utils.ts            # 공통 유틸리티 함수
│   │   └── button-variants.ts  # 버튼 스타일 variants
│   ├── types/               # TypeScript 타입 정의
│   │   └── index.ts
│   ├── assets/              # 정적 자산
│   ├── test/                # 테스트 설정
│   │   └── setup.ts
│   ├── App.tsx              # 메인 애플리케이션 컴포넌트
│   ├── main.tsx             # 애플리케이션 진입점
│   └── index.css            # 전역 스타일
├── e2e/                     # End-to-End 테스트 (Playwright)
│   ├── tests/               # E2E 테스트 케이스
│   │   ├── auth.spec.ts         # 인증 플로우 테스트
│   │   ├── articles.spec.ts     # 게시글 CRUD 테스트
│   │   ├── health.spec.ts       # 헬스 체크 테스트
│   │   └── responsive.spec.ts   # 반응형 디자인 테스트
│   ├── helpers/             # 테스트 헬퍼 함수
│   │   ├── api.ts
│   │   └── test-data.ts
│   ├── global-setup.ts      # 테스트 전역 설정
│   └── global-teardown.ts   # 테스트 정리
├── public/                  # 정적 파일 (favicon, 이미지 등)
├── dist/                    # 빌드 결과물
├── playwright.config.ts     # Playwright 설정
├── vite.config.ts          # Vite 빌드 설정
├── tailwind.config.js      # Tailwind CSS 설정
├── tsconfig.json           # TypeScript 설정
├── package.json            # NPM 의존성 및 스크립트
├── Dockerfile              # 프로덕션 컨테이너 이미지
└── Dockerfile.dev          # 개발용 컨테이너 이미지
```

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+ 설치
- npm 또는 yarn 패키지 매니저

### 로컬 개발 환경 설정

1. **의존성 설치**
   ```bash
   cd frontend
   npm ci
   ```

2. **환경 변수 설정**
   ```bash
   # .env.local 파일 생성
   VITE_API_URL=http://localhost:8080  # 백엔드 API URL
   ```

3. **개발 서버 시작**
   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   - http://localhost:3000

### 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

## 🧪 테스트

### 단위 테스트 (Vitest)
```bash
# 모든 단위 테스트 실행
npm run test:run

# 대화형 테스트 모드
npm run test

# 테스트 커버리지 확인
npm run test:coverage
```

### E2E 테스트 (Playwright)
```bash
# E2E 테스트 실행 (헤드리스 모드)
npm run test:e2e

# UI 모드로 E2E 테스트 실행
npm run test:e2e:ui

# 특정 브라우저에서만 테스트
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### 린팅 및 포맷팅
```bash
# ESLint 실행
npm run lint

# 코드 포맷팅 (Prettier)
npm run format
```

## 🎨 스타일링 시스템

### Tailwind CSS
- **유틸리티 우선 CSS 프레임워크**
- **반응형 디자인**: `sm:`, `md:`, `lg:`, `xl:` 브레이크포인트
- **다크 모드 지원**: `dark:` variant 사용

### shadcn/ui 컴포넌트
```tsx
// 예: 버튼 컴포넌트 사용
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg">
  Click me
</Button>
```

### 커스텀 스타일
```css
/* src/index.css */
@tailwind base;
@tailwind components; 
@tailwind utilities;

/* 커스텀 CSS 클래스 */
.custom-class {
  @apply bg-blue-500 text-white p-4 rounded;
}
```

## 🔄 상태 관리

### React Query (TanStack Query)
```tsx
// 예: 게시글 목록 조회
const { data: articles, isLoading, error } = useQuery({
  queryKey: ['articles'],
  queryFn: () => api.getArticles()
})
```

### Context API
```tsx
// 인증 상태 관리
const { user, login, logout, isAuthenticated } = useAuth()
```

## 🛣️ 라우팅

### React Router 설정
```tsx
// 라우팅 구조
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/editor" element={<EditorPage />} />
  <Route path="/article/:slug" element={<ArticlePage />} />
</Routes>
```

### 보호된 라우트
```tsx
// 인증 필요한 페이지
<ProtectedRoute>
  <EditorPage />
</ProtectedRoute>
```

## 🔧 API 연동

### Axios 클라이언트 설정
```tsx
// lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// JWT 토큰 자동 주입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})
```

### API 함수 예시
```tsx
// 게시글 목록 조회
export const getArticles = async (): Promise<ArticleResponse> => {
  const response = await api.get('/api/articles')
  return response.data
}

// 게시글 생성
export const createArticle = async (article: CreateArticleRequest): Promise<ArticleResponse> => {
  const response = await api.post('/api/articles', { article })
  return response.data
}
```

## 📱 반응형 디자인

### 브레이크포인트
- **모바일**: `< 640px`
- **태블릿**: `640px - 1024px` (sm, md)
- **데스크톱**: `> 1024px` (lg, xl, 2xl)

### 반응형 컴포넌트 예시
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {articles.map(article => (
    <ArticleCard key={article.slug} article={article} />
  ))}
</div>
```

## 🚀 배포

### GitHub Pages 자동 배포
- **배포 URL**: https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/
- **트리거**: `frontend/**` 경로 변경 시 자동 배포
- **빌드 설정**: Vite base path `/Realworld-serverless-microservice/`

### 수동 배포
```bash
# GitHub Pages 배포용 빌드
npm run build

# 빌드 결과물이 dist/ 폴더에 생성됨
```

### Docker 배포
```bash
# 개발용 이미지
docker build -f Dockerfile.dev -t conduit-frontend:dev .
docker run -p 3000:3000 conduit-frontend:dev

# 프로덕션 이미지 (Nginx 서빙)
docker build -t conduit-frontend:prod .
docker run -p 80:80 conduit-frontend:prod
```

## 🔍 주요 기능

### 인증 시스템
- **회원가입/로그인**: JWT 토큰 기반
- **자동 로그인**: localStorage에 토큰 저장
- **보호된 라우트**: 인증 필요 페이지 접근 제어

### 게시글 관리
- **CRUD 작업**: 생성, 조회, 수정, 삭제
- **마크다운 지원**: 게시글 본문 마크다운 렌더링
- **태그 시스템**: 게시글 분류 및 필터링

### 댓글 시스템
- **실시간 댓글**: 게시글별 댓글 작성/삭제
- **인증 확인**: 로그인한 사용자만 댓글 작성 가능

## 🐛 디버깅 및 문제 해결

### 개발 도구
```bash
# React Developer Tools 사용
# Redux DevTools (React Query DevTools 포함)
npm run dev  # 개발 모드에서 DevTools 자동 활성화
```

### 일반적인 문제
1. **API 연결 실패**: `VITE_API_URL` 환경변수 확인
2. **인증 토큰 만료**: localStorage 토큰 삭제 후 재로그인
3. **CORS 에러**: 백엔드 CORS 설정 확인
4. **빌드 에러**: TypeScript 타입 에러 확인

### 로그 확인
```tsx
// 개발 모드에서 디버그 로그
console.log('API Response:', response.data)

// React Query DevTools로 캐시 상태 확인
```

## 📈 성능 최적화

### 코드 분할 (Code Splitting)
```tsx
// 페이지별 lazy loading
const HomePage = lazy(() => import('./pages/HomePage'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
```

### 메모이제이션
```tsx
// 비용이 큰 계산 최적화
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data)
}, [data])

// 컴포넌트 리렌더링 최적화
const MemoizedComponent = memo(MyComponent)
```

### 이미지 최적화
```tsx
// Lazy loading 이미지
<img 
  src={imageUrl} 
  loading="lazy" 
  alt="Description"
  className="w-full h-auto"
/>
```

## 🤝 기여하기

### 개발 규칙
- **TypeScript Strict Mode**: 엄격한 타입 체크
- **ESLint + Prettier**: 코드 스타일 통일
- **컴포넌트 분리**: 단일 책임 원칙 준수
- **커스텀 훅**: 로직 재사용성 증대

### 브랜치 전략
```bash
# 기능 개발 브랜치
git checkout -b feature/article-pagination

# 버그 수정 브랜치  
git checkout -b fix/auth-token-refresh
```

### 커밋 메시지
```bash
# 기능 추가
git commit -m "feat: 게시글 페이지네이션 기능 추가"

# 버그 수정
git commit -m "fix: 로그인 토큰 갱신 이슈 해결"

# 스타일 변경
git commit -m "style: 메인 페이지 레이아웃 개선"
```

---

**참고 자료**:
- [React 공식 문서](https://react.dev/)
- [Vite 문서](https://vitejs.dev/)
- [Tailwind CSS 문서](https://tailwindcss.com/)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com/)
- [React Query 문서](https://tanstack.com/query/latest)
- [Playwright 문서](https://playwright.dev/)
# RealWorld App - Product Requirements Document (PRD) 
## 서버리스 마이크로서비스 완료 버전

> **상태**: ✅ **완료됨 (2025년 1월)** - Phase 4 서버리스 최적화 완료  
> **현재 운영**: 100% 서버리스 아키텍처로 운영 중

## 1. 프로젝트 개요

### 1.1 프로젝트명
**Conduit** - RealWorld 소셜 블로깅 플랫폼 (서버리스 마이크로서비스 구현체)

### 1.2 프로젝트 목적 (달성 완료)
- ✅ Medium.com 클론 형태의 소셜 블로깅 플랫폼 구축
- ✅ **모노리식에서 서버리스 마이크로서비스로의 완전한 마이그레이션** 완료
- ✅ 실제 운영 가능한 수준의 풀스택 웹 애플리케이션 구현
- ✅ **점진적 마이그레이션 전략**을 통한 현대적 클라우드 아키텍처 구현
- ✅ **75% 비용 절감** 달성 (월 50달러 → 12달러)

### 1.3 현재 구현 범위 (Phase 4 완료)
- **프론트엔드**: React 19 + TypeScript 반응형 웹 애플리케이션 (GitHub Pages)
- **백엔드**: **AWS Lambda 기반 서버리스 마이크로서비스** (3개 도메인 서비스)
- **데이터베이스**: **DynamoDB** - 완전 서버리스 NoSQL (Pay-per-request)
- **인증**: JWT 기반 사용자 인증 시스템 (서버리스 Lambda)
- **인프라**: AWS CDK로 완전 자동화된 Infrastructure as Code
- **모니터링**: CloudWatch Logs + Alarms (실시간 에러 추적)

## 2. 핵심 기능 요구사항

### 2.1 사용자 관리 (User Management)
- **사용자 회원가입**: 이메일, 사용자명, 비밀번호 기반 계정 생성
- **로그인/로그아웃**: JWT 토큰 기반 인증 시스템
- **프로필 관리**: 사용자 정보 조회, 수정 (삭제 기능 제외)
- **사용자 팔로우**: 다른 사용자 팔로우/언팔로우 기능

### 2.2 게시글 관리 (Article Management)
- **게시글 CRUD**: 게시글 생성, 조회, 수정, 삭제 기능
- **게시글 목록**: 페이지네이션 기반 게시글 리스트 표시
- **게시글 즐겨찾기**: 관심 게시글 북마크 기능
- **태그 시스템**: 게시글 분류를 위한 태그 기능

### 2.3 댓글 시스템 (Comment System)
- **댓글 작성**: 게시글에 댓글 추가
- **댓글 조회**: 게시글별 댓글 리스트 표시
- **댓글 삭제**: 본인 댓글 삭제 기능 (수정 기능 제외)

### 2.4 피드 시스템 (Feed System)
- **전체 피드**: 모든 게시글 표시
- **개인 피드**: 팔로우한 사용자의 게시글만 표시
- **태그별 피드**: 특정 태그 게시글 필터링

## 3. 페이지 구성

### 3.1 인증 페이지
- **로그인 페이지**: 사용자 로그인 폼
- **회원가입 페이지**: 신규 사용자 등록 폼

### 3.2 메인 페이지
- **홈 페이지**: 전체/개인 피드 탭, 인기 태그 사이드바
- **게시글 상세 페이지**: 게시글 내용, 댓글 섹션
- **프로필 페이지**: 사용자 정보, 작성 게시글/즐겨찾기 탭

### 3.3 관리 페이지
- **설정 페이지**: 프로필 수정, 로그아웃 기능
- **게시글 작성/수정 페이지**: 게시글 에디터

## 4. 기술 스택 (서버리스 아키텍처 완료)

### 4.1 백엔드 (서버리스 마이크로서비스) ✅
- **언어**: Go 1.23.6 (콜드 스타트 최적화)
  - 공식 문서: https://go.dev/doc/install
  - **서버리스 런타임**: AWS Lambda PROVIDED_AL2
  - 빠른 부팅 시간 (< 500ms)
  - 메모리 최적화 (256MB)
- **데이터베이스**: **DynamoDB** (완전 서버리스 NoSQL)
  - Pay-per-request 빌링
  - Single Table Design 적용
  - Global Secondary Index (GSI) 활용
  - **테이블**: conduit-users, conduit-articles, conduit-comments
- **아키텍처**: **마이크로서비스 아키텍처**
  - **Auth Service**: 인증 및 사용자 관리
  - **Articles Service**: 게시글 CRUD 및 즐겨찾기
  - **Comments Service**: 댓글 시스템
- **API Gateway**: AWS API Gateway (Lambda Proxy Integration)
- **인증**: JWT 토큰 기반 (Lambda 간 공유 라이브러리)
- **모니터링**: CloudWatch Logs + CloudWatch Alarms
- **빌드**: AWS CDK + Go 네이티브 빌드

### 4.2 프론트엔드 (모던 React 스택) ✅
- **런타임**: Node.js 20.x (LTS)
  - 공식 문서: https://nodejs.org/en/download
- **프레임워크**: **React 19** (최신 안정 버전)
  - 공식 문서: https://react.dev/learn
  - 새로운 Concurrent Features 활용
- **타입 시스템**: **TypeScript 5.8.x**
  - 공식 문서: https://www.typescriptlang.org/docs/handbook/intro.html
- **CSS**: **shadcn/ui + Tailwind CSS 4**
  - shadcn/ui 공식 문서: https://ui.shadcn.com/docs/installation
  - Tailwind CSS 공식 문서: https://tailwindcss.com/docs/installation
  - 재사용 가능한 컴포넌트 라이브러리
  - 유틸리티 기반 CSS 프레임워크
- **라우팅**: **React Router v7** (데이터 라우터)
  - 공식 문서: https://reactrouter.com/en/main
- **빌드 도구**: **Vite 7** (최신 번들러)
  - 공식 문서: https://vitejs.dev/guide/
- **상태 관리**: **TanStack Query v5** + React Context
  - 공식 문서: https://tanstack.com/query/latest/docs/framework/react/overview
  - 서버 상태 캐싱 및 동기화
- **패키지 관리**: npm
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원

### 4.3 서버리스 인프라 (AWS CDK) ✅
- **Infrastructure as Code**: **AWS CDK (TypeScript)**
  - 공식 문서: https://docs.aws.amazon.com/cdk/
  - 완전 자동화된 인프라 배포
  - 타입 안전한 인프라 정의
- **컴퓨트**: AWS Lambda (Pay-per-invocation)
  - 자동 스케일링 (0 → 수천 개 동시 실행)
  - 서버 관리 불필요
- **스토리지**: DynamoDB (Pay-per-request)
  - 자동 백업 및 복구
  - Multi-AZ 고가용성
- **네트워킹**: API Gateway + CloudFront
  - 전 세계 엣지 로케이션 활용
  - 자동 SSL/TLS 인증서
- **CI/CD**: **GitHub Actions** (완전 자동화)
  - 코드 푸시 시 자동 배포
  - E2E 테스트 자동 실행
  - 프론트엔드: GitHub Pages 배포
- **모니터링**: CloudWatch (실시간 로그 + 알람)
- **비용 최적화**: Pay-per-use 모델 (75% 절감)

### 4.4 개발 도구 및 방법론
- **AI 도구**: Claude Code 활용
- **개발 원칙**:
  - 함수형 프로그래밍 선호
  - 로컬 검증 우선
  - 병렬 처리 가능한 단순한 코드
  - "가장 단순한 작동 방식" 우선
- **테스트**: Go 표준 테스트 + Jest/Vitest
- **린터**: golangci-lint, ESLint
- **코드 포맷터**: gofmt, Prettier

### 4.5 API 및 통신
- **RESTful API**: 표준 HTTP 메서드 사용
- **JWT 인증**: 토큰 기반 사용자 인증
- **CORS 처리**: 크로스 오리진 리소스 공유 설정
- **에러 핸들링**: 표준화된 에러 응답 형식
- **API 연동**: 백엔드 API와의 비동기 통신

### 4.6 데이터베이스 설계
- **사용자 테이블**: 사용자 정보, 인증 데이터
- **게시글 테이블**: 게시글 내용, 메타데이터
- **댓글 테이블**: 댓글 내용, 연관 관계
- **팔로우 테이블**: 사용자 간 팔로우 관계
- **태그 테이블**: 태그 정보 및 게시글 연관 관계
- **마이그레이션**: 순수 SQL 스크립트 기반

## 5. API 명세

### 5.1 API 베이스 URL
- **데모 API**: `https://api.realworld.io/api`
- **로컬 개발**: `http://localhost:3000/api`

### 5.2 서버리스 마이크로서비스 엔드포인트 ✅
- **프로덕션 API**: `https://5hlad3iru9.execute-api.ap-northeast-2.amazonaws.com/prod/`
- **로컬 개발**: `http://localhost:8080/api`

#### Auth Service (Lambda 함수)
- `POST /users` - 사용자 회원가입
- `POST /users/login` - 사용자 로그인  
- `GET /user` - 현재 사용자 정보
- `PUT /user` - 사용자 정보 수정

#### Articles Service (Lambda 함수)  
- `GET /articles` - 게시글 목록 조회
- `POST /articles` - 게시글 생성
- `GET /articles/:slug` - 특정 게시글 조회
- `PUT /articles/:slug` - 게시글 수정
- `DELETE /articles/:slug` - 게시글 삭제
- `POST /articles/:slug/favorite` - 게시글 즐겨찾기 추가
- `DELETE /articles/:slug/favorite` - 게시글 즐겨찾기 제거

#### Comments Service (Lambda 함수)
- `GET /articles/:slug/comments` - 댓글 목록 조회
- `POST /articles/:slug/comments` - 댓글 생성
- `DELETE /articles/:slug/comments/:id` - 댓글 삭제

#### 추가 엔드포인트 (구현 예정)
- **프로필**: `/profiles/:username`
- **태그**: `/tags`

## 6. 보안 요구사항

### 6.1 인증 보안
- JWT 토큰 기반 인증
- 비밀번호 해싱 (bcrypt 등)
- 토큰 만료 시간 설정

### 6.2 데이터 보안
- SQL 인젝션 방지
- XSS 공격 방지
- CSRF 토큰 활용

## 7. 성능 요구사항

### 7.1 응답 시간
- API 응답 시간: 평균 500ms 이하
- 페이지 로딩 시간: 3초 이하

### 7.2 동시 접속
- 최소 100명 동시 사용자 지원
- 데이터베이스 연결 풀 관리

## 8. 테스트 요구사항

### 8.1 프론트엔드 테스트
- 단위 테스트: 컴포넌트 기능 테스트
- 통합 테스트: API 연동 테스트
- E2E 테스트: 주요 사용자 시나리오 테스트

### 8.2 백엔드 테스트
- API 엔드포인트 테스트
- 데이터베이스 연동 테스트
- 인증/권한 테스트

## 9. 배포 및 운영

### 9.1 배포 환경
- **개발 환경**: Docker Compose 기반 로컬 개발 스택
- **테스트 환경**: Docker 컨테이너 기반 스테이징 서버
- **운영 환경**: Docker 이미지 기반 프로덕션 배포 (AWS, Google Cloud 등)
- **컨테이너 레지스트리**: Docker Hub 또는 클라우드 레지스트리

### 9.2 모니터링
- 애플리케이션 로그 관리
- 에러 트래킹 시스템
- 성능 모니터링 도구

## 10. 프로젝트 일정

### 10.1 개발 단계
1. **1주차**: 프로젝트 설정 및 기본 구조 구축
2. **2주차**: 사용자 인증 시스템 구현
3. **3주차**: 게시글 CRUD 기능 구현
4. **4주차**: 댓글 및 팔로우 시스템 구현
5. **5주차**: UI/UX 개선 및 테스트
6. **6주차**: 배포 및 최종 검수

### 10.2 마일스톤
- **MVP 완성**: 기본 CRUD 기능 구현
- **베타 버전**: 모든 핵심 기능 구현
- **정식 버전**: 테스트 완료 및 배포

## 11. 참고 자료

- **RealWorld 공식 문서**: https://realworld-docs.netlify.app/
- **GitHub 저장소**: https://github.com/gothinkster/realworld
- **API 명세**: GitHub의 API 스펙 문서
- **Postman 컬렉션**: API 테스트용 컬렉션
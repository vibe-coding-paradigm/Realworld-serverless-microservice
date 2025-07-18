# RealWorld App - Product Requirements Document (PRD)

## 1. 프로젝트 개요

### 1.1 프로젝트명
**Conduit** - RealWorld 소셜 블로깅 플랫폼

### 1.2 프로젝트 목적
- Medium.com 클론 형태의 소셜 블로깅 플랫폼 구축
- 실제 운영 가능한 수준의 풀스택 웹 애플리케이션 구현
- 다양한 기술 스택을 활용한 개발 역량 증명

### 1.3 프로젝트 범위
- 프론트엔드: 반응형 웹 애플리케이션
- 백엔드: RESTful API 서버
- 데이터베이스: 사용자, 게시글, 댓글 관리
- 인증: JWT 기반 사용자 인증 시스템

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

## 4. 기술 스택

### 4.1 백엔드 기술 스택
- **언어**: Go 1.24 (LTS)
  - 공식 문서: https://go.dev/doc/install
  - 명시적 컨텍스트 시스템
  - 간단한 테스트 캐싱
  - 구조적 인터페이스
  - 낮은 생태계 변동성
- **데이터베이스**: SQLite
  - 경량화된 파일 기반 데이터베이스
  - 순수 SQL 사용 (ORM 대신)
  - 개발 및 배포 단순화
- **웹 프레임워크**: net/http 표준 라이브러리 + 미들웨어
- **인증**: JWT 토큰 기반
- **로깅**: 구조화된 로깅 시스템
- **빌드**: Makefile 기반 개발 프로세스 관리

### 4.2 프론트엔드 기술 스택
- **런타임**: Node.js 20.x (LTS)
  - 공식 문서: https://nodejs.org/en/download
- **프레임워크**: React 18.2.0 (Stable)
  - 공식 문서: https://react.dev/learn
- **타입 시스템**: TypeScript 5.6.x
  - 공식 문서: https://www.typescriptlang.org/docs/handbook/intro.html
- **CSS**: shadcn/ui + Tailwind CSS 3.5.x
  - shadcn/ui 공식 문서: https://ui.shadcn.com/docs/installation
  - Tailwind CSS 공식 문서: https://tailwindcss.com/docs/installation
  - 재사용 가능한 컴포넌트 라이브러리
  - 유틸리티 기반 CSS 프레임워크
- **라우팅**: Tanstack Router 1.2.x
  - 공식 문서: https://tanstack.com/router/latest/docs/guide/installation
- **빌드 도구**: Vite 5.2.x
  - 공식 문서: https://vitejs.dev/guide/
- **상태 관리**: React Query 5.25.0 + Context API
  - 공식 문서: https://tanstack.com/query/latest/docs/framework/react/overview
- **패키지 관리**: npm
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원

### 4.3 인프라 및 배포
- **컨테이너**: Docker 26.0.0 (Stable)
  - 공식 문서: https://docs.docker.com/get-started/
  - 개발 환경 표준화
  - 배포 환경 일관성
- **개발 환경**: Docker Compose
  - 로컬 개발 스택 구성
  - 서비스 간 네트워킹
- **배포**: Docker 이미지 기반
- **프로세스 관리**: Makefile

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

### 5.2 주요 엔드포인트
- **인증**: `/users/login`, `/users`, `/user`
- **게시글**: `/articles`, `/articles/:slug`
- **댓글**: `/articles/:slug/comments`
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
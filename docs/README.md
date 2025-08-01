# 📚 프로젝트 문서

이 폴더는 RealWorld 서버리스 마이크로서비스 프로젝트의 모든 문서를 포함합니다. 프로젝트의 설계, 요구사항, 마이그레이션 계획, 트러블슈팅 가이드 등을 확인할 수 있습니다.

## 📋 문서 목록

### 🎯 핵심 문서

#### [PRD.md](./PRD.md)
**제품 요구사항 문서 (Product Requirements Document)**
- RealWorld 애플리케이션의 핵심 기능 요구사항
- 사용자 스토리 및 수용 기준
- 기술적 제약사항 및 비기능적 요구사항
- Medium.com 클론 형태의 소셜 블로깅 플랫폼 사양

#### [design.md](./design.md)
**시스템 설계 문서**
- 아키텍처 설계 (Clean Architecture 패턴)
- 데이터베이스 스키마 설계 
- API 엔드포인트 설계
- 프론트엔드 컴포넌트 구조
- 보안 및 인증 시스템 설계

### 🔄 마이그레이션 문서

#### [migration/PRD.md](./migration/PRD.md)
**마이그레이션 제품 요구사항 문서**
- 모노리식에서 서버리스 마이크로서비스로의 단계적 전환 계획
- Phase 1-4 상세 마이그레이션 로드맵
- 바이브 코딩 방법론 적용 전략
- AWS 서버리스 아키텍처 전환 계획

#### [migration/github-issue-guidelines.md](./migration/github-issue-guidelines.md)
**GitHub 이슈 관리 가이드라인**
- 프로젝트 이슈 관리 방법론
- 증거 기반 이슈 종료 정책
- GitHub CLI 활용 가이드
- 커밋과 이슈 연동 규칙

#### [migration/tasks.md](./migration/tasks.md)
**마이그레이션 작업 목록**
- 세부 구현 작업 항목들
- 각 Phase별 체크리스트
- 기술적 마일스톤 정의

#### [migration/PRD_review.md](./migration/PRD_review.md)
**마이그레이션 PRD 검토 문서**
- PRD 리뷰 결과 및 피드백
- 요구사항 분석 및 개선 제안

#### [migration/pre_prd.md](./migration/pre_prd.md)
**PRD 사전 기획 문서**
- PRD 작성 전 초기 아이디어 및 컨셉
- 프로젝트 방향성 설정

### 🛠️ 운영 및 개발 지원

#### [github-variables.md](./github-variables.md)
**GitHub Actions 환경변수 설정 가이드**
- CI/CD 파이프라인 환경변수 설정 방법
- AWS 연동을 위한 필수 변수들
- 동적 URL 생성 방식 설명

#### [troubleshooting.md](./troubleshooting.md)
**트러블슈팅 가이드**
- 프로젝트 개발 과정에서 발생한 실제 문제들과 해결책
- GitHub Actions 워크플로우 문제 해결
- AWS CDK 및 인프라 배포 이슈
- Docker, 네트워크 연결 문제 등

#### [tasks.md](./tasks.md)
**프로젝트 작업 목록**
- 전체 프로젝트 구현 계획
- 백엔드/프론트엔드 개발 작업 분류
- 우선순위별 작업 배치

### 📖 학습 및 데모

#### [tutorial.md](./tutorial.md)
**프로젝트 튜토리얼**
- 프로젝트 시작하기 가이드
- 개발 환경 설정 방법
- 주요 기능 사용법

#### [phase1-demo-scenario.md](./phase1-demo-scenario.md)
**Phase 1 데모 시나리오**
- Phase 1 완성 시점의 데모 시나리오
- 주요 기능들의 사용 예시
- 검증 및 테스트 방법

## 📁 문서 구조

```
docs/
├── README.md                     # 이 파일 - 문서 전체 개요
├── PRD.md                        # 제품 요구사항 문서
├── design.md                     # 시스템 설계 문서
├── github-variables.md           # GitHub Actions 환경변수 가이드
├── troubleshooting.md            # 트러블슈팅 가이드
├── tasks.md                      # 프로젝트 작업 목록
├── tutorial.md                   # 튜토리얼
├── phase1-demo-scenario.md       # Phase 1 데모 시나리오
└── migration/                    # 마이그레이션 관련 문서
    ├── PRD.md                    # 마이그레이션 PRD
    ├── PRD_review.md             # PRD 검토 문서
    ├── github-issue-guidelines.md # 이슈 관리 가이드라인
    ├── pre_prd.md                # PRD 사전 기획
    └── tasks.md                  # 마이그레이션 작업 목록
```

## 🚀 문서 사용 가이드

### 새로운 기여자를 위한 읽기 순서

1. **[PRD.md](./PRD.md)** - 프로젝트 전체 이해
2. **[design.md](./design.md)** - 시스템 아키텍처 이해  
3. **[migration/PRD.md](./migration/PRD.md)** - 마이그레이션 계획 이해
4. **[migration/github-issue-guidelines.md](./migration/github-issue-guidelines.md)** - 작업 방식 이해
5. **[tutorial.md](./tutorial.md)** - 실습 시작

### 개발 중 참고할 문서들

- **개발 환경 설정**: `tutorial.md`
- **API 설계 확인**: `design.md`
- **이슈 관리**: `migration/github-issue-guidelines.md`
- **문제 해결**: `troubleshooting.md`
- **CI/CD 설정**: `github-variables.md`

### 운영 및 배포 관련

- **환경변수 설정**: `github-variables.md`
- **배포 문제 해결**: `troubleshooting.md`
- **마이그레이션 진행**: `migration/PRD.md`, `migration/tasks.md`

## 📝 문서 업데이트 정책

- **실시간 업데이트**: 개발 진행에 따라 문서를 지속적으로 업데이트
- **검증된 정보**: 실제 구현되고 테스트된 내용만 문서화
- **예제 중심**: 이론보다는 실제 명령어와 코드 예제 포함
- **트러블슈팅 축적**: 발생한 문제와 해결책을 지속적으로 축적

---

💡 **팁**: 문서에서 찾을 수 없는 정보가 있다면 [GitHub Issues](https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/issues)에서 질문해주세요!
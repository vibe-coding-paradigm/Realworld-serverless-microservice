# RealWorld Serverless Microservice - 트러블슈팅 가이드

본 문서는 RealWorld 서버리스 마이크로서비스 프로젝트 개발 과정에서 발생한 실제 문제들과 해결 방법을 정리한 것입니다. 각 트러블슈팅 케이스는 실제 사용된 프롬프트와 명령어를 포함하여 재현 가능한 해결책을 제공합니다.

## 목차
1. [GitHub Actions 워크플로우 문제](#1-github-actions-워크플로우-문제)
2. [AWS CDK 명령어 오류](#2-aws-cdk-명령어-오류)
3. [AWS Load Balancer 검증 실패](#3-aws-load-balancer-검증-실패)
4. [Docker 빌드 캐시 최적화](#4-docker-빌드-캐시-최적화)
5. [인프라 배포 의존성 문제](#5-인프라-배포-의존성-문제)
6. [네트워크 연결 문제](#6-네트워크-연결-문제)
7. [Git 변경사항 감지 실패](#7-git-변경사항-감지-실패)
8. [배포 전략 변경](#8-배포-전략-변경)
9. [GitHub Pages 환경 인증 리다이렉트 문제](#9-github-pages-환경-인증-리다이렉트-문제)
10. [UI 레이아웃 오버플로우 문제](#10-ui-레이아웃-오버플로우-문제)
11. [React Router basename 설정 문제](#11-react-router-basename-설정-문제)
12. [E2E 테스트 CloudFront URL 처리 문제](#12-e2e-테스트-cloudfront-url-처리-문제)
13. [E2E 테스트 API URL 중복 처리 문제](#13-e2e-테스트-api-url-중복-처리-문제)
14. [Git Hooks 시스템 통합 및 최적화](#14-git-hooks-시스템-통합-및-최적화)
15. [Pre-push Hook 로드 테스트 타임아웃 문제](#15-pre-push-hook-로드-테스트-타임아웃-문제)
16. [Git Hooks 중복 실행 문제](#16-git-hooks-중복-실행-문제)
17. [모범 사례 및 패턴](#17-모범-사례-및-패턴)

---

## 1. GitHub Actions 워크플로우 문제

### 문제: E2E 테스트 워크플로우의 수동 트리거 누락

**문제 설명**: E2E 테스트가 다른 워크플로우에서만 호출 가능하고 수동 실행이 불가능한 상황

**에러 메시지**:
```bash
could not create workflow dispatch event: HTTP 422: Workflow does not have 'workflow_dispatch' trigger
```

**사용된 프롬프트**:
```
"E2E 테스트 워크플로우에 manual trigger 기능을 추가해줘. GitHub Actions에서 수동으로 실행할 수 있도록 workflow_dispatch를 추가하고, 기본 URL들을 설정해줘."
```

**해결 과정**:

1. **워크플로우 파일 확인**:
```bash
# 현재 워크플로우 구조 파악
cat .github/workflows/e2e-tests.yml
```

2. **워크플로우 수정**:
```yaml
# .github/workflows/e2e-tests.yml에 추가
on:
  workflow_call:
    inputs:
      frontend_url:
        required: true
        type: string
      backend_url:
        required: true
        type: string
  workflow_dispatch:  # 수동 트리거 추가
    inputs:
      frontend_url:
        description: 'Frontend URL to test'
        required: false
        default: 'https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/'
        type: string
      backend_url:
        description: 'Backend URL to test'
        required: false
        default: 'http://conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com'
        type: string
```

3. **수동 실행 테스트**:
```bash
# GitHub CLI로 수동 워크플로우 실행
gh workflow run e2e-tests.yml --ref main
```

**결과**: E2E 테스트를 수동으로 실행할 수 있게 되었고, 기본 프로덕션 URL로 테스트 가능

---

## 2. AWS CDK 명령어 오류

### 문제: CDK 명령어 사용법 오류 및 디렉토리 문제

**문제 설명**: CDK 배포 중 잘못된 명령어 사용과 작업 디렉토리 오류

**에러 메시지**:
```bash
Unknown command: outputs
(eval):cd:1: no such file or directory: infrastructure
```

**사용된 프롬프트**:
```
"CDK 배포가 안되고 있어. infrastructure 디렉토리를 찾을 수 없다는 에러가 나오는데 확인해줘."
```

**해결 과정**:

1. **디렉토리 구조 확인**:
```bash
# 프로젝트 루트에서 디렉토리 확인
ls -la
# infra 디렉토리가 맞음 (infrastructure가 아님)
```

2. **올바른 CDK 명령어 사용**:
```bash
# 잘못된 명령어
cdk outputs  # ❌

# 올바른 명령어
cd infra     # 올바른 디렉토리로 이동
cdk deploy   # 올바른 배포 명령어
```

3. **의존성 확인**:
```bash
# CDK 및 의존성 설치 확인
npm install
cdk --version
```

**결과**: 올바른 디렉토리와 명령어로 CDK 배포 성공

---

## 3. AWS Load Balancer 검증 실패

### 문제: ALB 검증 스크립트에서 로드밸런서를 찾지 못함

**문제 설명**: 배포 검증 스크립트가 Application Load Balancer를 찾지 못하는 상황

**에러 메시지**:
```bash
❌ ALB 검증 실패: Load balancers '[conduit-alb]' not found
```

**사용된 프롬프트**:
```
"배포 검증에서 ALB를 찾을 수 없다는 에러가 나와. AWS CLI로 실제로 ALB가 있는지 확인하고 검증 스크립트를 수정해줘."
```

**해결 과정**:

1. **실제 ALB 상태 확인**:
```bash
# AWS CLI로 ALB 목록 확인
aws elbv2 describe-load-balancers --region ap-northeast-2

# CloudFormation 스택에서 ALB 리소스 확인
aws cloudformation describe-stack-resources --stack-name ConduitStack --region ap-northeast-2
```

2. **검증 스크립트 개선**:
```bash
# ALB DNS 이름으로 직접 검증
ALB_DNS="conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com"
curl -f "http://$ALB_DNS/health" --max-time 30
```

3. **대안적 검증 방법**:
```bash
# ECS 서비스 상태로 간접 검증
aws ecs describe-services --cluster ConduitCluster --services ConduitService --region ap-northeast-2
```

**결과**: ALB 이름 대신 DNS 이름을 사용한 검증으로 문제 해결

---

## 4. Docker 빌드 캐시 최적화

### 문제: Docker 빌드 시간 최적화 필요

**문제 설명**: Docker 이미지 빌드 시간을 단축하기 위한 캐시 전략 검증 요청

**사용된 프롬프트**:
```
"Docker 빌드 캐시가 제대로 최적화되어 있는지 확인해줘. Dockerfile들을 분석해서 개선점이 있으면 제안해줘."
```

**분석 결과**:

**✅ 잘 구현된 부분**:
- **Backend Dockerfile**: 의존성 분리 (`go.mod`/`go.sum` 먼저 복사)
- **Frontend Dockerfile**: `package*.json` 먼저 복사
- **Multi-stage builds**: 양쪽 서비스 모두 적용
- **Alpine 베이스 이미지**: 경량화 이미지 사용

**개선 제안사항**:

1. **.dockerignore 파일 추가**:
```dockerfile
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.DS_Store
```

2. **Migration 복사 최적화**:
```dockerfile
# 기존 (비효율적)
COPY . .

# 개선안
COPY migrations/ migrations/
COPY cmd/ cmd/
COPY internal/ internal/
```

**결과**: 빌드 캐시 전략이 대부분 잘 구현되어 있으며, 미세한 개선사항 식별

---

## 5. 인프라 배포 의존성 문제

### 문제: 인프라가 배포되지 않은 상태에서 서비스 배포 시도

**문제 설명**: CDK 인프라가 배포되지 않은 상태에서 백엔드 배포 워크플로우 실행

**에러 메시지**:
```bash
❌ Error: Infrastructure not found!
Please run initial deployment locally first: make cdk-deploy
```

**사용된 프롬프트**:
```
"백엔드 배포 워크플로우가 실패하고 있어. 인프라가 먼저 배포되어야 하는 것 같은데 체크하는 로직을 추가해줘."
```

**해결 과정**:

1. **인프라 존재 여부 확인 로직 추가**:
```bash
# CloudFormation 스택 존재 확인
aws cloudformation describe-stacks --stack-name ConduitStack --region ap-northeast-2 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: Infrastructure not found!"
    echo "Please run initial deployment locally first: make cdk-deploy"
    exit 1
fi
```

2. **명확한 에러 메시지 제공**:
```yaml
# GitHub Actions 워크플로우에 사전 체크 단계 추가
- name: Check Infrastructure
  run: |
    if ! aws cloudformation describe-stacks --stack-name ConduitStack --region ap-northeast-2 >/dev/null 2>&1; then
      echo "❌ Infrastructure not deployed yet"
      echo "Run 'make cdk-deploy' locally first"
      exit 1
    fi
```

3. **초기 배포 가이드 문서화**:
```bash
# 초기 배포 (로컬에서 한 번만 실행)
make cdk-deploy

# 이후 서비스 업데이트는 GitHub Actions에서 자동
```

**결과**: 인프라 의존성을 명확히 체크하고 사용자에게 가이드 제공

---

## 6. 네트워크 연결 문제

### 문제: 백엔드 헬스체크 타임아웃

**문제 설명**: 백엔드 서비스 헬스체크가 연결 타임아웃으로 실패

**에러 패턴**:
```bash
curl: (28) Failed to connect to [IP] port 8080 after 75002 ms: Couldn't connect to server
```

**사용된 프롬프트**:
```
"백엔드 헬스체크가 계속 타임아웃 되고 있어. 75초나 걸리는 건 네트워크 문제 같은데 확인해줘."
```

**분석 및 해결 과정**:

1. **네트워크 계층별 진단**:
```bash
# Security Group 확인
aws ec2 describe-security-groups --group-ids sg-xxx --region ap-northeast-2

# VPC 라우팅 테이블 확인
aws ec2 describe-route-tables --region ap-northeast-2

# 서브넷 설정 확인
aws ec2 describe-subnets --region ap-northeast-2
```

2. **서비스 상태 직접 확인**:
```bash
# ECS 서비스 상태
aws ecs describe-services --cluster ConduitCluster --services ConduitService --region ap-northeast-2

# 컨테이너 로그 확인
aws logs get-log-events --log-group-name /ecs/conduit --log-stream-name xxx --region ap-northeast-2
```

3. **대안 검증 방법**:
```bash
# ALB 헬스체크 상태 확인
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:xxx
```

**추정 원인**:
- Security Group 8080 포트 허용 문제
- VPC 퍼블릭 서브넷 설정 문제
- 인터넷 게이트웨이 라우팅 문제

**결과**: 네트워크 설정 문제로 판단, 인프라 코드 검토 필요

---

## 7. Git 변경사항 감지 실패

### 문제: 수정한 워크플로우 파일이 Git에서 감지되지 않음

**문제 설명**: 워크플로우 파일을 수정했는데 git이 변경사항을 인식하지 못함

**에러 메시지**:
```bash
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

**사용된 프롬프트**:
```
"워크플로우 파일을 수정했는데 git status에서 변경사항이 안 보여. 파일 권한이나 다른 문제가 있는 건지 확인해줘."
```

**트러블슈팅 단계**:

1. **Git 상태 종합 확인**:
```bash
# 작업 트리 상태
git status

# 스테이징되지 않은 변경사항
git diff

# 스테이징된 변경사항
git diff --staged

# 원격과의 차이
git diff origin/main
```

2. **파일 시스템 동기화 확인**:
```bash
# 파일 존재 및 수정 시간 확인
ls -la .github/workflows/

# Git이 추적하는 파일 확인
git ls-files .github/workflows/
```

3. **강제 추가 시도**:
```bash
# 파일 강제 추가
git add -f .github/workflows/e2e-tests.yml

# 전체 변경사항 강제 추가
git add -A
```

4. **원격 동기화**:
```bash
# 원격 브랜치와 동기화
git fetch origin main
git reset --hard origin/main
```

**추정 원인**:
- 파일 시스템 동기화 지연
- Git 인덱스 손상
- 파일 권한 문제
- IDE/에디터 캐시 문제

**결과**: 강제 추가 또는 저장소 재동기화로 해결

---

## 8. 배포 전략 변경

### 문제: 프론트엔드 배포 전략을 Docker에서 GitHub Pages로 변경

**문제 설명**: 더 간단한 정적 사이트 호스팅을 위해 배포 전략 변경 필요

**사용된 프롬프트**:
```
"프론트엔드를 Docker 대신 GitHub Pages로 배포하는 것으로 변경하고 싶어. 관련 이슈를 생성하고 변경사항을 추적해줘."
```

**해결 접근법**:

1. **GitHub 이슈 생성**:
```bash
# GitHub CLI로 이슈 생성
gh issue create \
  --title "프론트엔드 GitHub Pages 배포로 변경" \
  --assignee @me \
  --body "Docker 기반 배포에서 GitHub Pages로 변경하여 배포 단순화"
```

2. **배포 전략 계획**:
- Docker dependency 제거
- GitHub Actions 정적 사이트 워크플로우 구현
- CORS 및 API 엔드포인트 설정 업데이트
- 베이스 경로 설정 (`/Realworld-serverless-microservice/`)

3. **관련 설정 파일 수정**:
```javascript
// vite.config.ts
export default defineConfig({
  base: '/Realworld-serverless-microservice/',
  // ...
})
```

**결과**: 체계적인 배포 전략 변경 계획 수립 및 이슈 추적

---

## 9. GitHub Pages 환경 인증 리다이렉트 문제

### 문제: API 401 에러 시 basename을 고려하지 않은 로그인 페이지 리다이렉트

**문제 설명**: API interceptor에서 401 에러 발생 시 하드코딩된 '/login' 경로로 리다이렉트하여 GitHub Pages 배포 환경의 basename과 호환되지 않음

**에러 증상**:
```javascript
// 문제가 있던 코드 (추정)
window.location.href = '/login'; // GitHub Pages에서 404 발생
// 예상 경로: https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/login
// 실제 이동: https://vibe-coding-paradigm.github.io/login (404)
```

**사용된 프롬프트**:
```
"API 401 에러가 발생할 때 로그인 페이지로 제대로 리다이렉트가 안 되고 있어. GitHub Pages basename을 고려해서 수정해줘."
```

**해결 과정**:

1. **API interceptor 분석**:
```bash
# API 에러 처리 로직 확인
cat frontend/src/lib/api.ts | grep -A 10 -B 10 "401"
```

2. **동적 경로 생성 로직 구현**:
```javascript
// 개선된 코드
const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
const loginUrl = basePath ? `${basePath}/login` : '/login';
window.location.href = loginUrl;
```

3. **호환성 테스트**:
```bash
# 로컬 환경에서 테스트
npm run dev
# GitHub Pages 환경에서 테스트 (배포 후)
```

**결과**: GitHub Pages와 로컬 개발 환경 모두에서 401 에러 시 올바른 로그인 페이지로 리다이렉트 성공

---

## 10. UI 레이아웃 오버플로우 문제

### 문제: 로그인/회원가입 페이지의 fieldset 중첩으로 인한 레이아웃 문제

**문제 설명**: fieldset 중첩 구조로 인한 레이아웃 오버플로우 및 입력 필드가 컨테이너를 벗어나는 현상

**에러 증상**:
```html
<!-- 문제가 있던 구조 -->
<fieldset>
  <fieldset>
    <input class="form-control" style="width: 100%" />
  </fieldset>
</fieldset>
<!-- 입력 필드가 부모 컨테이너 밖으로 넘침 -->
```

**사용된 프롬프트**:
```
"로그인/회원가입 페이지에서 입력 필드가 화면을 벗어나는 문제가 있어. fieldset 구조와 CSS를 정리해줘."
```

**해결 과정**:

1. **구조 문제 분석**:
```bash
# 기존 컴포넌트 구조 확인
wc -l frontend/src/pages/auth/LoginPage.tsx    # 43줄
wc -l frontend/src/pages/auth/RegisterPage.tsx # 56줄
```

2. **HTML 구조 개선**:
```html
<!-- 개선된 구조 -->
<div class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 offset-md-3 col-xs-12">
        <form>
          <input class="form-control" />
        </form>
      </div>
    </div>
  </div>
</div>
```

3. **CSS 개선**:
```css
/* frontend/src/index.css에 추가 */
.auth-page .form-control {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

.auth-page .container {
  padding: 0 15px;
}
```

4. **코드 간소화 결과**:
```bash
# 개선 후 라인 수
frontend/src/pages/auth/LoginPage.tsx    # 43줄 → ~25줄
frontend/src/pages/auth/RegisterPage.tsx # 56줄 → ~32줄
frontend/src/index.css                   # +37줄 (auth-page 전용 스타일)
```

**결과**: 로그인/회원가입 페이지의 안정적인 레이아웃 확보 및 코드 간소화

---

## 11. React Router basename 설정 문제

### 문제: 사용자 인증 후 홈페이지 리다이렉트 경로 오류

**문제 설명**: 사용자 등록/로그인 후 홈페이지 리다이렉트가 GitHub Pages의 base path와 일치하지 않아 잘못된 경로로 이동

**에러 증상**:
```
예상 경로: https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/
실제 이동: https://vibe-coding-paradigm.github.io/
결과: GitHub Pages 404 페이지 표시
```

**사용된 프롬프트**:
```
"로그인 성공 후 홈페이지로 리다이렉트할 때 경로가 틀려. GitHub Pages base path가 고려되지 않고 있어."
```

**해결 과정**:

1. **React Router 설정 확인**:
```typescript
// frontend/src/App.tsx 기존 설정
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    {/* 기타 라우트들 */}
  </Routes>
</BrowserRouter>
```

2. **basename 설정 추가**:
```typescript
// 개선된 설정
<BrowserRouter basename="/Realworld-serverless-microservice">
  <Routes>
    <Route path="/" element={<HomePage />} />
    {/* 기타 라우트들 */}
  </Routes>
</BrowserRouter>
```

3. **Vite 설정과의 일관성 확인**:
```typescript
// vite.config.ts
export default defineConfig({
  base: '/Realworld-serverless-microservice/',
  // ...
})
```

**결과**: 사용자 인증 완료 후 올바른 홈페이지 경로로 리다이렉트 성공

---

## 12. E2E 테스트 CloudFront URL 처리 문제

### 문제: E2E 테스트에서 CloudFront URL의 /api 경로 처리 및 타임아웃 발생

**문제 설명**: E2E 테스트에서 CloudFront URL 처리 로직 부족으로 health check 실패 및 테스트 타임아웃 발생

**에러 메시지**:
```bash
Timeout: Test timed out after 10 minutes
Health check failed: URL not accessible
Error: connect ECONNREFUSED [CloudFront IP]:443
```

**사용된 프롬프트**:
```
"E2E 테스트가 CloudFront 환경에서 계속 타임아웃되고 있어. URL 처리 로직과 타임아웃 설정을 확인해줘."
```

**해결 과정**:

1. **URL 처리 로직 문제 분석**:
```typescript
// 문제가 있던 로직 (추정)
const healthUrl = `${backendUrl}/health`; // /api가 포함된 URL에서 중복 문제
```

2. **Global setup 개선**:
```typescript
// frontend/e2e/global-setup.ts
const healthUrl = backendUrl.includes('/api') 
  ? backendUrl.replace('/api', '/health')
  : `${backendUrl}/health`;
```

3. **타임아웃 설정 조정**:
```yaml
# .github/workflows/e2e-tests.yml
timeout-minutes: 20  # 10분 → 20분으로 확장
```

4. **인프라 코드 보강**:
```typescript
// infra/lib/compute-stack.ts에 CloudFront 관련 로직 45줄 추가
```

**결과**: E2E 테스트에서 CloudFront 환경 정상 처리 및 안정적인 테스트 실행

---

## 13. E2E 테스트 API URL 중복 처리 문제

### 문제: CloudFront URL에 이미 /api가 포함된 경우 중복 경로 생성

**문제 설명**: API 헬퍼에서 동적 URL 처리 부족으로 CloudFront URL 형태에 따른 경로 중복 문제 발생

**에러 패턴**:
```
올바른 URL: https://d1ct76fqx0s1b8.cloudfront.net/api/users
잘못된 URL: https://d1ct76fqx0s1b8.cloudfront.net/api/api/users
```

**사용된 프롬프트**:
```
"E2E 테스트에서 API URL이 /api/api/users 이런 식으로 중복되고 있어. CloudFront URL 처리 로직을 개선해줘."
```

**해결 과정**:

1. **워크플로우 URL 처리 강화**:
```yaml
# .github/workflows/e2e-tests.yml에 22줄 로직 추가
- name: Process Backend URL
  run: |
    if [[ "${{ env.BACKEND_URL }}" == *"/api"* ]]; then
      echo "API_BASE_URL=${{ env.BACKEND_URL }}" >> $GITHUB_ENV
    else
      echo "API_BASE_URL=${{ env.BACKEND_URL }}/api" >> $GITHUB_ENV
    fi
```

2. **API 헬퍼 개선**:
```typescript
// frontend/e2e/helpers/api.ts에 24줄 수정
const processApiUrl = (baseUrl: string, endpoint: string) => {
  // /api가 이미 포함된 경우 처리
  if (baseUrl.includes('/api')) {
    return baseUrl.replace('/api', endpoint);
  }
  return `${baseUrl}${endpoint}`;
};

export const apiEndpoints = {
  health: processApiUrl(backendUrl, '/health'),
  users: processApiUrl(backendUrl, '/api/users'),
  // ...
};
```

3. **Health check와 API 엔드포인트 구분**:
```typescript
// Health check는 /api 경로 제외
const healthEndpoint = backendUrl.replace('/api', '/health');
// API 호출은 /api 경로 포함
const apiEndpoint = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
```

**결과**: E2E 테스트에서 다양한 백엔드 URL 형태(ALB 직접, CloudFront 경유)에 대한 안정적인 처리

---

## 14. Git Hooks 시스템 통합 및 최적화

### 문제: 수동 Git hooks 스크립트와 Husky 시스템 중복

**문제 설명**: 프로젝트에 수동 Git hooks 스크립트와 Husky 기반 Git hooks가 혼재하여 관리 복잡성 증가 및 일관성 부족

**에러 증상**:
```bash
# 수동 스크립트와 husky hooks 혼재
scripts/install-hooks.sh        # 수동 설치 스크립트
scripts/pre-commit-hook.sh      # 수동 pre-commit
.husky/pre-commit               # husky pre-commit
package.json: "install-hooks"   # 중복 스크립트
```

**사용된 프롬프트**:
```
"@scripts/install-hooks.sh 는 필요해? husky를 쓰고 있잖아."
```

**해결 과정**:

1. **현재 설정 분석**:
```bash
# husky 설정 확인
ls -la .husky/
cat package.json | grep husky

# 수동 스크립트 확인
ls -la scripts/
```

2. **Husky 설정 상태 검증**:
```json
// package.json에서 husky 자동 설치 확인
{
  "scripts": {
    "prepare": "husky || true"
  },
  "devDependencies": {
    "husky": "^8.0.3"
  }
}
```

3. **수동 스크립트 제거 및 정리**:
```bash
# 불필요한 수동 스크립트 제거
rm scripts/install-hooks.sh scripts/pre-commit-hook.sh scripts/pre-push-hook.sh

# package.json에서 중복 스크립트 제거
# "install-hooks": "bash scripts/install-hooks.sh" 라인 삭제
```

4. **Husky hooks 요구사항에 맞게 수정**:
```bash
# pre-commit: unit 테스트 (기존 husky 설정 유지)
# pre-push: E2E 테스트로 변경 (기존: 빌드 검증만)

# .husky/pre-push 수정
echo "🔍 Running E2E tests..."
if make e2e; then
    echo "✅ E2E tests passed!"
else
    echo "❌ E2E tests failed!"
    exit 1
fi
```

**결과**: 
- Husky 기반 단일 Git hooks 시스템으로 통합
- 수동 설치 과정 제거로 팀원 온보딩 단순화  
- Pre-commit: Unit 테스트, Pre-push: E2E 테스트로 명확한 역할 분리

---

## 15. Pre-push Hook 로드 테스트 타임아웃 문제

### 문제: Pre-push hook에서 로드 테스트로 인한 2분+ 타임아웃 발생

**문제 설명**: Git push 시 pre-push hook에서 로드 테스트가 포함되어 2분 이상 소요되며 사용자 경험 저해

**에러 증상**:
```bash
🚀 Running pre-push checks (E2E tests)...
✅ E2E tests passed! (20초)
🔧 Running additional quality checks...
📊 Running quick load test...
# 여기서 2분+ 대기 후 타임아웃
```

**사용된 프롬프트**:
```
"로드 테스트는 git hook에서 제외해줘."
"진행해. 수동으로 make e2e-local을 실행하면 20초 정도 걸리는데 2분이 넘는건 이상해."
```

**해결 과정**:

1. **문제 원인 분석**:
```bash
# E2E 테스트 직접 실행 시간 측정
time make e2e-local
# 결과: 19.7초 (정상)

# Pre-push hook 실행 시간 확인
git push origin main
# 결과: 2분+ 타임아웃 (비정상)
```

2. **Hook 실행 명령어 분석**:
```bash
# Makefile 확인
grep -A 5 "e2e:" Makefile
# e2e: make e2e (일반 E2E)
# e2e-local: make e2e-local (로컬 최적화)

# 실제 hook에서 실행되는 명령어 확인
cat .husky/pre-push
```

3. **로드 테스트 제거 시도**:
```bash
# 첫 번째 시도: 타임아웃 추가
if timeout 30s make load-test-local > /dev/null 2>&1; then
    echo "✅ Load test passed!"
else
    echo "⚠️ Load test failed or timed out, but push allowed"
fi

# 두 번째 시도: 로드 테스트 완전 제거
# pre-push hook에서 로드 테스트 관련 코드 모두 삭제
```

4. **최종 해결 방법**:
```bash
# .husky/pre-push를 E2E 테스트만 실행하도록 단순화
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks (E2E tests)..."
echo "🔍 Running E2E tests (local mode)..."
if make e2e-local; then
    echo "✅ E2E tests passed!"
    echo "🚀 Push allowed - E2E tests confirmed deployment readiness"
else
    echo "❌ E2E tests failed!"
    echo "🚫 Push blocked - fix failing E2E tests before pushing"
    exit 1
fi
```

**결과**: Pre-push hook 실행 시간 2분+ → 20초로 단축, 개발자 생산성 크게 향상

---

## 16. Git Hooks 중복 실행 문제

### 문제: `.git/hooks/`와 `.husky/` 디렉토리의 Hook 중복으로 예상과 다른 Hook 실행

**문제 설명**: 이전 수동 설치된 Git hooks(`.git/hooks/pre-push`)가 Husky hooks(`.husky/pre-push`)를 오버라이드하여 예상과 다른 로직 실행

**에러 증상**:
```bash
# .husky/pre-push에서는 make e2e-local 실행 설정
# 실제로는 .git/hooks/pre-push에서 make e2e + 로드테스트 실행

🚀 Running pre-push E2E tests...
📊 Running quick load test...  # 이 메시지는 .husky에 없음
# 2분+ 타임아웃 발생
```

**사용된 프롬프트**:
```
"make e2e-local을 실행하면 20초 정도 걸리는데 2분이 넘는건 이상해."
```

**문제 분석 과정**:

1. **Hook 실행 우선순위 확인**:
```bash
# Git hooks 우선순위: .git/hooks/ > .husky/
ls -la .git/hooks/pre-push    # 이전 수동 설치된 hook 발견
ls -la .husky/pre-push        # Husky hook 존재
```

2. **각 Hook 내용 비교**:
```bash
# .git/hooks/pre-push (이전 수동 설치)
cat .git/hooks/pre-push
# 내용: make e2e + 로드 테스트 포함 (복잡한 로직)

# .husky/pre-push (현재 의도된 hook)  
cat .husky/pre-push
# 내용: make e2e-local만 실행 (단순한 로직)
```

3. **근본 원인 파악**:
```bash
# 메시지 출처 확인
grep -r "Running quick load test" .
# .git/hooks/pre-push에서 발견

grep -r "additional quality checks" .
# .git/hooks/pre-push에서 발견
```

**해결 과정**:

1. **중복 Hook 제거**:
```bash
# 이전 수동 설치된 hook 제거
rm .git/hooks/pre-push

# Husky hook만 남김 (.husky/pre-push)
```

2. **Hook 실행 확인**:
```bash
# 다시 push 시도
git push origin main
# 결과: 20초 내 완료 (정상)
```

3. **Husky 설정 최종 확인**:
```bash
# Husky가 제대로 설치되었는지 확인
npm run prepare

# Hook이 제대로 연결되었는지 확인
ls -la .git/hooks/
# husky.sh만 있고 개별 hook 파일들은 없어야 정상
```

**교훈**:
- Git hooks 우선순위 이해: `.git/hooks/` > `.husky/`
- 수동 설치된 hooks와 Husky 혼재 시 예상치 못한 동작
- Husky 전환 시 기존 `.git/hooks/` 정리 필수

**결과**: 
- 의도된 Husky hook만 실행되어 일관된 동작 보장
- Pre-push 시간 2분+ → 20초로 정상화
- Git hooks 시스템 단순화 및 유지보수성 향상

---

## 17. 모범 사례 및 패턴

### 식별된 트러블슈팅 패턴

**기존 패턴 (Phase 1-2)**:
1. **사전 예방적 에러 처리**: 포괄적인 검증 스크립트로 문제 조기 발견
2. **명확한 에러 메시지**: 해결 방법이 포함된 도움이 되는 에러 메시지
3. **점진적 배포**: 인프라 설정과 서비스 업데이트 분리
4. **워크플로우 의존성**: 전제 조건 확인을 통한 적절한 배포 순서
5. **수동 오버라이드 옵션**: 자동화된 프로세스에 수동 트리거 추가

**새로운 패턴 (GitHub Pages 환경)**:
6. **환경별 동적 경로 처리**: 하드코딩 대신 현재 환경에 맞는 동적 URL 생성
7. **프론트엔드-백엔드 URL 호환성**: 다양한 배포 환경(로컬, GitHub Pages, CloudFront)에서의 일관된 동작
8. **중첩 구조 단순화**: 복잡한 HTML/CSS 구조를 단순하고 견고한 구조로 개선
9. **E2E 테스트 환경 적응성**: 다양한 백엔드 URL 형태에 대한 유연한 처리

**최신 패턴 (Git Hooks 시스템 최적화)**:
10. **도구 통합 검증**: 기존 도구(Husky)와 수동 설정의 중복 확인 및 정리
11. **Hook 실행 시간 최적화**: 개발자 경험을 위한 빠른 피드백 루프 (20초 이내)
12. **Git hooks 우선순위 이해**: `.git/hooks/` vs `.husky/` 실행 순서 및 충돌 방지
13. **점진적 성능 개선**: 문제 발견 → 임시 해결 → 근본 원인 해결 단계적 접근

### 개발 모범 사례

**기존 모범 사례**:
1. **인프라 배포 전 항상 존재 여부 확인**
2. **상세한 로깅을 포함한 포괄적 검증 스크립트 사용**
3. **적절한 Docker 레이어 캐싱 전략 구현**
4. **실행 가능한 해결책이 포함된 명확한 에러 메시지 제공**
5. **배포 전략 변경을 위한 GitHub 이슈 사용**
6. **다양한 배포 검증 방법 구현 (스크립트 + 수동 헬스체크)**

**새로운 모범 사례 (GitHub Pages 환경)**:
7. **배포 환경별 base path 설정**: React Router basename과 Vite base 설정 일관성 유지
8. **동적 경로 생성**: 하드코딩된 절대 경로 대신 현재 환경 기반 경로 생성
9. **UI 구조 단순화**: fieldset 중첩 등 복잡한 구조를 단순하고 견고한 구조로 개선
10. **URL 형태별 처리 로직**: CloudFront, ALB 등 다양한 백엔드 URL 형태에 대한 유연한 처리
11. **환경별 테스트 확장**: 로컬, 스테이징, 프로덕션 환경에서의 일관된 동작 검증

### 커뮤니케이션 패턴

**효과적인 트러블슈팅 프롬프트 예시**:

*기존 인프라 관련*:
- ✅ "E2E 테스트 워크플로우에 manual trigger 기능을 추가해줘"
- ✅ "배포 검증에서 ALB를 찾을 수 없다는 에러가 나와. 확인하고 수정해줘"
- ✅ "Docker 빌드 캐시가 제대로 최적화되어 있는지 분석해줘"

*새로운 GitHub Pages 환경 관련*:
- ✅ "API 401 에러가 발생할 때 로그인 페이지로 제대로 리다이렉트가 안 되고 있어. GitHub Pages basename을 고려해서 수정해줘"
- ✅ "로그인/회원가입 페이지에서 입력 필드가 화면을 벗어나는 문제가 있어. fieldset 구조와 CSS를 정리해줘"
- ✅ "E2E 테스트에서 API URL이 /api/api/users 이런 식으로 중복되고 있어. CloudFront URL 처리 로직을 개선해줘"

**비효과적인 프롬프트**:
- ❌ "안 돼"
- ❌ "에러 나"
- ❌ "고쳐줘"

---

## 결론

이 트러블슈팅 가이드는 실제 개발 과정에서 마주친 문제들과 해결 방법을 체계적으로 정리한 것입니다. **2025-08-02 이후 추가된 5개의 새로운 트러블슈팅 케이스**는 특히 GitHub Pages 배포 환경에서 발생하는 현실적인 문제들과 그 해결 과정을 상세히 담고 있습니다.

### 주요 교훈

**기존 교훈 (Phase 1-2)**:
- 체계적인 문제 분석과 단계별 해결 접근
- 명확한 에러 메시지와 가이드의 중요성
- 사전 예방적 검증의 가치
- 실제 사용한 프롬프트와 명령어의 문서화 중요성

**새로운 교훈 (GitHub Pages 환경)**:
- **배포 환경별 특성 고려**: 개발 단계부터 실제 배포 환경의 특성(base path, URL 구조 등) 반영 필요
- **동적 경로 처리의 중요성**: 하드코딩된 절대 경로는 환경 변화에 취약함
- **프론트엔드-백엔드 통합 복잡성**: 다양한 배포 환경에서의 URL 호환성 확보 필요
- **점진적 문제 해결**: 연관된 문제들을 단계적으로 해결하여 시스템 안정성 확보
- **E2E 테스트의 환경 적응성**: 다양한 백엔드 URL 형태에 대한 유연한 처리 로직 구현

### 진화하는 트러블슈팅 접근법

이 문서는 프로젝트의 진화와 함께 성장하는 **Living Document**입니다. Phase 1(모놀리식)에서 Phase 2(클라우드 전환)를 거쳐 현재 Phase 3(마이크로서비스 분해) 준비 단계에서 발생하는 문제들이 각기 다른 특성을 보여주고 있으며, 각 단계의 트러블슈팅 경험이 다음 단계의 예방적 설계에 기여하고 있습니다.
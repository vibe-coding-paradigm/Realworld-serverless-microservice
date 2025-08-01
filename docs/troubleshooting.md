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
9. [모범 사례 및 패턴](#9-모범-사례-및-패턴)

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

## 9. 모범 사례 및 패턴

### 식별된 트러블슈팅 패턴

1. **사전 예방적 에러 처리**: 포괄적인 검증 스크립트로 문제 조기 발견
2. **명확한 에러 메시지**: 해결 방법이 포함된 도움이 되는 에러 메시지
3. **점진적 배포**: 인프라 설정과 서비스 업데이트 분리
4. **워크플로우 의존성**: 전제 조건 확인을 통한 적절한 배포 순서
5. **수동 오버라이드 옵션**: 자동화된 프로세스에 수동 트리거 추가

### 개발 모범 사례

1. **인프라 배포 전 항상 존재 여부 확인**
2. **상세한 로깅을 포함한 포괄적 검증 스크립트 사용**
3. **적절한 Docker 레이어 캐싱 전략 구현**
4. **실행 가능한 해결책이 포함된 명확한 에러 메시지 제공**
5. **배포 전략 변경을 위한 GitHub 이슈 사용**
6. **다양한 배포 검증 방법 구현 (스크립트 + 수동 헬스체크)**

### 커뮤니케이션 패턴

**효과적인 트러블슈팅 프롬프트 예시**:
- ✅ "E2E 테스트 워크플로우에 manual trigger 기능을 추가해줘"
- ✅ "배포 검증에서 ALB를 찾을 수 없다는 에러가 나와. 확인하고 수정해줘"
- ✅ "Docker 빌드 캐시가 제대로 최적화되어 있는지 분석해줘"

**비효과적인 프롬프트**:
- ❌ "안 돼"
- ❌ "에러 나"
- ❌ "고쳐줘"

---

## 결론

이 트러블슈팅 가이드는 실제 개발 과정에서 마주친 문제들과 해결 방법을 체계적으로 정리한 것입니다. 각 케이스는 재현 가능한 해결책과 함께 향후 유사한 문제 발생 시 참조할 수 있는 실용적인 가이드를 제공합니다.

**주요 교훈**:
- 체계적인 문제 분석과 단계별 해결 접근
- 명확한 에러 메시지와 가이드의 중요성
- 사전 예방적 검증의 가치
- 실제 사용한 프롬프트와 명령어의 문서화 중요성
# Deployment Verification - AWS 배포 검증 스크립트

RealWorld 애플리케이션의 AWS 인프라 배포 완료 후 모든 리소스가 올바르게 생성되고 동작하는지 검증하는 Node.js 스크립트입니다.

## 📋 개요

- **목적**: AWS ECS/Fargate 배포 후 인프라 상태 자동 검증
- **언어**: Node.js + AWS SDK v3
- **실행 환경**: GitHub Actions 및 로컬 개발 환경
- **검증 범위**: ECS, ALB, IAM, CloudWatch, ECR 등 전체 인프라

## 🏗️ 스크립트 구조

```
infra/verify-deployment/
├── verify-deployment.js     # 메인 검증 스크립트
├── package.json            # Node.js 의존성 및 스크립트 정의
├── package-lock.json       # 의존성 잠금 파일
├── node_modules/           # 설치된 Node.js 패키지
└── README.md              # 이 문서
```

## 🔍 검증 항목

### 1. ECS 클러스터 검증
```javascript
// 클러스터 존재 여부 및 상태 확인
- 클러스터 이름: conduit-cluster
- 활성 상태 확인
- 등록된 컨테이너 인스턴스 수
- 실행 중인 작업 수
```

**검증 내용**:
- ✅ 클러스터가 ACTIVE 상태인지 확인
- ✅ 클러스터에 서비스가 등록되어 있는지 확인
- ✅ 클러스터 태그 및 설정 검증

### 2. ECS 서비스 검증
```javascript
// 서비스 상태 및 구성 확인
- 서비스 이름: conduit-backend
- 원하는 작업 수 vs 실행 중인 작업 수
- 서비스 배포 상태
- 로드 밸런서 연결 상태
```

**검증 내용**:
- ✅ 서비스가 ACTIVE 상태인지 확인
- ✅ 원하는 작업 수(desiredCount)와 실행 중인 작업 수(runningCount) 일치 확인
- ✅ 배포 상태가 STEADY인지 확인
- ✅ 로드 밸런서 타겟 그룹 연결 상태 확인

### 3. 작업 정의 (Task Definition) 검증
```javascript
// Task Definition 설정 및 최신 버전 확인
- 패밀리: conduit-backend
- CPU/메모리 할당
- 컨테이너 이미지 URI
- 환경 변수 설정
```

**검증 내용**:
- ✅ 최신 Task Definition 리비전 사용 확인
- ✅ 컨테이너 이미지가 ECR에서 올바르게 참조되는지 확인
- ✅ 필수 환경 변수 (JWT_SECRET, PORT) 설정 확인
- ✅ CPU/메모리 리소스 할당이 올바른지 확인

### 4. Application Load Balancer (ALB) 검증
```javascript
// ALB 상태 및 구성 확인
- ALB 이름: conduit-alb
- 리스너 및 규칙 설정
- 대상 그룹 연결 상태
- 헬스 체크 설정
```

**검증 내용**:
- ✅ ALB가 ACTIVE 상태이고 인터넷에 연결되어 있는지 확인
- ✅ HTTP 리스너가 포트 80에서 동작하는지 확인
- ✅ 대상 그룹에 ECS 작업이 등록되어 있는지 확인
- ✅ 헬스 체크가 통과하는지 확인

### 5. 대상 그룹 (Target Group) 헬스 체크
```javascript
// ECS 작업들의 헬스 상태 확인
- 등록된 대상(타겟) 수
- 헬스 체크 통과 상태
- 응답 시간 및 상태 코드
```

**검증 내용**:
- ✅ 모든 등록된 타겟이 healthy 상태인지 확인
- ✅ 헬스 체크 경로 (/health)에서 올바른 응답을 받는지 확인
- ✅ 연결 시간 초과나 실패가 없는지 확인

### 6. ECR 리포지토리 및 이미지 검증
```javascript
// 컨테이너 이미지 저장소 및 이미지 확인
- 리포지토리 이름: conduit-backend
- 최신 이미지 태그 확인
- 이미지 크기 및 업로드 시간
```

**검증 내용**:
- ✅ ECR 리포지토리가 존재하고 접근 가능한지 확인
- ✅ 최신 이미지가 업로드되어 있는지 확인
- ✅ 이미지 태그가 올바르게 설정되어 있는지 확인

### 7. IAM 역할 및 정책 검증
```javascript
// ECS 작업 실행을 위한 IAM 권한 확인
- Task Execution Role
- Task Role (필요한 경우)
- 필수 정책 연결 상태
```

**검증 내용**:
- ✅ ECS Task Execution Role이 존재하고 올바른 정책이 연결되어 있는지 확인
- ✅ ECR 이미지 풀링을 위한 권한이 있는지 확인
- ✅ CloudWatch 로그 그룹 생성 권한이 있는지 확인

### 8. CloudWatch 로그 그룹 검증
```javascript
// 로그 수집 및 저장 설정 확인
- 로그 그룹 이름: /ecs/conduit-backend
- 로그 보존 기간 설정
- 최근 로그 스트림 존재 여부
```

**검증 내용**:
- ✅ CloudWatch 로그 그룹이 생성되어 있는지 확인
- ✅ 로그 스트림이 활성 상태인지 확인
- ✅ 최근 로그 엔트리가 수집되고 있는지 확인

## 🚀 실행 방법

### 사전 요구사항
- **Node.js 18+** 설치
- **AWS CLI** 설정 및 인증
- **적절한 AWS IAM 권한** (ECS, ALB, ECR, IAM, CloudWatch 읽기 권한)

### 로컬에서 실행

1. **의존성 설치**
   ```bash
   cd infra/verify-deployment
   npm install
   ```

2. **AWS 자격 증명 설정**
   ```bash
   # AWS CLI 프로필 사용
   export AWS_PROFILE=your-profile
   
   # 또는 환경 변수로 직접 설정
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_DEFAULT_REGION=ap-northeast-2
   ```

3. **환경 변수 설정**
   ```bash
   # 필수 환경 변수
   export ECS_CLUSTER=conduit-cluster
   export ECS_SERVICE=conduit-backend
   export AWS_REGION=ap-northeast-2
   export ECR_REPOSITORY=conduit-backend
   ```

4. **검증 스크립트 실행**
   ```bash
   # 메인 스크립트 직접 실행
   node verify-deployment.js
   
   # 또는 npm 스크립트 사용
   npm run verify
   npm run verify-deployment
   ```

### GitHub Actions에서 자동 실행

이 스크립트는 백엔드 배포 워크플로우에서 자동으로 실행됩니다:

```yaml
# .github/workflows/backend-deploy.yml
- name: Verify deployment with AWS SDK
  env:
    ECS_CLUSTER: ${{ vars.ECS_CLUSTER }}
    ECS_SERVICE: ${{ vars.ECS_SERVICE }}
    AWS_REGION: ${{ vars.AWS_REGION }}
    ECR_REPOSITORY: ${{ vars.ECR_REPOSITORY }}
  run: |
    cd infra/verify-deployment
    npm install
    sleep 30  # 작업 전환 대기
    node verify-deployment.js
```

## 📊 출력 예시

### 성공적인 검증 출력
```
🔍 Starting comprehensive deployment verification...
Verifying deployment of:
  - Cluster: conduit-cluster
  - Service: conduit-backend
  - Region: ap-northeast-2
  - Repository: conduit-backend

✅ ECS Cluster 'conduit-cluster' is ACTIVE
   - Active services: 1
   - Running tasks: 1
   - Pending tasks: 0

✅ ECS Service 'conduit-backend' is ACTIVE and STEADY
   - Desired tasks: 1
   - Running tasks: 1
   - Task definition: conduit-backend:6

✅ Task Definition 'conduit-backend:6' verification passed
   - CPU: 256, Memory: 512 MiB
   - Container image: 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/conduit-backend:latest
   - Environment variables: JWT_SECRET, PORT configured

✅ Application Load Balancer 'conduit-alb' is ACTIVE
   - DNS Name: conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com
   - Scheme: internet-facing
   - State: active

✅ Target Group health check passed
   - Registered targets: 1
   - Healthy targets: 1
   - Health check path: /health

✅ ECR Repository 'conduit-backend' verification passed
   - Images available: 5
   - Latest image: 2024-01-15T10:30:00Z

✅ IAM Task Execution Role verification passed
   - Role: conduit-task-execution-role
   - Policies attached: AmazonECSTaskExecutionRolePolicy

✅ CloudWatch Log Group verification passed
   - Log group: /ecs/conduit-backend
   - Recent log streams: 3

🎉 All deployment verification checks passed!
✅ Infrastructure is healthy and ready to serve traffic.
```

### 실패 시 출력 예시
```
🔍 Starting comprehensive deployment verification...

❌ ECS Service 'conduit-backend' verification failed
   - Service state: ACTIVE
   - Running tasks: 0/1 (Desired: 1)
   - Last deployment status: FAILED

🔧 Debugging information:
   - Service ARN: arn:aws:ecs:ap-northeast-2:123456789012:service/conduit-cluster/conduit-backend
   - Task definition: conduit-backend:6
   - Launch type: FARGATE

💡 Suggested actions:
   1. Check ECS service events:
      aws ecs describe-services --cluster conduit-cluster --services conduit-backend --query 'services[0].events'
   
   2. Check task definition for configuration issues:
      aws ecs describe-task-definition --task-definition conduit-backend:6
   
   3. Review CloudWatch logs:
      aws logs tail /ecs/conduit-backend --follow

❌ Deployment verification failed. Please check the issues above.
```

## 🔧 스크립트 커스터마이징

### 환경 변수 설정
```javascript
// verify-deployment.js에서 사용하는 환경 변수들
const config = {
  region: process.env.AWS_REGION || 'ap-northeast-2',
  clusterName: process.env.ECS_CLUSTER || 'conduit-cluster',
  serviceName: process.env.ECS_SERVICE || 'conduit-backend',
  repositoryName: process.env.ECR_REPOSITORY || 'conduit-backend',
  albName: 'conduit-alb',
  logGroupName: '/ecs/conduit-backend'
}
```

### 새로운 검증 항목 추가
```javascript
// 새로운 검증 함수 예시
async function verifyCustomResource() {
  try {
    console.log('🔍 Verifying custom resource...')
    
    // 검증 로직 구현
    const result = await customClient.send(new CustomCommand(params))
    
    if (result.Status === 'ACTIVE') {
      console.log('✅ Custom resource verification passed')
      return true
    } else {
      console.log('❌ Custom resource verification failed')
      return false
    }
  } catch (error) {
    console.error('❌ Error verifying custom resource:', error.message)
    return false
  }
}
```

### 타임아웃 및 재시도 설정
```javascript
// 재시도 로직 예시
async function verifyWithRetry(verifyFunction, maxRetries = 3, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await verifyFunction()
      if (result) return true
      
      if (i < maxRetries - 1) {
        console.log(`⏳ Retrying in ${delay/1000} seconds... (${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }
  return false
}
```

## 🐛 트러블슈팅

### 일반적인 문제들

1. **AWS 인증 오류**
   ```bash
   # AWS 자격 증명 확인
   aws sts get-caller-identity
   
   # AWS CLI 설정 확인
   aws configure list
   ```

2. **권한 부족 오류**
   ```bash
   # 필요한 IAM 권한들:
   - ecs:DescribeClusters
   - ecs:DescribeServices  
   - ecs:DescribeTasks
   - ecs:ListTasks
   - ecs:DescribeTaskDefinition
   - elasticloadbalancing:DescribeLoadBalancers
   - elasticloadbalancing:DescribeTargetGroups
   - elasticloadbalancing:DescribeTargetHealth
   - ecr:DescribeRepositories
   - ecr:DescribeImages
   - iam:GetRole
   - iam:ListAttachedRolePolicies
   - logs:DescribeLogGroups
   - logs:DescribeLogStreams
   ```

3. **환경 변수 미설정**
   ```bash
   # 필수 환경 변수 확인
   echo "Cluster: $ECS_CLUSTER"
   echo "Service: $ECS_SERVICE"
   echo "Region: $AWS_REGION"
   echo "Repository: $ECR_REPOSITORY"
   ```

4. **Node.js 의존성 문제**
   ```bash
   # 의존성 재설치
   rm -rf node_modules package-lock.json
   npm install
   
   # Node.js 버전 확인 (18+ 필요)
   node --version
   ```

### 디버깅 모드 활성화
```bash
# 상세 로그 출력
export DEBUG=1
node verify-deployment.js

# AWS SDK 디버그 로그
export AWS_SDK_JS_LOG=debug
node verify-deployment.js
```

## 📈 성능 및 최적화

### 병렬 검증 실행
스크립트는 독립적인 검증 항목들을 병렬로 실행하여 전체 실행 시간을 단축합니다:

```javascript
// 병렬 검증 실행 예시
const verificationPromises = [
  verifyECSCluster(),
  verifyECSService(),
  verifyApplicationLoadBalancer(),
  verifyECRRepository(),
  verifyIAMRoles(),
  verifyCloudWatchLogs()
]

const results = await Promise.allSettled(verificationPromises)
```

### 캐싱 및 결과 재사용
반복적인 API 호출을 줄이기 위해 결과를 캐시합니다:

```javascript
// 결과 캐싱 예시
const cache = new Map()

async function cachedDescribeService() {
  const cacheKey = `service-${config.clusterName}-${config.serviceName}`
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }
  
  const result = await ecsClient.send(new DescribeServicesCommand(params))
  cache.set(cacheKey, result)
  return result
}
```

## 🤝 기여하기

### 새로운 검증 항목 추가
1. `verify-deployment.js`에 새로운 검증 함수 작성
2. 메인 실행 플로우에 함수 추가
3. 테스트 케이스 작성
4. 문서 업데이트

### 에러 처리 개선
1. 구체적인 에러 메시지 제공
2. 해결 방법 가이드 추가
3. 자동 복구 로직 구현 (가능한 경우)

### 성능 최적화
1. API 호출 횟수 최소화
2. 병렬 처리 확장
3. 결과 캐싱 개선

---

**참고 자료**:
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Amazon ECS API Reference](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/)
- [Elastic Load Balancing API Reference](https://docs.aws.amazon.com/elasticloadbalancing/latest/APIReference/)
- [AWS IAM API Reference](https://docs.aws.amazon.com/IAM/latest/APIReference/)
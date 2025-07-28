# Infrastructure - AWS CDK

RealWorld 애플리케이션의 AWS 클라우드 인프라 구성을 정의하는 CDK (Cloud Development Kit) 프로젝트입니다.

## 📋 개요

- **IaC 도구**: AWS CDK (TypeScript)
- **클라우드 제공자**: Amazon Web Services (AWS)
- **배포 대상**: ECS/Fargate, Application Load Balancer, VPC
- **관리 방식**: Infrastructure as Code (코드형 인프라)

## 🏗️ 인프라 아키텍처

### 현재 배포된 구성 (Phase 2)
```
┌─────────────────────────────────────────────────────────────┐
│                        Internet Gateway                      │
└─────────────────────────┬───────────────────────────────────┘
                         │
┌─────────────────────────▼───────────────────────────────────┐
│                         VPC                                │
│  ┌─────────────────┐    │    ┌─────────────────┐           │
│  │   Public Subnet │    │    │   Public Subnet │           │
│  │   (AZ-a)        │    │    │   (AZ-c)        │           │
│  │                 │    │    │                 │           │
│  │  ┌───────────┐  │    │    │  ┌───────────┐  │           │
│  │  │    ALB    │◄─┼────┼────┼──►    ECS     │  │           │
│  │  │(Load      │  │    │    │  │ Fargate   │  │           │
│  │  │Balancer)  │  │    │    │  │  Tasks    │  │           │
│  │  └───────────┘  │    │    │  └───────────┘  │           │
│  └─────────────────┘    │    └─────────────────┘           │
└─────────────────────────┼───────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │   ECR   │
                    │(Registry)│
                    └─────────┘
```

## 📁 프로젝트 구조

```
infra/
├── lib/                 # CDK 스택 정의
│   ├── infra-stack.ts      # 메인 스택 (진입점)
│   ├── compute-stack.ts    # ECS/Fargate 컴퓨팅 리소스
│   └── storage-stack.ts    # 스토리지 리소스 (미래 사용)
├── bin/                 # CDK 앱 진입점
│   └── infra.ts
├── test/                # 인프라 테스트
│   └── infra.test.ts
├── verify-deployment/   # 배포 검증 스크립트
│   ├── verify-deployment.js  # ECS 서비스 배포 검증 로직
│   ├── package.json         # Node.js 의존성
│   └── package-lock.json    # 의존성 잠금 파일
├── cdk.json            # CDK 설정 파일
├── cdk.context.json    # CDK 컨텍스트 캐시
├── cdk.out/            # CDK 생성된 CloudFormation 템플릿
├── package.json        # Node.js 의존성
├── tsconfig.json       # TypeScript 설정
└── jest.config.js      # 테스트 설정
```

## 🚀 배포된 리소스

### 1. VPC 및 네트워킹
```typescript
// VPC: 격리된 가상 네트워크
const vpc = new ec2.Vpc(this, 'ConduitVPC', {
  maxAzs: 2,
  natGateways: 0,  // 비용 절약을 위해 NAT Gateway 제외
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24
    }
  ]
})
```

### 2. ECS 클러스터 및 서비스
```typescript
// ECS 클러스터: 컨테이너 오케스트레이션
const cluster = new ecs.Cluster(this, 'ConduitCluster', {
  vpc,
  clusterName: 'conduit-cluster'
})

// Fargate 서비스: 서버리스 컨테이너 실행
const service = new ecs.FargateService(this, 'ConduitService', {
  cluster,
  taskDefinition,
  serviceName: 'conduit-backend',
  desiredCount: 1,
  assignPublicIp: true
})
```

### 3. Application Load Balancer
```typescript
// ALB: 부하 분산 및 외부 노출
const alb = new elbv2.ApplicationLoadBalancer(this, 'ConduitALB', {
  vpc,
  internetFacing: true,
  loadBalancerName: 'conduit-alb'
})

// 현재 배포: conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com
```

### 4. Task Definition
```typescript
// 컨테이너 실행 정의
const taskDefinition = new ecs.FargateTaskDefinition(this, 'ConduitTaskDef', {
  memoryLimitMiB: 512,
  cpu: 256,
  family: 'conduit-backend'
})

// 환경 변수 설정
container.addEnvironment('JWT_SECRET', 'your-super-secure-jwt-secret-key-for-conduit-app-2025')
container.addEnvironment('PORT', '8080')
```

### 5. ECR Repository
```typescript
// 컨테이너 이미지 저장소
const repository = new ecr.Repository(this, 'ConduitRepository', {
  repositoryName: 'conduit-backend',
  lifecycleRules: [{
    maxImageCount: 10  // 이미지 개수 제한으로 비용 관리
  }]
})
```

## 🛠️ 개발 및 배포

### 사전 요구사항
- **Node.js 18+** 설치
- **AWS CLI** 설치 및 설정
- **AWS CDK CLI** 설치: `npm install -g aws-cdk`
- **Docker** 설치 (이미지 빌드용)

### 로컬 개발 환경 설정

1. **의존성 설치**
   ```bash
   cd infra
   npm install
   ```

2. **AWS 계정 설정**
   ```bash
   # AWS CLI 프로필 설정
   aws configure
   
   # 또는 환경변수로 설정
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_DEFAULT_REGION=ap-northeast-2
   ```

3. **CDK Bootstrap (최초 1회)**
   ```bash
   # CDK 배포를 위한 초기 리소스 생성
   cdk bootstrap aws://ACCOUNT-ID/ap-northeast-2
   ```

### CDK 명령어

```bash
# CDK 앱 구문 검증
cdk synth

# 현재 배포와 비교하여 변경사항 확인
cdk diff

# CloudFormation 템플릿 배포
cdk deploy

# 리소스 삭제 (주의!)
cdk destroy

# CDK 앱 구조 확인
cdk ls
```

### 배포 프로세스

#### 🚨 중요: GitHub Actions 전용 배포 정책
**모든 배포는 GitHub Actions를 통해서만 수행됩니다.**

```bash
# ❌ 금지된 직접 배포
cdk deploy

# ✅ 올바른 배포 방식
git commit -m "infra: 인프라 설정 변경"
git push origin main
```

#### 초기 배포 (로컬에서 1회만)
```bash
# 최초 배포 시에만 로컬에서 실행
make deploy-initial

# 이는 다음 명령들을 순차 실행:
# 1. ECR 리포지토리 생성
# 2. Docker 이미지 빌드 및 푸시  
# 3. CDK 인프라 배포
```

## 🧪 테스트

### 인프라 테스트 실행
```bash
# Jest를 사용한 CDK 스택 테스트
npm test

# 특정 테스트 실행
npm test -- --testNamePattern="ComputeStack"
```

### 테스트 예시
```typescript
// CDK 스택이 올바른 리소스를 생성하는지 검증
test('ECS Cluster is created', () => {
  const template = Template.fromStack(stack)
  template.hasResourceProperties('AWS::ECS::Cluster', {
    ClusterName: 'conduit-cluster'
  })
})
```

## ✅ 배포 검증

### 자동 배포 검증 스크립트
`verify-deployment/` 폴더에는 배포 완료 후 인프라가 올바르게 동작하는지 검증하는 Node.js 스크립트가 포함되어 있습니다.

```bash
# 배포 검증 스크립트 실행
cd infra/verify-deployment
npm install
node verify-deployment.js
```

### 검증 항목
배포 검증 스크립트는 다음 항목들을 자동으로 확인합니다:

1. **ECS 클러스터 상태**
   - 클러스터 존재 여부 확인
   - 활성 서비스 수 검증

2. **ECS 서비스 상태**
   - 서비스 실행 상태 확인
   - 원하는 작업 수 vs 실행 중인 작업 수 비교
   - 서비스 안정성 확인

3. **작업 정의 (Task Definition) 검증**
   - 최신 리비전 사용 여부 확인
   - 컨테이너 이미지 URI 검증
   - 환경 변수 설정 확인

4. **로드 밸런서 상태**
   - ALB 상태 확인
   - 대상 그룹 헬스 체크 상태
   - 리스너 규칙 검증

5. **네트워킹 검증**
   - VPC 및 서브넷 설정 확인
   - 보안 그룹 규칙 검증
   - 퍼블릭 IP 할당 확인

### GitHub Actions 통합
이 검증 스크립트는 GitHub Actions의 백엔드 배포 워크플로우에서 자동으로 실행됩니다:

```yaml
# .github/workflows/backend-deploy.yml
- name: Verify deployment with AWS SDK
  run: |
    cd infra/verify-deployment
    npm install
    node verify-deployment.js
```

### 검증 실패 시 대응
검증이 실패하면 다음과 같은 정보가 제공됩니다:
- 실패한 검증 항목
- 상세한 에러 메시지  
- 문제 해결을 위한 AWS CLI 명령어
- 관련 CloudWatch 로그 링크

## 📊 리소스 모니터링

### CloudWatch 메트릭
- **ECS Service**: CPU 사용률, 메모리 사용률, 실행 중인 작업 수
- **ALB**: 요청 수, 응답 시간, 타겟 헬스 상태
- **ECR**: 이미지 푸시/풀 횟수

### 로그 확인
```bash
# ECS 서비스 로그
aws logs tail /ecs/conduit-backend --follow

# CloudFormation 스택 이벤트
aws cloudformation describe-stack-events --stack-name ConduitStack
```

## 💰 비용 최적화

### 현재 적용된 최적화
1. **NAT Gateway 제외**: 퍼블릭 서브넷만 사용하여 월 $45 절약
2. **Fargate Spot 미사용**: 안정성 우선으로 온디맨드 사용
3. **최소 리소스**: 512MB 메모리, 0.25 vCPU
4. **이미지 수명주기**: ECR에서 오래된 이미지 자동 삭제

### 예상 월 비용 (ap-northeast-2)
```
ECS Fargate Task (512MB, 0.25vCPU): ~$10/월
Application Load Balancer: ~$20/월
ECR 스토리지 (1GB 미만): ~$0.1/월
데이터 전송 (1GB): ~$0.1/월
----------------------------------------
총 예상 비용: ~$30/월
```

## 🔧 설정 및 환경변수

### CDK Context 설정
```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/infra.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

### 환경별 설정
```typescript
// 개발 환경과 프로덕션 환경 분리
const isProd = process.env.CDK_ENV === 'production'

const stackProps = {
  desiredCount: isProd ? 2 : 1,
  cpu: isProd ? 512 : 256,
  memoryLimitMiB: isProd ? 1024 : 512
}
```

## 🐛 트러블슈팅

### 일반적인 문제들

1. **배포 실패: "No space left on device"**
   ```bash
   # Docker 이미지 정리
   docker system prune -a
   ```

2. **Task Definition 업데이트 실패**
   ```bash
   # ECS 서비스 강제 업데이트
   aws ecs update-service --cluster conduit-cluster --service conduit-backend --force-new-deployment
   ```

3. **ALB 대상 그룹 헬스 체크 실패**
   ```bash
   # 백엔드 헬스 엔드포인트 확인
   curl http://conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com/health
   ```

4. **CDK 배포 중단**
   ```bash
   # CloudFormation 스택 상태 확인
   aws cloudformation describe-stacks --stack-name ConduitStack
   
   # 롤백이 필요한 경우
   aws cloudformation cancel-update-stack --stack-name ConduitStack
   ```

### 로그 및 디버깅
```bash
# CDK 배포 시 상세 로그
cdk deploy --verbose

# CloudFormation 이벤트 실시간 확인
aws cloudformation describe-stack-events --stack-name ConduitStack | head -20
```

## 🔄 업그레이드 및 마이그레이션

### Phase 3 준비 사항 (마이크로서비스 분해)
1. **API Gateway** 추가 예정
2. **Lambda 함수** 배포
3. **DynamoDB** 테이블 생성
4. **서비스 간 통신** 설정

### 예상 변경사항
```typescript
// 미래 마이크로서비스 아키텍처
const apiGateway = new apigateway.RestApi(this, 'ConduitAPI')
const authLambda = new lambda.Function(this, 'AuthService')
const articlesLambda = new lambda.Function(this, 'ArticlesService')
const commentsLambda = new lambda.Function(this, 'CommentsService')
```

## 📈 모니터링 및 알림

### CloudWatch 대시보드
- ECS 서비스 상태
- ALB 요청 메트릭
- 에러율 및 응답 시간

### 알림 설정 (미래 구현 예정)
```typescript
// 에러율이 5% 초과 시 알림
const errorAlarm = new cloudwatch.Alarm(this, 'ErrorRateAlarm', {
  metric: alb.metricTargetResponseTime(),
  threshold: 0.05,
  evaluationPeriods: 2
})
```

## 🤝 기여하기

### 인프라 변경 가이드라인
1. **작은 단위 변경**: 한 번에 하나의 리소스만 수정
2. **테스트 우선**: 변경 전 반드시 `npm test` 실행
3. **비용 영향 검토**: 새 리소스 추가 시 비용 계산
4. **문서 업데이트**: README와 주석 동시 업데이트

### 커밋 메시지 컨벤션
```bash
# 인프라 리소스 추가
git commit -m "infra: RDS 데이터베이스 추가"

# 설정 변경
git commit -m "infra: ECS 메모리 512MB로 증가"

# 비용 최적화
git commit -m "infra: Spot 인스턴스로 변경하여 비용 30% 절감"
```

---

**참고 자료**:
- [AWS CDK 공식 문서](https://docs.aws.amazon.com/cdk/)
- [AWS ECS 사용자 가이드](https://docs.aws.amazon.com/ecs/)
- [AWS Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [AWS Fargate 가격 정보](https://aws.amazon.com/fargate/pricing/)
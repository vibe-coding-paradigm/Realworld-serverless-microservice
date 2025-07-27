# Phase 1 구현 작업 목록 (바이브 코딩 학습용)

**목표**: 기존 모노리식 백엔드를 AWS ECS + Fargate로 배포, 프론트엔드는 GitHub Pages로 배포

## 🎯 바이브 코딩 원칙
- **속도 우선**: 완벽함보다 동작하는 것을 먼저
- **최소 구현**: MVP로 빠른 가치 창출
- **점진적 개선**: 동작 후 필요에 따라 확장
- **학습 중심**: 실전 경험을 통한 역량 강화

## 🚀 MVP 단계 (바이브 코딩 핵심)

> **목표**: 1-2일 안에 동작하는 배포 파이프라인 구축

### 1. MVP 사전 준비 (30분)
- [ ] AWS 계정 확인 및 기본 설정
- [ ] AWS CLI 설치 및 구성
- [ ] IAM 사용자 생성 (AdministratorAccess - MVP용)
- [ ] Docker 설치 확인

### 2. MVP 백엔드 배포 (2-3시간)
#### 2.1 가장 간단한 ECS 배포 (AWS CLI 사용)
- [ ] 기본 VPC 정보 확인 (`aws ec2 describe-vpcs`)
- [ ] ECR 리포지토리 생성 (`aws ecr create-repository`)
- [ ] 단순 Dockerfile 작성 (멀티스테이지 X)
- [ ] Docker 빌드 & ECR 푸시 (CLI 명령어)
- [ ] ECS 클러스터 생성 (`aws ecs create-cluster`)
- [ ] IAM 역할 생성 (`aws iam create-role`)
- [ ] 태스크 정의 등록 (`aws ecs register-task-definition`)
- [ ] ALB 생성 (`aws elbv2 create-load-balancer`)
- [ ] 타겟 그룹 생성 및 설정 (`aws elbv2 create-target-group`)
- [ ] Fargate 서비스 생성 (`aws ecs create-service`)

#### 2.2 헬스체크만 구현
- [ ] `/api/health` 엔드포인트 추가
- [ ] 환경변수 기반 포트 설정
- [ ] ALB 헬스체크 설정 (`aws elbv2 modify-target-group-attributes`)

### 3. MVP 프론트엔드 배포 (1시간)
- [ ] GitHub Pages 수동 설정
- [ ] `VITE_API_URL` 하드코딩으로 시작
- [ ] 수동 빌드 & 배포 테스트

### 4. MVP 연동 테스트 (30분)
- [ ] 프론트엔드에서 백엔드 API 호출 확인
- [ ] 기본 로그인/회원가입 플로우 테스트
- [ ] 게시글 작성/조회 테스트

## 🔧 확장 단계 (MVP 완료 후)

> **조건**: MVP가 동작한 후에만 진행

### 5. CI/CD 자동화
#### 5.1 백엔드 자동 배포
- [ ] GitHub OIDC Provider 설정 (`aws iam create-open-id-connect-provider`)
- [ ] OIDC 역할 생성 (`aws iam create-role`)
- [ ] `.github/workflows/backend-deploy.yml` 작성
- [ ] ECR 이미지 자동 빌드 & 푸시 (CLI 스크립트)
- [ ] ECS 서비스 자동 업데이트 (`aws ecs update-service`)

#### 5.2 프론트엔드 자동 배포
- [ ] `.github/workflows/frontend-deploy.yml` 작성
- [ ] GitHub Variables를 통한 API URL 관리
- [ ] 자동 빌드 & GitHub Pages 배포

### 6. 인프라 코드화 (IaC)
- [ ] AWS CDK 프로젝트 생성
- [ ] 기존 CLI 명령어를 CDK 코드로 전환
- [ ] 스택 기반 관리 (`cdk deploy`)

### 7. 모니터링 & 운영
- [ ] CloudWatch 대시보드 생성 (`aws cloudwatch put-dashboard`)
- [ ] 알람 설정 (`aws cloudwatch put-metric-alarm`)
- [ ] 로그 그룹 생성 (`aws logs create-log-group`)

### 8. 보안 강화
- [ ] IAM 권한 최소화 (`aws iam create-policy`)
- [ ] SSL/TLS 인증서 요청 (`aws acm request-certificate`)
- [ ] 보안 그룹 최적화 (`aws ec2 create-security-group`)

### 9. 테스트 자동화
- [ ] API 테스트 확장
- [ ] E2E 테스트 추가
- [ ] 성능 테스트

### 10. 고급 기능
- [ ] 블루/그린 배포
- [ ] 오토 스케일링
- [ ] 비용 최적화

## 📚 학습 포인트

### MVP 단계에서 배우는 것
- **AWS CLI 실전 활용**: ECS, ECR, ALB CLI 명령어
- **AWS ECS/Fargate 기본 개념**: 컨테이너 오케스트레이션
- **ALB와 서비스 연결**: 로드 밸런싱 기본
- **Docker 컨테이너 배포**: 실전 컨테이너화
- **GitHub Pages 배포**: 정적 사이트 호스팅
- **프론트엔드-백엔드 연동**: CORS, API 통신

### 확장 단계에서 배우는 것
- **CI/CD 파이프라인**: GitHub Actions, 자동화
- **Infrastructure as Code**: AWS CDK
- **보안 베스트 프랙티스**: IAM, OIDC
- **모니터링**: CloudWatch, 대시보드
- **성능 최적화**: 스케일링, 캐싱

## ⚠️ 데이터베이스 전략 (MVP 선택)

**MVP 권장**: 기존 SQLite 파일을 ECS에서 로컬 스토리지로 사용
- ✅ 가장 간단한 구현
- ✅ 기존 코드 변경 최소화
- ⚠️ 컨테이너 재시작 시 데이터 손실 (학습용이므로 허용)

**확장 단계 옵션**:
- EFS 마운트 (데이터 영속성) - `aws efs create-file-system`
- RDS 마이그레이션 (확장성) - `aws rds create-db-cluster`

## 🛠️ AWS CLI 명령어 가이드 (MVP)

### ECR 리포지토리 생성
```bash
aws ecr create-repository --repository-name conduit-backend
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com
```

### ECS 클러스터 생성
```bash
aws ecs create-cluster --cluster-name conduit-cluster
```

### IAM 역할 생성 (ECS Task용)
```bash
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### ALB 생성
```bash
# 서브넷 정보 확인
aws ec2 describe-subnets --query 'Subnets[?AvailabilityZone==`ap-northeast-2a` || AvailabilityZone==`ap-northeast-2c`].SubnetId'

# ALB 생성
aws elbv2 create-load-balancer --name conduit-alb --subnets subnet-xxx subnet-yyy --security-groups sg-xxx
```

### 태스크 정의 등록
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

## ⏱️ 바이브 코딩 타임라인

### 🚀 MVP 단계 (1-2일)
- **1단계** (3-4시간): 백엔드 ECS 배포
- **2단계** (1시간): 프론트엔드 GitHub Pages 배포  
- **3단계** (30분): 연동 테스트

### 🔧 확장 단계 (필요에 따라)
- **CI/CD 자동화**: +1일
- **IaC 구현**: +1일
- **모니터링 & 보안**: +1일
- **고급 기능**: +1-2일

## 🎯 MVP 성공 기준

### 필수 조건 (반드시 달성)
- [ ] 프론트엔드에서 백엔드 API 호출 성공
- [ ] 로그인/회원가입 동작
- [ ] 게시글 CRUD 동작
- [ ] HTTPS 통신 (ALB 기본 설정)

### 성능 기준 (관대하게 설정)
- 응답 시간 < 2초 (학습용)
- 동시 접속 10명 처리 가능

## 🚨 MVP 제한 사항 (의도적으로 제외)

### 지금 하지 않는 것들
- ❌ 복잡한 IAM 권한 관리
- ❌ SSL 인증서 (ALB 기본 HTTPS 사용)
- ❌ 모니터링 대시보드
- ❌ 자동 스케일링
- ❌ 데이터 백업
- ❌ 성능 최적화
- ❌ 보안 강화

### 나중에 추가할 것들
- 🔄 CI/CD 파이프라인
- 🔄 Infrastructure as Code
- 🔄 세밀한 권한 관리
- 🔄 모니터링 시스템
- 🔄 비용 최적화

## 💡 바이브 코딩 핵심 포인트

1. **완벽함보다 동작**: 일단 돌아가게 만들기
2. **CLI부터 시작**: 콘솔 대신 명령어로 학습
3. **수동부터 시작**: 자동화는 나중에
4. **최소 권한 나중에**: AdministratorAccess로 시작
5. **문서화는 마지막**: 코드가 먼저
6. **리팩토링은 점진적**: 동작 후 개선

## 🏁 완료 후 결과물

### MVP 단계
- ✅ AWS ECS에서 실행되는 Go 백엔드
- ✅ GitHub Pages React 프론트엔드  
- ✅ 기본적인 HTTPS 통신
- ✅ 실전 AWS 배포 경험

### 확장 단계 (선택)
- 🔄 완전 자동화된 CI/CD
- 🔄 IaC 기반 인프라 관리
- 🔄 프로덕션급 모니터링
- 🔄 보안 베스트 프랙티스
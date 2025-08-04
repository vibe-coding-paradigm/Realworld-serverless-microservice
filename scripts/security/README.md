# 보안 스크립트 가이드

## 개요
이 디렉토리는 AWS IAM 최소 권한 원칙 적용을 위한 보안 스크립트들을 포함합니다.

## 파일 목록

### `minimal-github-actions-policy.json`
- GitHub Actions OIDC 역할을 위한 최소 권한 IAM 정책
- AdministratorAccess 대신 사용할 수 있는 제한된 권한 정책
- 프로젝트에서 실제로 사용하는 AWS 서비스들만 포함

### `minimal-permissions-monitor.sh`
- GitHub Actions 권한 사용 현황을 모니터링하는 스크립트  
- AWS IAM Access Analyzer를 활용한 외부 액세스 감지
- 현재 정책과 최소 권한 정책 비교 분석

## 사용 방법

### 1. 최소 권한 정책 적용

#### 단계 1: 정책 생성
```bash
aws iam create-policy \
  --policy-name GitHubActionsMinimalPolicy \
  --policy-document file://scripts/security/minimal-github-actions-policy.json \
  --description "Minimal permissions for GitHub Actions based on actual usage analysis"
```

#### 단계 2: 테스트 역할 생성 (선택사항)
```bash
# Trust policy 생성
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:vibe-coding-paradigm/Realworld-serverless-microservice:*"
        }
      }
    }
  ]
}
EOF

# 테스트 역할 생성
aws iam create-role \
  --role-name GitHubActionsConduitRoleTest \
  --assume-role-policy-document file://trust-policy.json

# 최소 권한 정책 연결
aws iam attach-role-policy \
  --role-name GitHubActionsConduitRoleTest \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/GitHubActionsMinimalPolicy
```

#### 단계 3: 테스트 실행
GitHub Actions 워크플로우 파일에서 `role-to-assume`을 임시로 변경:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsConduitRoleTest  # 테스트 역할
    aws-region: ap-northeast-2
```

#### 단계 4: 프로덕션 적용
모든 테스트가 성공한 후:
```bash
# 기존 AdministratorAccess 제거
aws iam detach-role-policy \
  --role-name GitHubActionsConduitRole \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 최소 권한 정책 연결
aws iam attach-role-policy \
  --role-name GitHubActionsConduitRole \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/GitHubActionsMinimalPolicy
```

### 2. 권한 모니터링

#### 정기적 모니터링 실행
```bash
# 실행 권한 부여
chmod +x scripts/security/minimal-permissions-monitor.sh

# 모니터링 실행
./scripts/security/minimal-permissions-monitor.sh
```

#### Cron 작업으로 자동화
```bash
# 매주 월요일 오전 9시에 실행
crontab -e
0 9 * * 1 /path/to/project/scripts/security/minimal-permissions-monitor.sh
```

## 포함된 권한

최소 권한 정책에는 다음 AWS 서비스들에 대한 제한된 권한이 포함됩니다:

- **CloudFormation**: ConduitStack 관련 스택 관리
- **S3**: CDK assets 버킷 관리
- **ECR**: conduit-backend 컨테이너 이미지 관리
- **Lambda**: conduit-* 함수 관리
- **DynamoDB**: conduit-* 테이블 관리
- **API Gateway**: REST API 관리
- **ECS**: ConduitCluster 관리
- **IAM**: conduit-*, ConduitStack-* 역할/정책 관리
- **EC2/ELB**: 네트워킹 및 로드밸런서 관리
- **CloudWatch Logs**: Lambda/ECS 로그 그룹 관리
- **SSM**: CDK bootstrap 파라미터 관리

## 보안 효과

- **권한 축소**: 99%+ 권한 감소 (AdministratorAccess → 필수 권한만)
- **리소스 제한**: 특정 ARN 패턴으로 리소스 접근 제한
- **외부 액세스 감지**: Access Analyzer를 통한 지속적 모니터링
- **최소 권한 원칙**: 프로젝트에 실제로 필요한 권한만 부여

## 주의사항

1. **테스트 필수**: 프로덕션 적용 전 반드시 테스트 환경에서 검증
2. **점진적 적용**: 한 번에 모든 워크플로우를 변경하지 말고 단계적으로 적용
3. **롤백 계획**: 문제 발생 시 이전 정책으로 복구할 수 있는 계획 수립
4. **정기 검토**: 새로운 AWS 서비스 추가 시 정책 업데이트 필요

## 문제 해결

### 권한 부족 오류 발생 시
1. 오류 로그에서 필요한 권한 확인
2. `minimal-github-actions-policy.json`에 해당 권한 추가
3. 정책 새 버전 생성 및 적용

### 모니터링 스크립트 오류 시
- AWS CLI 설정 확인
- IAM 권한 확인 (자신의 권한으로 모니터링 실행)
- Access Analyzer 분석기 존재 여부 확인

## 지원

이슈나 질문이 있으면 GitHub 이슈로 등록해주세요.
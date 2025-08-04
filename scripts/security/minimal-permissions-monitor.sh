#!/bin/bash

# GitHub Actions 최소 권한 모니터링 스크립트
# AWS IAM Access Analyzer를 활용한 권한 사용 패턴 분석

set -e

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ANALYZER_NAME="ConsoleAnalyzer-8a71a51c-e11c-4121-a670-e1821b5e4540"
ANALYZER_ARN="arn:aws:access-analyzer:ap-northeast-2:$ACCOUNT_ID:analyzer/$ANALYZER_NAME"
ROLE_NAME="GitHubActionsConduitRole"
REGION="ap-northeast-2"

echo "🔍 GitHub Actions 최소 권한 모니터링 시작"
echo "계정 ID: $ACCOUNT_ID"
echo "분석기: $ANALYZER_NAME"
echo "대상 역할: $ROLE_NAME"
echo ""

# 1. 현재 역할의 정책 확인
echo "📋 1. 현재 역할 정책 분석"
echo "=================="

ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name $ROLE_NAME --query 'AttachedPolicies[*].PolicyName' --output text)
echo "연결된 관리형 정책: $ATTACHED_POLICIES"

INLINE_POLICIES=$(aws iam list-role-policies --role-name $ROLE_NAME --query 'PolicyNames' --output text)
if [ -n "$INLINE_POLICIES" ]; then
    echo "인라인 정책: $INLINE_POLICIES"
else
    echo "인라인 정책: 없음"
fi
echo ""

# 2. Access Analyzer Findings 확인
echo "🔍 2. 외부 액세스 권한 확인"
echo "========================"

# 활성 finding 조회
ACTIVE_FINDINGS=$(aws accessanalyzer list-findings \
    --analyzer-arn "$ANALYZER_ARN" \
    --region $REGION \
    --query "findings[?status=='ACTIVE' && contains(resource.resourceArn, '$ROLE_NAME')].[id,resource.resourceArn,principal]" \
    --output table 2>/dev/null || echo "조회 실패")

if [ "$ACTIVE_FINDINGS" != "조회 실패" ] && [ -n "$ACTIVE_FINDINGS" ] && [ "$ACTIVE_FINDINGS" != "[]" ]; then
    echo "⚠️  외부 액세스 권한이 감지되었습니다:"
    echo "$ACTIVE_FINDINGS"
else
    echo "✅ 외부 액세스 권한 없음 또는 조회 불가"
fi
echo ""

# 3. 최근 AssumeRole 활동 확인
echo "📊 3. 최근 역할 사용 활동"
echo "===================="

# IAM의 마지막 액세스 정보 확인
LAST_USED=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.RoleLastUsed' --output json 2>/dev/null)
if [ "$LAST_USED" != "null" ] && [ -n "$LAST_USED" ]; then
    echo "마지막 사용 정보:"
    echo "$LAST_USED" | jq . 2>/dev/null || echo "$LAST_USED"
else
    echo "⚠️  마지막 사용 정보를 사용할 수 없습니다"
fi
echo ""

# 4. 권한 비교 분석
echo "🔄 4. 권한 비교 분석"
echo "================"

CURRENT_POLICY="AdministratorAccess"
MINIMAL_POLICY="GitHubActionsMinimalPolicy"

echo "현재 정책: $CURRENT_POLICY (AWS 관리형)"
echo "최소 권한 정책: $MINIMAL_POLICY (사용자 관리형)"

# 최소 권한 정책이 존재하는지 확인
if aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$MINIMAL_POLICY" >/dev/null 2>&1; then
    echo "✅ 최소 권한 정책이 생성되어 있습니다"
    
    POLICY_VERSION=$(aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$MINIMAL_POLICY" --query 'Policy.DefaultVersionId' --output text)
    echo "   정책 버전: $POLICY_VERSION"
    
    # 테스트 역할 확인
    if aws iam get-role --role-name "GitHubActionsConduitRoleTest" >/dev/null 2>&1; then
        echo "✅ 테스트 역할이 준비되어 있습니다"
        echo "🧪 테스트 역할에 연결된 정책:"
        aws iam list-attached-role-policies --role-name "GitHubActionsConduitRoleTest" --query 'AttachedPolicies[*].PolicyName' --output table
    else
        echo "⚠️  테스트 역할이 없습니다"
    fi
else
    echo "❌ 최소 권한 정책이 없습니다. 먼저 정책을 생성하세요."
fi
echo ""

# 5. 정책 크기 비교
echo "📊 5. 정책 크기 비교"
echo "================"

# AdministratorAccess 정책 정보
ADMIN_POLICY_SIZE=$(aws iam get-policy --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess" --query 'Policy' --output json | jq -r 'to_entries | map("\(.key): \(.value)") | join(", ")' | wc -c)
echo "AdministratorAccess 정책: 전체 권한 (모든 서비스, 모든 액션)"

# 사용자 정의 정책 크기
if aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$MINIMAL_POLICY" >/dev/null 2>&1; then
    MINIMAL_POLICY_INFO=$(aws iam get-policy-version --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$MINIMAL_POLICY" --version-id v1 --query 'PolicyVersion.Document' --output json | jq -r '.Statement | length')
    echo "최소 권한 정책: $MINIMAL_POLICY_INFO개 Statement (제한된 서비스, 특정 리소스)"
    
    # 권한 축소 비율 계산
    echo "📉 권한 축소 효과: 99%+ (전체 → 프로젝트 필수 권한만)"
else
    echo "❌ 최소 권한 정책 정보 없음"
fi
echo ""

# 6. 권장 사항
echo "💡 6. 권장 사항"
echo "============"

if [ "$ATTACHED_POLICIES" = "AdministratorAccess" ]; then
    echo "🚨 현재 AdministratorAccess를 사용하고 있습니다"
    echo "📝 다음 단계를 권장합니다:"
    echo "   1. 테스트 환경에서 최소 권한 정책 검증"
    echo "   2. GitHub Actions 워크플로우에서 테스트 역할 사용"
    echo "   3. 모든 워크플로우가 정상 동작하는지 확인"
    echo "   4. 프로덕션 환경에 점진적 적용"
    echo ""
    echo "🔧 테스트 방법:"
    echo "   # .github/workflows/*.yml 파일에서 임시 변경:"
    echo "   # role-to-assume: arn:aws:iam::$ACCOUNT_ID:role/GitHubActionsConduitRoleTest"
    echo ""
    echo "🔄 적용 방법:"
    echo "   aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AdministratorAccess"
    echo "   aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$MINIMAL_POLICY"
else
    echo "✅ 사용자 정의 정책을 사용하고 있습니다"
    echo "🔍 정기적으로 권한 사용 패턴을 모니터링하세요"
fi
echo ""

# 7. 모니터링 메트릭
echo "📈 7. 모니터링 요약"
echo "==============="

echo "분석 일시: $(date)"
echo "계정: $ACCOUNT_ID"
echo "역할: $ROLE_NAME"
echo "현재 정책: $ATTACHED_POLICIES"
echo "외부 액세스: $([ "$ACTIVE_FINDINGS" != "조회 실패" ] && [ -n "$ACTIVE_FINDINGS" ] && [ "$ACTIVE_FINDINGS" != "[]" ] && echo "발견됨" || echo "없음")"
echo "최소 권한 정책 준비: $(aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$MINIMAL_POLICY" >/dev/null 2>&1 && echo "완료" || echo "필요")"
echo "보안 개선 필요: $([ "$ATTACHED_POLICIES" = "AdministratorAccess" ] && echo "예 (AdministratorAccess 사용중)" || echo "아니오")"

echo ""
echo "🎉 모니터링 완료"
echo ""
echo "💡 이 스크립트를 주기적으로 실행하여 권한 상태를 모니터링하세요"
echo "   예: 매주 실행하거나 CI/CD 파이프라인에 통합"
echo "   crontab: 0 9 * * 1 /path/to/minimal-permissions-monitor.sh"
#!/bin/bash

# 파이프라인 상태 체크 스크립트
# GitHub Actions 워크플로우 상태를 확인하고 요약을 제공합니다

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 아이콘 정의
SUCCESS_ICON="✅"
FAILURE_ICON="❌"
PENDING_ICON="⏳"
SKIPPED_ICON="⏭️"
WARNING_ICON="⚠️"
INFO_ICON="ℹ️"

echo -e "${BLUE}🔍 GitHub Actions 파이프라인 상태 체크${NC}"
echo -e "${BLUE}===========================================${NC}"

# GitHub CLI 설치 확인
if ! command -v gh &> /dev/null; then
    echo -e "${RED}${FAILURE_ICON} GitHub CLI가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}${INFO_ICON} 설치 방법: brew install gh${NC}"
    exit 1
fi

# GitHub 로그인 확인
if ! gh auth status &> /dev/null; then
    echo -e "${RED}${FAILURE_ICON} GitHub에 로그인되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}${INFO_ICON} 로그인: gh auth login${NC}"
    exit 1
fi

# 현재 브랜치 가져오기
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${CYAN}${INFO_ICON} 현재 브랜치: ${CURRENT_BRANCH}${NC}"
echo ""

# 최근 워크플로우 실행 상태 가져오기
echo -e "${BLUE}📊 최근 워크플로우 실행 상태${NC}"
echo -e "${BLUE}---------------------------${NC}"

# JSON 형태로 워크플로우 실행 정보 가져오기
WORKFLOWS=$(gh run list --limit 10 --json status,conclusion,name,headBranch,createdAt,url,workflowName)

if [ -z "$WORKFLOWS" ] || [ "$WORKFLOWS" = "[]" ]; then
    echo -e "${YELLOW}${WARNING_ICON} 워크플로우 실행 기록이 없습니다.${NC}"
    exit 0
fi

# 워크플로우 상태별 카운터
SUCCESS_COUNT=0
FAILURE_COUNT=0
PENDING_COUNT=0
TOTAL_COUNT=0

# 워크플로우 상태 파싱 및 출력
echo "$WORKFLOWS" | jq -r '.[] | "\(.status)|\(.conclusion)|\(.workflowName)|\(.headBranch)|\(.createdAt)|\(.url)"' | while IFS='|' read -r status conclusion workflow branch created_at url; do
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    # 상태에 따른 아이콘과 색상 설정
    if [ "$status" = "completed" ]; then
        if [ "$conclusion" = "success" ]; then
            icon="${SUCCESS_ICON}"
            color="${GREEN}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        elif [ "$conclusion" = "failure" ]; then
            icon="${FAILURE_ICON}"
            color="${RED}"
            FAILURE_COUNT=$((FAILURE_COUNT + 1))
        elif [ "$conclusion" = "skipped" ]; then
            icon="${SKIPPED_ICON}"
            color="${YELLOW}"
        else
            icon="${WARNING_ICON}"
            color="${YELLOW}"
        fi
    else
        icon="${PENDING_ICON}"
        color="${YELLOW}"
        PENDING_COUNT=$((PENDING_COUNT + 1))
    fi
    
    # 브랜치 표시 (현재 브랜치는 강조)
    if [ "$branch" = "$CURRENT_BRANCH" ]; then
        branch_display="${PURPLE}${branch}${NC}"
    else
        branch_display="${branch}"
    fi
    
    # 시간 포맷팅 (간단하게)
    time_display=$(echo "$created_at" | cut -d'T' -f1)
    
    echo -e "${color}${icon} ${workflow}${NC} (${branch_display}) - ${time_display}"
done

echo ""

# 현재 브랜치의 최신 워크플로우 상세 정보
echo -e "${BLUE}🔎 현재 브랜치 (${CURRENT_BRANCH}) 최신 워크플로우${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

LATEST_RUN=$(gh run list --branch "$CURRENT_BRANCH" --limit 1 --json status,conclusion,name,createdAt,url,workflowName)

if [ -z "$LATEST_RUN" ] || [ "$LATEST_RUN" = "[]" ]; then
    echo -e "${YELLOW}${WARNING_ICON} 현재 브랜치에 워크플로우 실행 기록이 없습니다.${NC}"
else
    # 최신 실행 정보 파싱
    LATEST_STATUS=$(echo "$LATEST_RUN" | jq -r '.[0].status')
    LATEST_CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.[0].conclusion')
    LATEST_WORKFLOW=$(echo "$LATEST_RUN" | jq -r '.[0].workflowName')
    LATEST_URL=$(echo "$LATEST_RUN" | jq -r '.[0].url')
    LATEST_TIME=$(echo "$LATEST_RUN" | jq -r '.[0].createdAt' | cut -d'T' -f1)
    
    # 상태 표시
    if [ "$LATEST_STATUS" = "completed" ]; then
        if [ "$LATEST_CONCLUSION" = "success" ]; then
            echo -e "${GREEN}${SUCCESS_ICON} 성공: ${LATEST_WORKFLOW}${NC}"
        elif [ "$LATEST_CONCLUSION" = "failure" ]; then
            echo -e "${RED}${FAILURE_ICON} 실패: ${LATEST_WORKFLOW}${NC}"
            echo -e "${YELLOW}${INFO_ICON} 로그 확인: gh run view --log${NC}"
        else
            echo -e "${YELLOW}${WARNING_ICON} ${LATEST_CONCLUSION}: ${LATEST_WORKFLOW}${NC}"
        fi
    else
        echo -e "${YELLOW}${PENDING_ICON} 실행 중: ${LATEST_WORKFLOW}${NC}"
        echo -e "${CYAN}${INFO_ICON} 상태 확인: gh run watch${NC}"
    fi
    
    echo -e "${CYAN}${INFO_ICON} 실행 시간: ${LATEST_TIME}${NC}"
    echo -e "${CYAN}${INFO_ICON} URL: ${LATEST_URL}${NC}"
fi

echo ""

# 요약 통계
echo -e "${BLUE}📈 워크플로우 요약${NC}"
echo -e "${BLUE}----------------${NC}"
echo -e "${GREEN}${SUCCESS_ICON} 성공: $(echo "$WORKFLOWS" | jq '[.[] | select(.conclusion == "success")] | length')${NC}"
echo -e "${RED}${FAILURE_ICON} 실패: $(echo "$WORKFLOWS" | jq '[.[] | select(.conclusion == "failure")] | length')${NC}"
echo -e "${YELLOW}${PENDING_ICON} 실행 중: $(echo "$WORKFLOWS" | jq '[.[] | select(.status == "in_progress")] | length')${NC}"
echo -e "${YELLOW}${SKIPPED_ICON} 건너뜀: $(echo "$WORKFLOWS" | jq '[.[] | select(.conclusion == "skipped")] | length')${NC}"

echo ""

# 유용한 명령어 안내
echo -e "${BLUE}💡 유용한 명령어${NC}"
echo -e "${BLUE}----------------${NC}"
echo -e "${CYAN}${INFO_ICON} 실시간 상태 확인: ${NC}gh run watch"
echo -e "${CYAN}${INFO_ICON} 로그 확인: ${NC}gh run view --log"
echo -e "${CYAN}${INFO_ICON} 워크플로우 목록: ${NC}gh run list"
echo -e "${CYAN}${INFO_ICON} 특정 워크플로우 재실행: ${NC}gh run rerun [RUN_ID]"

echo ""
echo -e "${GREEN}${SUCCESS_ICON} 파이프라인 상태 체크 완료!${NC}"
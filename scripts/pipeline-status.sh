#!/bin/bash

# 간단한 파이프라인 상태 체크 스크립트
# 현재 브랜치의 최신 워크플로우 상태만 빠르게 확인

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# GitHub CLI 확인
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI가 필요합니다: brew install gh${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub 로그인이 필요합니다: gh auth login${NC}"
    exit 1
fi

# 현재 브랜치
CURRENT_BRANCH=$(git branch --show-current)

# 최신 워크플로우 상태
LATEST_RUN=$(gh run list --branch "$CURRENT_BRANCH" --limit 1 --json status,conclusion,workflowName 2>/dev/null || echo "[]")

if [ "$LATEST_RUN" = "[]" ]; then
    echo -e "${YELLOW}⚠️ 브랜치 '${CURRENT_BRANCH}'에 워크플로우가 없습니다${NC}"
    exit 0
fi

STATUS=$(echo "$LATEST_RUN" | jq -r '.[0].status')
CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.[0].conclusion')
WORKFLOW=$(echo "$LATEST_RUN" | jq -r '.[0].workflowName')

echo -e "${BLUE}🔍 파이프라인 상태 (${CURRENT_BRANCH})${NC}"

if [ "$STATUS" = "completed" ]; then
    if [ "$CONCLUSION" = "success" ]; then
        echo -e "${GREEN}✅ ${WORKFLOW}: 성공${NC}"
    elif [ "$CONCLUSION" = "failure" ]; then
        echo -e "${RED}❌ ${WORKFLOW}: 실패${NC}"
        echo -e "${YELLOW}💡 로그 확인: gh run view --log${NC}"
    else
        echo -e "${YELLOW}⚠️ ${WORKFLOW}: ${CONCLUSION}${NC}"
    fi
else
    echo -e "${YELLOW}⏳ ${WORKFLOW}: 실행 중${NC}"
    echo -e "${YELLOW}💡 상태 확인: gh run watch${NC}"
fi
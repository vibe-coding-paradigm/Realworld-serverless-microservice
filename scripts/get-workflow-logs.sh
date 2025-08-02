#!/bin/bash

# GitHub Actions workflow 로그 조회 스크립트
# GitHub에서 실행된 workflow run의 상태와 로그를 조회합니다.
# 
# 주의: 이 스크립트는 조회 전용입니다.
# - workflow를 로컬에서 실행하지 않습니다
# - GitHub Actions에서 실행된 결과만 조회합니다
# - 환경 차이로 인한 문제를 방지합니다

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 함수 정의
print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🔍 $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# GitHub CLI 설치 확인
check_gh_cli() {
    if ! command -v gh >/dev/null 2>&1; then
        print_error "GitHub CLI를 찾을 수 없습니다."
        echo "설치 방법: https://cli.github.com/"
        exit 1
    fi
    
    # GitHub CLI 로그인 상태 확인
    if ! gh auth status >/dev/null 2>&1; then
        print_error "GitHub CLI에 로그인하지 않았습니다."
        echo "로그인하려면: gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI 준비 완료"
}

# 사용법 표시
show_usage() {
    echo "GitHub Actions Workflow 조회 도구"
    echo ""
    echo "사용법: $0 [workflow-name] [options]"
    echo ""
    echo "🔍 조회할 Workflow:"
    echo "  frontend       - Frontend Deploy Workflow"
    echo "  backend        - Backend Deploy Workflow"
    echo "  e2e           - E2E Tests Workflow"
    echo "  load          - Load Tests Workflow"
    echo "  all           - 모든 workflow (기본값)"
    echo ""
    echo "⚙️  옵션:"
    echo "  -l, --limit N  - 표시할 run 개수 (기본값: 3)"
    echo "  -f, --failed   - 실패한 run만 표시"
    echo "  -s, --status   - 상태만 표시 (로그 없음)"
    echo "  -h, --help     - 이 도움말 표시"
    echo ""
    echo "📝 예시:"
    echo "  $0                        # 모든 workflow 상태 조회"
    echo "  $0 frontend               # 프론트엔드 workflow 조회"
    echo "  $0 backend -l 5           # 백엔드 최신 5개 run 조회"
    echo "  $0 e2e --failed           # E2E 실패한 run만 조회"
    echo "  $0 all --status           # 모든 workflow 상태만 간략히"
    echo ""
    echo "⚠️  주의사항:"
    echo "  - 이 도구는 조회 전용입니다"
    echo "  - workflow를 실행하지 않습니다"
    echo "  - GitHub Actions에서 실행된 결과만 표시합니다"
}

# Workflow 이름 매핑 (GitHub에서 표시되는 이름 사용)
get_workflow_name() {
    case "$1" in
        "frontend"|"front"|"fe")
            echo "Deploy Frontend to GitHub Pages"
            ;;
        "backend"|"back"|"be")
            echo "Deploy Backend to AWS"
            ;;
        "e2e"|"test"|"playwright")
            echo "E2E Tests"
            ;;
        "load"|"loadtest"|"k6")
            echo "Load Tests"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Workflow 표시명 매핑
get_workflow_display_name() {
    case "$1" in
        "Deploy Frontend to GitHub Pages")
            echo "Frontend Deploy"
            ;;
        "Deploy Backend to AWS")
            echo "Backend Deploy"
            ;;
        "E2E Tests")
            echo "E2E Tests"
            ;;
        "Load Tests")
            echo "Load Tests"
            ;;
        *)
            echo "$1"
            ;;
    esac
}

# 단일 workflow 상태 표시
show_workflow_status() {
    local workflow_name="$1"
    local limit="$2"
    local failed_only="$3"
    local status_only="$4"
    
    local display_name=$(get_workflow_display_name "$workflow_name")
    
    print_header "$display_name Workflow"
    
    # 기본 쿼리 구성 (workflow 이름을 따옴표로 감싸기)
    local query=(--workflow "$workflow_name" --limit "$limit" --json databaseId,url,conclusion,status,headBranch,headSha,createdAt,updatedAt)
    
    # 실패한 것만 표시하는 경우 필터링
    if [ "$failed_only" = "true" ]; then
        local runs=$(gh run list "${query[@]}" | jq '[.[] | select(.conclusion == "failure")]')
    else
        local runs=$(gh run list "${query[@]}")
    fi
    
    # run이 없는 경우
    if [ "$(echo "$runs" | jq 'length')" = "0" ]; then
        if [ "$failed_only" = "true" ]; then
            print_info "실패한 run이 없습니다."
        else
            print_info "Run을 찾을 수 없습니다."
        fi
        echo ""
        return
    fi
    
    # 각 run 정보 표시
    echo "$runs" | jq -r '.[] | [.databaseId, .conclusion, .status, .headBranch, .headSha[0:7], .createdAt, .url] | @tsv' | \
    while IFS=$'\t' read -r run_id conclusion status branch sha created_at url; do
        # 상태에 따른 색상 설정
        if [ "$conclusion" = "success" ]; then
            status_color="$GREEN"
            status_icon="✅"
        elif [ "$conclusion" = "failure" ]; then
            status_color="$RED"
            status_icon="❌"
        elif [ "$status" = "in_progress" ]; then
            status_color="$YELLOW"
            status_icon="🔄"
        else
            status_color="$NC"
            status_icon="⏸️"
        fi
        
        # 시간 포맷팅
        local formatted_time=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$created_at" "+%m/%d %H:%M" 2>/dev/null || echo "$created_at")
        
        echo -e "${status_color}${status_icon} Run #${run_id}${NC} | ${PURPLE}${branch}@${sha}${NC} | ${formatted_time}"
        
        if [ "$status_only" != "true" ]; then
            # 실패한 경우 로그 표시
            if [ "$conclusion" = "failure" ]; then
                echo -e "   ${RED}🔗 URL: $url${NC}"
                echo ""
                
                # 실제 로그 가져오기 (간단한 버전)
                print_info "로그를 가져오는 중..."
                gh run view "$run_id" --log 2>/dev/null | head -50 | \
                while read -r line; do
                    echo "   $line"
                done
                echo ""
            elif [ "$conclusion" = "success" ]; then
                echo -e "   ${GREEN}성공적으로 완료됨${NC}"
                echo ""
            else
                echo -e "   ${YELLOW}진행 중 또는 대기 중${NC}"
                echo ""
            fi
        else
            echo ""
        fi
    done
}

# 모든 workflow 상태 표시
show_all_workflows() {
    local limit="$1"
    local failed_only="$2"
    local status_only="$3"
    
    local workflows=("Deploy Frontend to GitHub Pages" "Deploy Backend to AWS" "E2E Tests" "Load Tests")
    
    for workflow in "${workflows[@]}"; do
        show_workflow_status "$workflow" "$limit" "$failed_only" "$status_only"
    done
}

# 메인 로직
main() {
    local workflow=""
    local limit=3
    local failed_only="false"
    local status_only="false"
    
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -l|--limit)
                limit="$2"
                shift 2
                ;;
            -f|--failed)
                failed_only="true"
                shift
                ;;
            -s|--status)
                status_only="true"
                shift
                ;;
            -*)
                print_error "알 수 없는 옵션: $1"
                show_usage
                exit 1
                ;;
            *)
                if [ -z "$workflow" ]; then
                    workflow="$1"
                else
                    print_error "너무 많은 인자입니다"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # GitHub CLI 확인
    check_gh_cli
    
    echo ""
    print_header "GitHub Actions Workflow 로그"
    echo ""
    
    if [ -z "$workflow" ] || [ "$workflow" = "all" ]; then
        # 모든 workflow 표시
        show_all_workflows "$limit" "$failed_only" "$status_only"
    else
        # 특정 workflow 표시
        local workflow_name=$(get_workflow_name "$workflow")
        if [ -z "$workflow_name" ]; then
            print_error "알 수 없는 workflow: $workflow"
            echo ""
            show_usage
            exit 1
        fi
        
        show_workflow_status "$workflow_name" "$limit" "$failed_only" "$status_only"
    fi
    
    print_success "완료"
}

# 스크립트 실행
main "$@"
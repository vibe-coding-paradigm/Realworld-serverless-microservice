#!/bin/bash

echo "🚀 RealWorld 애플리케이션 컨테이너 시작"
echo "=================================="

# 이전 컨테이너 정리
echo "📦 이전 컨테이너 정리 중..."
docker-compose down

# 이미지 빌드 및 컨테이너 시작
echo "🔨 Docker 이미지 빌드 및 컨테이너 시작 중..."
docker-compose up --build -d

# 컨테이너 상태 확인
echo "⏳ 컨테이너 시작 대기 중..."
sleep 10

echo "📋 컨테이너 상태 확인:"
docker-compose ps

echo ""
echo "✅ 애플리케이션 실행 완료!"
echo ""
echo "🌐 접속 URL:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   Health Check: http://localhost:8080/health"
echo ""
echo "📝 로그 확인:"
echo "   전체 로그: docker-compose logs -f"
echo "   백엔드 로그: docker-compose logs -f backend"
echo "   프론트엔드 로그: docker-compose logs -f frontend"
echo ""
echo "🛑 중지하기: docker-compose down"
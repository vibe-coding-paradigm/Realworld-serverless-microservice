#!/bin/bash

# Pre-commit hook for running E2E tests in local environment
# This ensures that E2E tests pass before allowing commits

set -e

echo "🔍 Running pre-commit E2E tests..."

# Check if we're in the correct directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found. Run this from project root."
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "⚠️  Backend is not running on localhost:8080"
    echo "🚀 Starting backend with docker-compose..."
    
    # Start backend in background
    if ! docker-compose up -d backend; then
        echo "❌ Failed to start backend with docker-compose"
        echo "💡 Please start backend manually: docker-compose up backend"
        exit 1
    fi
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            echo "✅ Backend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Backend failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
    done
fi

# Check if frontend dependencies are installed
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm ci
fi

# Set environment for local testing
export API_URL="http://localhost:8080"
export PLAYWRIGHT_BASE_URL="http://localhost:3000"

echo "🧪 Running E2E tests against local environment..."
echo "   API_URL: $API_URL"
echo "   BASE_URL: $PLAYWRIGHT_BASE_URL"

# Run E2E tests
if npm run test:e2e; then
    echo "✅ All E2E tests passed!"
    echo "💚 Commit allowed"
else
    echo "❌ E2E tests failed!"
    echo "🚫 Commit blocked - fix failing tests before committing"
    exit 1
fi

cd ..

echo "🎉 Pre-commit checks completed successfully!"
#!/bin/bash

# Script to install git hooks for the project
# Run this once after cloning the repository

echo "🔧 Installing git hooks..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository root"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
if [ -f "scripts/pre-commit-hook.sh" ]; then
    cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "✅ Pre-commit hook installed"
else
    echo "❌ Error: scripts/pre-commit-hook.sh not found"
    exit 1
fi

echo "🎉 Git hooks installation completed!"
echo ""
echo "ℹ️  The pre-commit hook will:"
echo "   • Automatically start backend if not running"
echo "   • Run E2E tests before each commit"
echo "   • Block commits if tests fail"
echo ""
echo "💡 To bypass hook temporarily: git commit --no-verify"
#!/bin/bash

# RealWorld Load Testing Suite
# Runs all load tests and generates comprehensive reports

set -e

echo "🚀 Starting RealWorld Load Testing Suite..."
echo "=================================="

# Configuration
API_URL=${API_URL:-"http://3.39.187.72:8080"}
RESULTS_DIR="results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "📊 Testing API endpoint: $API_URL"
echo "📁 Results will be saved to: $RESULTS_DIR"
echo ""

# Test 1: Performance Baseline
echo "1️⃣  Running Performance Baseline Test..."
echo "   - Single user, 5 minutes"
echo "   - Measuring response time baselines"
k6 run --env API_URL="$API_URL" \
       --out json="$RESULTS_DIR/baseline_${TIMESTAMP}.json" \
       performance-baseline.js

echo "✅ Baseline test completed"
echo ""

# Test 2: Basic Load Test
echo "2️⃣  Running Basic Load Test..."
echo "   - 10 concurrent users, 2 minutes"
echo "   - Spike test: 0→50→0 users"
echo "   - Sustained load: 5 users, 10 minutes"
k6 run --env API_URL="$API_URL" \
       --out json="$RESULTS_DIR/load_${TIMESTAMP}.json" \
       basic-load-test.js

echo "✅ Load test completed"
echo ""

# Test 3: Authentication Load Test
echo "3️⃣  Running Authentication Load Test..."
echo "   - Testing JWT_SECRET issue under load"
echo "   - 5 concurrent users, 1 minute"
k6 run --env API_URL="$API_URL" \
       --out json="$RESULTS_DIR/auth_${TIMESTAMP}.json" \
       auth-load-test.js

echo "✅ Authentication test completed"
echo ""

# Generate summary report
echo "📋 Generating Summary Report..."

cat > "$RESULTS_DIR/load_test_summary_${TIMESTAMP}.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>RealWorld Load Test Summary - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .test-section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; }
        .pass { color: green; }
        .fail { color: red; }
        .warning { color: orange; }
        .info { color: blue; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RealWorld Load Test Summary</h1>
        <p>Generated: $(date)</p>
        <p>API URL: $API_URL</p>
    </div>
    
    <div class="test-section">
        <h2>🎯 Test Objectives</h2>
        <ul>
            <li>Validate system performance under load</li>
            <li>Document JWT_SECRET configuration issue</li>
            <li>Measure response times and throughput</li>
            <li>Test system reliability and error handling</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>📊 Tests Executed</h2>
        <h3>1. Performance Baseline</h3>
        <p>Single user test to establish performance baselines</p>
        <p><strong>Files:</strong> baseline_${TIMESTAMP}.json, performance-baseline-report.html</p>
        
        <h3>2. Load Test</h3>
        <p>Multiple load scenarios: basic load, spike test, sustained load</p>
        <p><strong>Files:</strong> load_${TIMESTAMP}.json, load-test-summary.html</p>
        
        <h3>3. Authentication Load Test</h3>
        <p>Authentication endpoints under load (documents JWT_SECRET issue)</p>
        <p><strong>Files:</strong> auth_${TIMESTAMP}.json, auth-load-test-summary.html</p>
    </div>
    
    <div class="test-section">
        <h2>🚨 Known Issues</h2>
        <p class="fail">❌ JWT_SECRET environment variable not configured</p>
        <p class="warning">⚠️ Authentication endpoints return 500 errors</p>
        <p class="info">ℹ️ These tests document current system limitations</p>
    </div>
    
    <div class="test-section">
        <h2>📈 Performance Targets</h2>
        <ul>
            <li>Health endpoint: &lt;100ms (95th percentile)</li>
            <li>Articles endpoint: &lt;500ms (95th percentile)</li>
            <li>Error rate: &lt;10% overall</li>
            <li>Sustained load: 5 users for 10 minutes</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>📝 Next Steps</h2>
        <ol>
            <li>Configure JWT_SECRET in ECS task definition</li>
            <li>Deploy Application Load Balancer</li>
            <li>Re-run tests after fixes</li>
            <li>Integrate load tests into CI/CD pipeline</li>
        </ol>
    </div>
</body>
</html>
EOF

echo "📊 Summary report generated: $RESULTS_DIR/load_test_summary_${TIMESTAMP}.html"
echo ""

# List generated files
echo "📁 Generated Files:"
ls -la "$RESULTS_DIR/" | grep "$TIMESTAMP"
echo ""

echo "🎉 Load Testing Suite Completed!"
echo "=================================="
echo ""
echo "📋 To view results:"
echo "   • Open HTML reports in browser"
echo "   • Analyze JSON files for detailed metrics"
echo ""
echo "⚡ Performance Summary:"
echo "   • Check individual HTML reports for pass/fail status"
echo "   • Review response times against thresholds"
echo "   • Note JWT_SECRET issues in authentication tests"
echo ""
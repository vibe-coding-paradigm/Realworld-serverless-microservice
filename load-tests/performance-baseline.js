import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Performance baseline metrics
const healthResponseTime = new Trend('health_response_time');
const articlesResponseTime = new Trend('articles_response_time');
const successfulRequests = new Counter('successful_requests');

export const options = {
  scenarios: {
    // Performance baseline: single user, steady requests
    baseline: {
      executor: 'constant-vus',
      vus: 1,
      duration: __ENV.TEST_DURATION || '5m',
      tags: { test_type: 'baseline' },
    },
  },
  
  thresholds: {
    // Very conservative performance requirements for AWS ECS/ALB environment
    health_response_time: ['p(95)<3000'],   // Very generous threshold for cold starts and ALB latency
    articles_response_time: ['p(95)<5000'], // Very generous for database queries with potential cold starts
    http_req_failed: ['rate<0.10'],         // 10% failure rate to account for network/infrastructure variability
  },
};

const BASE_URL = __ENV.API_URL || 'http://3.39.187.72:8080';

export default function () {
  // Health check performance
  const healthStart = Date.now();
  const healthResponse = http.get(`${BASE_URL}/health`);
  const healthDuration = Date.now() - healthStart;
  
  healthResponseTime.add(healthDuration);
  
  const healthOk = check(healthResponse, {
    'health endpoint is healthy': (r) => r.status === 200,
    'health response is valid JSON': (r) => {
      try {
        const body = r.json();
        return body.status === 'ok';
      } catch (e) {
        return false;
      }
    },
  });
  
  if (healthOk) successfulRequests.add(1);
  
  // Articles endpoint performance
  const articlesStart = Date.now();
  const articlesResponse = http.get(`${BASE_URL}/api/articles`);
  const articlesDuration = Date.now() - articlesStart;
  
  articlesResponseTime.add(articlesDuration);
  
  const articlesOk = check(articlesResponse, {
    'articles endpoint responds correctly': (r) => r.status === 200,
    'articles response structure is valid': (r) => {
      try {
        const body = r.json();
        return body.hasOwnProperty('articles') && body.hasOwnProperty('articlesCount');
      } catch (e) {
        return false;
      }
    },
  });
  
  if (articlesOk) successfulRequests.add(1);
  
  // CORS verification
  const corsResponse = http.options(`${BASE_URL}/api/articles`, null, {
    headers: {
      'Origin': 'https://vibe-coding-paradigm.github.io',
      'Access-Control-Request-Method': 'GET',
    },
  });
  
  check(corsResponse, {
    'CORS headers are present': (r) => {
      const headers = r.headers;
      return headers['Access-Control-Allow-Origin'] !== undefined;
    },
  });
  
  // Consistent interval between requests
  sleep(2);
}

export function handleSummary(data) {
  const healthP95 = data.metrics.health_response_time?.values['p(95)'] || 0;
  const articlesP95 = data.metrics.articles_response_time?.values['p(95)'] || 0;
  const successRate = data.metrics.successful_requests?.values.count / 
                     (data.metrics.http_reqs?.values.count || 1);
  
  // Performance scoring (very conservative for AWS ECS/ALB with potential cold starts)
  let performanceScore = 100;
  if (healthP95 > 3000) performanceScore -= 20;
  if (articlesP95 > 5000) performanceScore -= 30;
  if (successRate < 0.90) performanceScore -= 40;
  
  return {
    'performance-baseline-results.json': JSON.stringify(data),
    'performance-baseline-report.html': `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Baseline Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 20px 0; padding: 15px; border-left: 4px solid #ccc; }
        .excellent { border-color: green; }
        .good { border-color: yellow; }
        .poor { border-color: red; }
        .score { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Performance Baseline Report</h1>
    
    <div class="metric ${performanceScore >= 90 ? 'excellent' : performanceScore >= 70 ? 'good' : 'poor'}">
        <h3>Overall Performance Score</h3>
        <div class="score">${performanceScore.toFixed(0)}/100</div>
    </div>
    
    <div class="metric">
        <h3>Health Endpoint Performance</h3>
        <p>Average Response Time: ${data.metrics.health_response_time?.values.avg?.toFixed(2) || 0}ms</p>
        <p>95th Percentile: ${healthP95.toFixed(2)}ms</p>
        <p>Target: &lt;3000ms (${healthP95 < 3000 ? '✅ PASS' : '❌ FAIL'})</p>
    </div>
    
    <div class="metric">
        <h3>Articles Endpoint Performance</h3>
        <p>Average Response Time: ${data.metrics.articles_response_time?.values.avg?.toFixed(2) || 0}ms</p>
        <p>95th Percentile: ${articlesP95.toFixed(2)}ms</p>
        <p>Target: &lt;5000ms (${articlesP95 < 5000 ? '✅ PASS' : '❌ FAIL'})</p>
    </div>
    
    <div class="metric">
        <h3>Reliability Metrics</h3>
        <p>Success Rate: ${(successRate * 100).toFixed(2)}%</p>
        <p>Total Requests: ${data.metrics.http_reqs?.values.count || 0}</p>
        <p>Failed Requests: ${data.metrics.http_req_failed?.values.count || 0}</p>
    </div>
    
    <div class="metric">
        <h3>System Information</h3>
        <p>Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(0)}s</p>
        <p>Target URL: ${BASE_URL}</p>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
</body>
</html>
    `,
  };
}
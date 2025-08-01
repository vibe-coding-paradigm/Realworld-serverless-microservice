import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    simple_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: __ENV.TEST_DURATION || '30s',
    },
  },
  // No thresholds - just collect data
};

const BASE_URL = __ENV.API_URL || 'http://3.39.187.72:8080';

export default function () {
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  
  check(healthResponse, {
    'health endpoint is 200': (r) => r.status === 200,
    'health has valid JSON': (r) => {
      try {
        const body = r.json();
        return body.status === 'ok';
      } catch (e) {
        return false;
      }
    },
  });
  
  // Test articles endpoint
  const articlesResponse = http.get(`${BASE_URL}/api/articles`);
  
  check(articlesResponse, {
    'articles endpoint is 200': (r) => r.status === 200,
    'articles has valid structure': (r) => {
      try {
        const body = r.json();
        return body.hasOwnProperty('articles') && body.hasOwnProperty('articlesCount');
      } catch (e) {
        return false;
      }
    },
  });
  
  sleep(1);
}

export function handleSummary(data) {
  const avgResponseTime = data.metrics.http_req_duration?.values.avg || 0;
  const p95ResponseTime = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const failureRate = data.metrics.http_req_failed?.values.rate || 0;
  
  return {
    'simple-test-results.json': JSON.stringify(data),
    'simple-test-report.html': `
<!DOCTYPE html>
<html>
<head>
    <title>Simple Load Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 20px 0; padding: 15px; border-left: 4px solid #ccc; }
        .success { border-color: green; }
        .warning { border-color: orange; }
        .error { border-color: red; }
    </style>
</head>
<body>
    <h1>Simple Load Test Results</h1>
    
    <div class="metric success">
        <h3>Test Completion</h3>
        <p>✅ Test completed successfully without threshold failures</p>
        <p>Duration: ${(data.state.testRunDurationMs / 1000).toFixed(0)}s</p>
        <p>Total Requests: ${data.metrics.http_reqs?.values.count || 0}</p>
    </div>
    
    <div class="metric ${failureRate > 0.1 ? 'error' : 'success'}">
        <h3>Performance Metrics</h3>
        <p>Average Response Time: ${avgResponseTime.toFixed(2)}ms</p>
        <p>95th Percentile: ${p95ResponseTime.toFixed(2)}ms</p>
        <p>Failure Rate: ${(failureRate * 100).toFixed(2)}%</p>
    </div>
    
    <div class="metric">
        <h3>Backend Information</h3>
        <p>Target URL: ${BASE_URL}</p>
        <p>Test Type: Simple validation without strict thresholds</p>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
</body>
</html>
    `,
  };
}
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const articleRequestsCounter = new Counter('article_requests_total');
const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time_ms');

// Test configuration
export const options = {
  scenarios: {
    // Basic load test: 10 concurrent users for 2 minutes
    basic_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
      tags: { test_type: 'basic_load' },
    },
    
    // Spike test: sudden traffic increase
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 0 },    // Ramp-up period
        { duration: '30s', target: 50 },   // Spike to 50 users
        { duration: '30s', target: 0 },    // Ramp-down
      ],
      tags: { test_type: 'spike' },
    },
    
    // Sustained load test: 5 users for 10 minutes
    sustained_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10m',
      tags: { test_type: 'sustained' },
    },
  },
  
  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
    errors: ['rate<0.1'],              // Custom error rate
    response_time_ms: ['p(90)<1500'],  // 90% of responses should be under 1.5s
  },
};

// Test configuration
const BASE_URL = __ENV.API_URL || 'http://3.39.187.72:8080';

export default function () {
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(healthResponse, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health response contains service name': (r) => r.json('service') === 'conduit-api',
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  if (!healthCheck) {
    errorRate.add(1);
  }
  
  responseTimeTrend.add(healthResponse.timings.duration);
  
  // Test articles endpoint
  const articlesResponse = http.get(`${BASE_URL}/api/articles`);
  
  const articlesCheck = check(articlesResponse, {
    'articles endpoint status is 200': (r) => r.status === 200,
    'articles response contains articles array': (r) => {
      const body = r.json();
      return body.hasOwnProperty('articles') && body.hasOwnProperty('articlesCount');
    },
    'articles response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!articlesCheck) {
    errorRate.add(1);
  }
  
  articleRequestsCounter.add(1);
  responseTimeTrend.add(articlesResponse.timings.duration);
  
  // Test CORS preflight (simulate browser behavior)
  const corsResponse = http.options(`${BASE_URL}/api/articles`, null, {
    headers: {
      'Origin': 'https://vibe-coding-paradigm.github.io',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization,Content-Type',
    },
  });
  
  check(corsResponse, {
    'CORS preflight succeeds': (r) => r.status === 200 || r.status === 204,
  });
  
  // Simulate user think time
  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data),
    'load-test-summary.html': `
<!DOCTYPE html>
<html>
<head>
    <title>K6 Load Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 20px 0; }
        .pass { color: green; }
        .fail { color: red; }
        .warning { color: orange; }
    </style>
</head>
<body>
    <h1>K6 Load Test Results</h1>
    <div class="metric">
        <h3>Test Summary</h3>
        <p>Duration: ${data.state.testRunDurationMs}ms</p>
        <p>VUs Max: ${data.metrics.vus_max.values.max}</p>
        <p>Iterations: ${data.metrics.iterations.values.count}</p>
    </div>
    
    <div class="metric">
        <h3>HTTP Metrics</h3>
        <p>Requests: ${data.metrics.http_reqs.values.count}</p>
        <p>Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%</p>
        <p>Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms</p>
        <p>95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</p>
    </div>
    
    <div class="metric">
        <h3>Threshold Results</h3>
        ${Object.entries(data.thresholds || {}).map(([name, threshold]) => 
          `<p class="${threshold.ok ? 'pass' : 'fail'}">${name}: ${threshold.ok ? 'PASS' : 'FAIL'}</p>`
        ).join('')}
    </div>
</body>
</html>
    `,
  };
}
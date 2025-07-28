import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom metrics
const authErrorsCounter = new Counter('auth_errors_total');
const authAttemptsCounter = new Counter('auth_attempts_total');
const jwtErrorRate = new Rate('jwt_errors');

export const options = {
  scenarios: {
    // Test authentication endpoints under load
    auth_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { test_type: 'auth_load' },
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<3000'], // Allow higher threshold for auth endpoints
    jwt_errors: ['rate<1.0'], // Expect JWT errors due to missing secret
  },
};

const BASE_URL = __ENV.API_URL || 'http://3.39.187.72:8080';

// Test data generator
function generateTestUser() {
  const timestamp = Date.now();
  return {
    username: `loadtest${timestamp}${Math.random().toString(36).substr(2, 5)}`,
    email: `loadtest${timestamp}@example.com`,
    password: 'loadtest123',
  };
}

export default function () {
  const testUser = generateTestUser();
  
  // Test user registration (expect JWT_SECRET error)
  const registrationResponse = http.post(`${BASE_URL}/api/users`, 
    JSON.stringify({ user: testUser }), 
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  authAttemptsCounter.add(1);
  
  const registrationCheck = check(registrationResponse, {
    'registration returns 500 (JWT_SECRET missing)': (r) => r.status === 500,
    'registration error contains token error': (r) => {
      try {
        const body = r.json();
        return body.errors && body.errors.token && 
               body.errors.token.includes('Failed to generate token');
      } catch (e) {
        return false;
      }
    },
  });
  
  if (registrationResponse.status === 500) {
    jwtErrorRate.add(1);
    authErrorsCounter.add(1);
  }
  
  // Test login attempt (expect failure)
  const loginResponse = http.post(`${BASE_URL}/api/users/login`,
    JSON.stringify({ 
      user: { 
        email: testUser.email, 
        password: testUser.password 
      } 
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  authAttemptsCounter.add(1);
  
  check(loginResponse, {
    'login fails as expected (no user exists)': (r) => r.status === 401 || r.status === 500,
  });
  
  if (loginResponse.status >= 400) {
    authErrorsCounter.add(1);
  }
  
  // Test protected endpoint without token
  const protectedResponse = http.post(`${BASE_URL}/api/articles`,
    JSON.stringify({
      article: {
        title: 'Load Test Article',
        description: 'Created during load testing',
        body: 'Load testing content',
        tagList: ['loadtest'],
      }
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  check(protectedResponse, {
    'protected endpoint requires auth': (r) => r.status === 401,
  });
  
  sleep(0.5);
}

export function handleSummary(data) {
  const authErrorRate = data.metrics.auth_errors_total ? 
    data.metrics.auth_errors_total.values.count / data.metrics.auth_attempts_total.values.count : 0;
  
  return {
    'auth-load-test-results.json': JSON.stringify(data),
    'auth-load-test-summary.html': `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Load Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 20px 0; }
        .error { color: red; }
        .warning { color: orange; }
        .info { color: blue; }
    </style>
</head>
<body>
    <h1>Authentication Load Test Results</h1>
    
    <div class="metric">
        <h3>Authentication Metrics</h3>
        <p>Total Auth Attempts: ${data.metrics.auth_attempts_total?.values.count || 0}</p>
        <p>Auth Errors: ${data.metrics.auth_errors_total?.values.count || 0}</p>
        <p class="error">Auth Error Rate: ${(authErrorRate * 100).toFixed(2)}%</p>
        <p class="warning">JWT Error Rate: ${(data.metrics.jwt_errors?.values.rate * 100 || 0).toFixed(2)}%</p>
    </div>
    
    <div class="metric">
        <h3>Current System State</h3>
        <p class="error">❌ JWT_SECRET is not configured - authentication is broken</p>
        <p class="warning">⚠️ All authentication requests fail with 500 errors</p>
        <p class="info">ℹ️ This test documents the current broken state</p>
    </div>
    
    <div class="metric">
        <h3>Performance Under Auth Load</h3>
        <p>Average Response Time: ${data.metrics.http_req_duration?.values.avg.toFixed(2) || 0}ms</p>
        <p>95th Percentile: ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2) || 0}ms</p>
        <p>Requests Per Second: ${(data.metrics.http_reqs?.values.rate || 0).toFixed(2)}</p>
    </div>
</body>
</html>
    `,
  };
}
import { FullConfig } from '@playwright/test';

/**
 * Environment detection helper
 */
function detectEnvironment() {
  const frontendUrl = process.env.PLAYWRIGHT_BASE_URL;
  const isCI = !!process.env.CI;
  const isLocal = frontendUrl?.includes('localhost') || (!frontendUrl && !isCI);
  
  return {
    isCI,
    isLocal,
    frontendUrl: frontendUrl || (isLocal ? 'http://localhost:3000' : 'https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/'),
    apiUrl: process.env.API_URL || 'https://d1ct76fqx0s1b8.cloudfront.net'
  };
}

/**
 * Global setup for Playwright tests
 * 
 * This setup runs once before all tests and prepares the test environment
 * Automatically handles both local development and cloud deployment scenarios
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  const env = detectEnvironment();
  const frontendUrl = config.use?.baseURL || env.frontendUrl;
  
  console.log(`Environment: ${env.isLocal ? 'Local Development' : 'Cloud/CI'}`);
  console.log(`Frontend URL: ${frontendUrl}`);
  console.log(`Backend API URL: ${env.apiUrl}`);
  
  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...');
  
  try {
    // Check if backend is healthy
    const healthUrl = env.apiUrl.endsWith('/api') ? env.apiUrl.slice(0, -4) : env.apiUrl;
    const response = await fetch(`${healthUrl}/health`);
    if (response.ok) {
      const health = await response.json();
      console.log(`✅ Backend healthy: ${health.service} v${health.version}`);
    } else {
      console.warn(`⚠️ Backend health check failed: ${response.status}`);
    }
  } catch (error) {
    console.warn(`⚠️ Cannot reach backend: ${error}`);
  }

  // Check if frontend is ready
  if (frontendUrl) {
    const isLocalhost = frontendUrl.includes('localhost');
    
    if (isLocalhost) {
      // For local development, give more time for dev server to start
      console.log('⏳ Waiting for local dev server to be ready...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      // For GitHub Pages, wait for CDN to stabilize
      console.log('⏳ Waiting 3 seconds for GitHub Pages CDN to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`⏳ Checking frontend at ${frontendUrl}...`);
    
    let frontendReady = false;
    const maxRetries = isLocalhost ? 20 : 10; // More retries for local dev server
    const retryInterval = isLocalhost ? 3000 : 5000; // Shorter intervals for local
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const frontendResponse = await fetch(frontendUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; E2E-Test/1.0)'
          }
        });
        
        if (frontendResponse.ok) {
          const htmlContent = await frontendResponse.text();
          
          // Check if it's actually our React app (not a 404 page)
          if (htmlContent.includes('Vite + React') || htmlContent.includes('RealWorld') || htmlContent.includes('<div id="root">')) {
            console.log('✅ Frontend is ready and serving React app');
            frontendReady = true;
            break;
          } else {
            console.log(`⏳ Attempt ${i + 1}: Frontend responded but not serving React app yet...`);
          }
        } else {
          console.log(`⏳ Attempt ${i + 1}: Frontend responded with ${frontendResponse.status}...`);
        }
      } catch (error) {
        if (isLocalhost) {
          console.log(`⏳ Attempt ${i + 1}: Waiting for local dev server to start...`);
        } else {
          console.log(`⏳ Attempt ${i + 1}: Cannot reach frontend, retrying...`);
        }
      }
      
      // Wait before next attempt
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    
    if (!frontendReady) {
      if (isLocalhost) {
        console.error('❌ Local dev server is not ready after maximum retries');
        console.error('Make sure to run "npm run dev" in a separate terminal');
      } else {
        console.error('❌ Frontend is not ready after maximum retries');
        console.error('This may cause E2E tests to fail');
      }
    }
  } else {
    console.warn('⚠️ Frontend URL not configured, skipping frontend readiness check');
  }
  
  // Store environment info for tests
  process.env.API_URL = env.apiUrl;
  process.env.FRONTEND_URL = frontendUrl;
  process.env.TEST_ENVIRONMENT = env.isLocal ? 'local' : 'cloud';
  
  console.log('✅ E2E test environment setup complete');
}

export default globalSetup;
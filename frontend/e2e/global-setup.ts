import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * 
 * This setup runs once before all tests and prepares the test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  // Get API URL from environment variables (set by workflow)
  const apiUrl = process.env.API_URL || 'http://conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com';
  
  console.log(`Frontend URL: ${config.use?.baseURL}`);
  console.log(`Backend API URL: ${apiUrl}`);
  
  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...');
  
  try {
    // Check if backend is healthy
    const response = await fetch(`${apiUrl}/health`);
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
  const frontendUrl = config.use?.baseURL;
  if (frontendUrl) {
    console.log(`⏳ Checking frontend at ${frontendUrl}...`);
    
    let frontendReady = false;
    const maxRetries = 30; // 5 minutes with 10s intervals
    
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
        console.log(`⏳ Attempt ${i + 1}: Cannot reach frontend, retrying...`);
      }
      
      // Wait 10 seconds before next attempt
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    if (!frontendReady) {
      console.error('❌ Frontend is not ready after maximum retries');
      console.error('This may cause E2E tests to fail');
    }
  } else {
    console.warn('⚠️ Frontend URL not configured, skipping frontend readiness check');
  }
  
  // Store API URL for tests
  process.env.API_URL = apiUrl;
  
  console.log('✅ E2E test environment setup complete');
}

export default globalSetup;
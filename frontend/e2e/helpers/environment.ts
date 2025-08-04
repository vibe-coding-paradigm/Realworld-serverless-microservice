/**
 * Environment configuration and detection for E2E tests
 * Supports both local development and cloud deployment environments
 */

export type Environment = 'local' | 'cloud';

export interface EnvironmentConfig {
  frontend: {
    baseUrl: string;
    basePath: string;
  };
  backend: {
    apiUrl: string;
    healthUrl: string;
  };
  testing: {
    strategy: 'token-injection' | 'full-flow';
    timeouts: {
      action: number;
      navigation: number;
      wait: number;
    };
  };
}

/**
 * Environment configuration matrix
 */
const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  local: {
    frontend: {
      baseUrl: 'http://localhost:3000',
      basePath: ''
    },
    backend: {
      apiUrl: 'http://localhost:8080/api',
      healthUrl: 'http://localhost:8080'
    },
    testing: {
      strategy: 'token-injection',
      timeouts: {
        action: 15000,
        navigation: 30000,
        wait: 3000
      }
    }
  },
  cloud: {
    frontend: {
      baseUrl: 'https://vibe-coding-paradigm.github.io',
      basePath: '/Realworld-serverless-microservice'
    },
    backend: {
      apiUrl: 'https://9d81ipursj.execute-api.ap-northeast-2.amazonaws.com/v1',
      healthUrl: 'https://9d81ipursj.execute-api.ap-northeast-2.amazonaws.com/v1'
    },
    testing: {
      strategy: 'full-flow',
      timeouts: {
        action: 30000,
        navigation: 60000,
        wait: 5000
      }
    }
  }
};

/**
 * Detect current environment based on various criteria
 */
export function detectEnvironment(): Environment {
  // Priority 1: Explicit environment variable
  if (process.env.E2E_ENVIRONMENT) {
    return process.env.E2E_ENVIRONMENT as Environment;
  }
  
  // Priority 2: Cloud backend URL presence
  if (process.env.CLOUD_BACKEND_URL) {
    return 'cloud';
  }
  
  // Priority 3: CI environment detection
  if (process.env.CI) {
    return 'cloud';
  }
  
  // Priority 4: API URL pattern detection
  if (process.env.API_URL && process.env.API_URL.includes('localhost')) {
    return 'local';
  }
  
  // Priority 5: Playwright base URL detection
  if (process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_BASE_URL.includes('localhost')) {
    return 'local';
  }
  
  // Priority 6: Default to cloud for production testing
  return 'cloud';
}

/**
 * Get configuration for current environment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = detectEnvironment();
  const config = { ...ENVIRONMENT_CONFIGS[environment] };
  
  // Override with environment variables if available (for cloud environment)
  if (environment === 'cloud') {
    // Override backend API URL if environment variables are set
    const dynamicApiUrl = process.env.CLOUD_BACKEND_URL ||
                         process.env.BACKEND_URL ||
                         process.env.API_URL ||
                         process.env.VITE_API_URL;
    
    if (dynamicApiUrl) {
      config.backend.apiUrl = dynamicApiUrl;
      config.backend.healthUrl = dynamicApiUrl;
    }
    
    // Override frontend URL if environment variables are set
    const dynamicFrontendUrl = process.env.PLAYWRIGHT_BASE_URL ||
                              process.env.FRONTEND_URL;
    
    if (dynamicFrontendUrl) {
      if (dynamicFrontendUrl.includes('github.io')) {
        config.frontend.baseUrl = 'https://vibe-coding-paradigm.github.io';
        config.frontend.basePath = '/Realworld-serverless-microservice';
      } else {
        config.frontend.baseUrl = dynamicFrontendUrl;
        config.frontend.basePath = '';
      }
    }
  }
  
  // Only log during actual test execution, not during import
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
    console.log(`🔧 Environment: ${environment}`);
    console.log(`📍 Frontend: ${config.frontend.baseUrl}${config.frontend.basePath}`);
    console.log(`🔗 Backend: ${config.backend.apiUrl}`);
    console.log(`🧪 Strategy: ${config.testing.strategy}`);
  }
  
  return config;
}

/**
 * Get full URL for a given path in current environment
 */
export function getFullURL(path: string = '/'): string {
  const config = getEnvironmentConfig();
  const { baseUrl, basePath } = config.frontend;
  
  // Clean up path
  const cleanPath = path.replace(/^\//, '');
  const fullBasePath = basePath ? `${baseUrl}${basePath}` : baseUrl;
  
  return cleanPath ? `${fullBasePath}/${cleanPath}` : fullBasePath;
}

/**
 * Get API URL for current environment
 */
export function getApiUrl(): string {
  const config = getEnvironmentConfig();
  return config.backend.apiUrl;
}

/**
 * Get health check URL for current environment
 */
export function getHealthUrl(): string {
  const config = getEnvironmentConfig();
  return config.backend.healthUrl;
}

/**
 * Get testing strategy for current environment
 */
export function getTestingStrategy(): 'token-injection' | 'full-flow' {
  const config = getEnvironmentConfig();
  return config.testing.strategy;
}

/**
 * Get environment-specific timeouts
 */
export function getTimeouts() {
  const config = getEnvironmentConfig();
  return config.testing.timeouts;
}

/**
 * Check if running in local environment
 */
export function isLocalEnvironment(): boolean {
  return detectEnvironment() === 'local';
}

/**
 * Check if running in cloud environment
 */
export function isCloudEnvironment(): boolean {
  return detectEnvironment() === 'cloud';
}
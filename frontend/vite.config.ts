import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // GitHub Pages에서만 base path 사용, 로컬 개발에서는 사용하지 않음
  const base = mode === 'production' ? '/Realworld-serverless-microservice/' : '/';
  
  return {
    plugins: [react()],
    base,
    server: {
      port: 3000
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // For local development, use CloudFront directly to avoid proxy issues
      // BUT for E2E testing, allow override via VITE_API_URL
      __DEV_API_URL__: mode === 'development' 
        ? process.env.VITE_API_URL 
          ? 'undefined'  // Let VITE_API_URL take precedence in E2E tests
          : '"https://8e299o0dw4.execute-api.ap-northeast-2.amazonaws.com"'
        : 'undefined'
    }
  };
})

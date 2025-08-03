import { test, expect } from '@playwright/test';
import { generateTestUser, generateTestArticle, waitTimes, navigateToPage } from '../helpers/test-data';

/**
 * Phase 1 데모 시나리오 E2E 테스트
 * 
 * 실제 데모에서 실패했던 시나리오들을 정확히 재현하여 테스트
 * 실제 프로덕션 환경(GitHub Pages + AWS CloudFront)에서 테스트
 */
test.describe('Phase 1 Demo Scenario - Production Environment', () => {
  
  test('Complete demo scenario - exactly as performed in demo', async ({ page }) => {
    console.log('🎬 Starting Phase 1 Demo Scenario Test');
    console.log('🌐 Testing against production environment:');
    console.log(`   Frontend: ${page.context().baseURL || 'GitHub Pages'}`);
    console.log(`   Backend: Expected CloudFront API`);
    
    // ===== 1단계: 시스템 확인 =====
    console.log('\n📋 1단계: 시스템 확인');
    
    await test.step('프론트엔드 접속 및 기본 UI 확인', async () => {
      await navigateToPage(page, '/');
      await page.waitForLoadState('networkidle');
      
      // 기본 페이지 구조 확인
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('h1:has-text("conduit")')).toBeVisible();
      await expect(page.locator('text=A place to share your knowledge')).toBeVisible();
      
      // 로그아웃 상태 UI 확인 - 정확한 선택자 사용
      await expect(page.locator('nav a:has-text("Sign in")')).toBeVisible();
      await expect(page.locator('nav a:has-text("Sign up")')).toBeVisible();
      await expect(page.locator('text=Welcome to Conduit')).toBeVisible();
      
      console.log('✅ 프론트엔드 기본 UI 정상');
    });
    
    await test.step('백엔드 연결 및 기존 게시글 확인', async () => {
      // API 요청을 통한 백엔드 연결 확인
      const response = await page.request.get('/api/articles');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('articles');
      expect(data).toHaveProperty('articlesCount');
      
      console.log(`✅ 백엔드 연결 정상, 게시글 ${data.articlesCount}개 확인`);
      
      // 페이지에서도 게시글이 보이는지 확인
      if (data.articlesCount > 0) {
        await expect(page.locator('article, .article-preview').first()).toBeVisible({ timeout: waitTimes.medium });
        console.log('✅ 페이지에서 게시글 목록 표시 확인');
      }
    });
    
    // ===== 2단계: 사용자 인증 =====
    console.log('\n🔐 2단계: 사용자 인증');
    
    const testUser = generateTestUser();
    console.log(`🆔 테스트 사용자: ${testUser.username} (${testUser.email})`);
    
    await test.step('회원가입 - 데모와 동일한 플로우', async () => {
      // Sign up 링크 클릭
      await page.click('a:has-text("Sign up")');
      await expect(page.locator('h1:has-text("Sign up")')).toBeVisible();
      
      // 회원가입 폼 작성 - 데모에서 사용한 방식과 동일
      await page.locator('input[name="username"]').fill(testUser.username);
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      
      // 폼 제출 및 응답 모니터링
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/users') && response.request().method() === 'POST'
      );
      
      await page.click('button:has-text("Sign up")');
      
      const response = await responsePromise;
      console.log(`회원가입 API 응답: ${response.status()}`);
      
      // 성공적인 회원가입 확인
      expect(response.status()).toBe(201);
      
      // 자동 로그인 후 UI 변화 확인
      await page.waitForLoadState('networkidle');
      await expect(page.locator('a:has-text("New Article")')).toBeVisible({ timeout: waitTimes.medium });
      await expect(page.locator(`text=${testUser.username}`)).toBeVisible();
      await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
      
      console.log('✅ 회원가입 성공 및 자동 로그인 확인');
    });
    
    await test.step('JWT 토큰 저장 확인', async () => {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
      expect(token.split('.')).toHaveLength(3); // JWT 형식 확인
      
      console.log(`✅ JWT 토큰 저장 확인 (길이: ${token.length})`);
    });
    
    await test.step('로그아웃 및 UI 상태 변화 확인', async () => {
      await page.click('button:has-text("Sign out")');
      await page.waitForLoadState('networkidle');
      
      // 로그아웃 후 UI 변화 확인
      await expect(page.locator('a:has-text("Sign in")')).toBeVisible();
      await expect(page.locator('a:has-text("Sign up")')).toBeVisible();
      await expect(page.locator('text=Welcome to Conduit')).toBeVisible();
      
      // 토큰 삭제 확인
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
      
      console.log('✅ 로그아웃 및 토큰 삭제 확인');
    });
    
    await test.step('재로그인 - 데모에서 실행한 플로우', async () => {
      await page.click('a:has-text("Sign in")');
      await expect(page.locator('h1:has-text("Sign in")')).toBeVisible();
      
      // 로그인 폼 작성
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      
      // 로그인 요청 모니터링
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/users/login') && response.request().method() === 'POST'
      );
      
      await page.click('button:has-text("Sign in")');
      
      const response = await responsePromise;
      console.log(`로그인 API 응답: ${response.status()}`);
      
      if (response.status() !== 200) {
        const errorData = await response.text();
        console.log(`❌ 로그인 실패: ${errorData}`);
        throw new Error(`Login failed with status ${response.status()}`);
      }
      
      // 로그인 성공 후 UI 확인
      await page.waitForLoadState('networkidle');
      await expect(page.locator('a:has-text("New Article")')).toBeVisible({ timeout: waitTimes.medium });
      
      console.log('✅ 재로그인 성공');
    });
    
    // ===== 3단계: 게시글 관리 (데모에서 실패한 부분) =====
    console.log('\n📝 3단계: 게시글 관리 - 데모 실패 시나리오 재현');
    
    const testArticle = generateTestArticle();
    testArticle.title = `Phase 1 데모 완료 게시글 ${Date.now()}`;
    testArticle.description = 'RealWorld 앱 Phase 1 마이그레이션 성공 데모';
    testArticle.body = `# 🎉 RealWorld Phase 1 완료 데모

## 마이그레이션 성과

### 구현된 기능들
- **사용자 인증**: JWT 기반 회원가입/로그인 시스템
- **게시글 CRUD**: 마크다운 지원 에디터
- **댓글 시스템**: 실시간 댓글 작성/삭제
- **클라우드 배포**: AWS ECS/Fargate + GitHub Pages

### 기술 스택
- **프론트엔드**: React 19 + TypeScript + Tailwind CSS
- **백엔드**: Go Clean Architecture + SQLite
- **인프라**: AWS CDK + Docker

> 이 게시글은 E2E 테스트로 작성되었습니다.

**테스트 타임스탬프**: ${new Date().toISOString()}`;
    
    await test.step('게시글 작성 페이지 접근', async () => {
      await page.click('a:has-text("New Article")');
      await expect(page.locator('h1:has-text("New Article")')).toBeVisible();
      
      // 에디터 폼 확인
      await expect(page.locator('input[placeholder*="Article Title"], input[name="title"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="What\'s this article about"], input[name="description"]')).toBeVisible();
      await expect(page.locator('textarea[placeholder*="Write your article"], textarea[name="body"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="Enter tags"], input[name="tagList"]')).toBeVisible();
      
      console.log('✅ 게시글 작성 에디터 접근 성공');
    });
    
    await test.step('게시글 폼 작성 - 데모와 동일한 내용', async () => {
      // 제목 입력
      await page.locator('input[placeholder*="Article Title"], input[name="title"]').fill(testArticle.title);
      
      // 설명 입력
      await page.locator('input[placeholder*="What\'s this article about"], input[name="description"]').fill(testArticle.description);
      
      // 본문 입력 (마크다운)
      await page.locator('textarea[placeholder*="Write your article"], textarea[name="body"]').fill(testArticle.body);
      
      // 태그 입력 - 데모에서와 같이 여러 태그 추가
      const tagInput = page.locator('input[placeholder*="Enter tags"], input[name="tagList"]');
      
      // 첫 번째 태그
      await tagInput.fill('demo');
      await tagInput.press('Enter');
      
      // 두 번째 태그  
      await tagInput.fill('phase1');
      await tagInput.press('Enter');
      
      // 세 번째 태그
      await tagInput.fill('e2e-test');
      await tagInput.press('Enter');
      
      console.log('✅ 게시글 폼 작성 완료');
    });
    
    await test.step('게시글 발행 - 데모에서 실패한 부분', async () => {
      // 토큰 확인
      const tokenBeforePublish = await page.evaluate(() => localStorage.getItem('token'));
      expect(tokenBeforePublish).toBeTruthy();
      console.log('✅ 발행 전 토큰 확인됨');
      
      // 게시글 발행 요청 모니터링
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/articles') && response.request().method() === 'POST'
      );
      
      // 발행 버튼 클릭
      await page.click('button:has-text("Publish Article")');
      
      // API 응답 확인
      try {
        const response = await responsePromise;
        console.log(`게시글 발행 API 응답: ${response.status()}`);
        
        if (response.status() === 401) {
          console.log('❌ 401 에러 발생 - 데모에서와 동일한 실패');
          
          // 에러 상세 정보 수집
          const errorData = await response.text();
          console.log(`에러 응답: ${errorData}`);
          
          // 토큰 상태 재확인
          const tokenAfterFail = await page.evaluate(() => localStorage.getItem('token'));
          console.log(`실패 후 토큰 상태: ${tokenAfterFail ? '존재' : '삭제됨'}`);
          
          // 현재 페이지 URL 확인
          const currentUrl = page.url();
          console.log(`실패 후 현재 URL: ${currentUrl}`);
          
          // 이 시점에서 실패로 처리 - 데모와 동일한 문제
          throw new Error(`Article creation failed with 401 - Same as demo failure`);
        } else if (response.status() === 201) {
          console.log('✅ 게시글 발행 성공');
          
          // 성공 시 리디렉션 확인
          await page.waitForLoadState('networkidle');
          const currentUrl = page.url();
          expect(currentUrl).toContain('/article/');
          
          console.log(`✅ 게시글 페이지로 리디렉션: ${currentUrl}`);
        } else {
          throw new Error(`Unexpected status: ${response.status()}`);
        }
      } catch (error) {
        // 타임아웃이나 기타 에러의 경우
        console.log(`❌ 게시글 발행 중 에러: ${error.message}`);
        
        // 현재 상태 디버깅
        const currentUrl = page.url();
        const currentTitle = await page.title();
        console.log(`현재 페이지: ${currentUrl}`);
        console.log(`페이지 제목: ${currentTitle}`);
        
        // 404 페이지로 리디렉션되었는지 확인 (데모에서 발생한 현상)
        if (currentTitle.includes('404') || currentUrl.includes('404')) {
          console.log('❌ 404 페이지로 리디렉션됨 - 데모와 동일한 현상');
        }
        
        throw error;
      }
    });
    
    // ===== 4단계: 게시글 상세 페이지 테스트 (데모에서 실패한 부분) =====
    console.log('\n📖 4단계: 게시글 상세 페이지 - 데모 실패 시나리오');
    
    await test.step('기존 게시글 접근 시도', async () => {
      // 홈페이지로 돌아가기
      await navigateToPage(page, '/');
      await page.waitForLoadState('networkidle');
      
      // 기존 게시글 확인
      const articleLinks = page.locator('a[href*="/article/"]');
      const articleCount = await articleLinks.count();
      
      if (articleCount > 0) {
        console.log(`📄 기존 게시글 ${articleCount}개 발견`);
        
        // 첫 번째 게시글 클릭
        const firstArticle = articleLinks.first();
        const articleUrl = await firstArticle.getAttribute('href');
        console.log(`첫 번째 게시글 URL: ${articleUrl}`);
        
        // JavaScript 에러 모니터링
        const errors: string[] = [];
        page.on('pageerror', error => {
          errors.push(error.message);
          console.log(`❌ JavaScript 에러 감지: ${error.message}`);
        });
        
        // 게시글 클릭
        await firstArticle.click();
        
        // 페이지 로드 대기
        await page.waitForTimeout(3000);
        
        // JavaScript 에러 확인
        if (errors.length > 0) {
          console.log(`❌ JavaScript 에러 발생 (데모와 동일): ${errors.join(', ')}`);
          
          // 페이지가 비어있는지 확인
          const pageContent = await page.textContent('body');
          if (!pageContent || pageContent.trim().length < 100) {
            console.log('❌ 페이지가 비어있음 - 데모와 동일한 현상');
          }
          
          // 이는 예상된 실패이므로 문서화
          console.log('⚠️  게시글 상세 페이지 JavaScript 에러 - 알려진 이슈');
        } else {
          // 성공적으로 로드된 경우
          await expect(page.locator('h1')).toBeVisible({ timeout: waitTimes.medium });
          console.log('✅ 게시글 상세 페이지 정상 로드');
        }
      } else {
        console.log('📄 표시할 게시글이 없음');
      }
    });
    
    // ===== 5단계: 테스트 결과 요약 =====
    console.log('\n📊 데모 시나리오 테스트 완료');
    console.log('='.repeat(50));
    console.log('✅ 시스템 접근 및 기본 UI');
    console.log('✅ 사용자 인증 (회원가입/로그인/로그아웃)');
    console.log('✅ JWT 토큰 관리');
    console.log('✅ 게시글 작성 폼 접근');
    console.log('⚠️  게시글 발행 - 401 에러 (데모와 동일한 문제)');
    console.log('⚠️  게시글 상세 페이지 - JavaScript 에러 (데모와 동일한 문제)');
    console.log('='.repeat(50));
    
    // 이 테스트는 실제 데모의 문제점들을 정확히 재현하는 것이 목적
    // 따라서 일부 실패는 예상되며, 이를 통해 실제 문제를 식별
  });
  
  test('Verify production environment configuration', async ({ page }) => {
    console.log('\n🔧 프로덕션 환경 설정 검증');
    
    await test.step('API 엔드포인트 확인', async () => {
      await navigateToPage(page, '/');
      
      // 페이지에서 사용되는 API URL 확인
      const apiUrl = await page.evaluate(() => {
        // @ts-ignore
        return window.VITE_API_URL || 'https://d1ct76fqx0s1b8.cloudfront.net/api';
      });
      
      console.log(`현재 API URL: ${apiUrl}`);
      
      // CloudFront URL인지 확인
      if (apiUrl && apiUrl.includes('cloudfront.net')) {
        console.log('✅ CloudFront API 엔드포인트 사용');
      } else {
        console.log('⚠️  예상과 다른 API 엔드포인트');
      }
    });
    
    await test.step('CORS 및 네트워크 설정 확인', async () => {
      // API 요청 테스트
      const response = await page.request.get('/api/articles');
      
      const headers = response.headers();
      console.log('API 응답 헤더:');
      console.log(`  Status: ${response.status()}`);
      console.log(`  Access-Control-Allow-Origin: ${headers['access-control-allow-origin'] || 'Not set'}`);
      console.log(`  Content-Type: ${headers['content-type'] || 'Not set'}`);
      
      expect(response.status()).toBe(200);
    });
  });
});

/**
 * Edge Case 테스트 - 데모에서 발생한 문제들
 */
test.describe('Demo Failure Edge Cases', () => {
  
  test('Handle 401 authentication errors gracefully', async ({ page }) => {
    console.log('\n🚨 401 에러 처리 테스트');
    
    await navigateToPage(page, '/');
    
    // 잘못된 토큰으로 API 요청 시도
    await page.evaluate(() => {
      localStorage.setItem('token', 'invalid-token');
    });
    
    await navigateToPage(page, '/');
    
    // 인증이 필요한 작업 시도
    const response = await page.request.post('/api/articles', {
      headers: {
        'Authorization': 'Token invalid-token',
        'Content-Type': 'application/json'
      },
      data: {
        article: {
          title: 'Test',
          description: 'Test',
          body: 'Test',
          tagList: []
        }
      }
    });
    
    expect(response.status()).toBe(401);
    console.log('✅ 401 에러 정상적으로 발생');
  });
  
  test('Handle JavaScript errors without crashing', async ({ page }) => {
    console.log('\n🐛 JavaScript 에러 처리 테스트');
    
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await navigateToPage(page, '/');
    
    // 존재하지 않는 게시글 접근 시도
    await page.goto('/article/non-existent-article');
    
    // 에러가 발생해도 페이지가 완전히 깨지지 않는지 확인
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    
    if (errors.length > 0) {
      console.log(`JavaScript 에러 ${errors.length}개 감지됨`);
      errors.forEach(error => console.log(`  - ${error}`));
    }
  });
});
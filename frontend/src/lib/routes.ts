/**
 * 애플리케이션의 모든 라우트 경로를 중앙 관리
 * basename 설정과 무관하게 상대 경로만 정의
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Article routes
  ARTICLES: '/articles',
  ARTICLE_DETAIL: '/article/:slug',
  EDITOR: '/editor',
  EDITOR_EDIT: '/editor/:slug',
  
  // User routes
  PROFILE: '/profile/:username',
  SETTINGS: '/settings',
} as const;

/**
 * 동적 라우트 경로 생성 헬퍼 함수들
 */
export const createRoutes = {
  articleDetail: (slug: string) => `/article/${slug}`,
  editorEdit: (slug: string) => `/editor/${slug}`,
  profile: (username: string) => `/profile/${username}`,
} as const;

/**
 * 라우트 경로 타입 정의
 */
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
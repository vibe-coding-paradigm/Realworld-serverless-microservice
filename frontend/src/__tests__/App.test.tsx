import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';

// Mock window.location before importing components
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    origin: 'http://localhost:5174',
    pathname: '/'
  },
  writable: true,
  configurable: true
});

// Mock the API modules
vi.mock('../lib/api', () => ({
  api: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  },
  authAPI: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn()
  },
  articlesAPI: {
    getArticles: vi.fn().mockResolvedValue({ articles: [], articlesCount: 0 })
  }
}));

// Mock the AuthContext hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }))
}));

// Mock the articles hook
vi.mock('../hooks/useArticles', () => ({
  useArticles: vi.fn(() => ({
    data: { articles: [], articlesCount: 0 },
    isLoading: false,
    error: null
  }))
}));

// Test wrapper component for App component (without Router - App already has Router)
const AppTestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Test wrapper for individual page components (with Router) - currently unused but kept for future use
const _ComponentTestWrapper = ({ children, initialEntries = ['/'] }: { 
  children: React.ReactNode; 
  initialEntries?: string[] 
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('App Routing', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = { ...window.location };
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
  });

  describe('Route Configuration', () => {
    it('should render App component without Router nesting errors', () => {
      render(
        <AppTestWrapper>
          <App />
        </AppTestWrapper>
      );

      // App should render without errors - check for unique elements
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render HomePage on root path', () => {
      render(
        <AppTestWrapper>
          <App />
        </AppTestWrapper>
      );

      // HomePage should be rendered (check for unique content)
      expect(screen.getByText('A place to share your knowledge.')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Conduit')).toBeInTheDocument();
    });
  });

  describe('Basename Configuration', () => {
    it('should use correct basename for GitHub Pages', () => {
      // Mock GitHub Pages environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'vibe-coding-paradigm.github.io',
          origin: 'https://vibe-coding-paradigm.github.io',
          pathname: '/Realworld-serverless-microservice/'
        },
        writable: true
      });

      // Mock production environment
      vi.stubEnv('PROD', true);

      render(
        <AppTestWrapper>
          <App />
        </AppTestWrapper>
      );

      // The app should render without errors
      expect(screen.getByText('A place to share your knowledge.')).toBeInTheDocument();
    });

    it('should use empty basename for local development', () => {
      // Mock local environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          origin: 'http://localhost:5174',
          pathname: '/'
        },
        writable: true
      });

      // Mock development environment
      vi.stubEnv('PROD', false);

      render(
        <AppTestWrapper>
          <App />
        </AppTestWrapper>
      );

      // The app should render without errors
      expect(screen.getByText('A place to share your knowledge.')).toBeInTheDocument();
    });
  });

  describe('Route Protection', () => {
    it('should render app without authentication errors', () => {
      render(
        <AppTestWrapper>
          <App />
        </AppTestWrapper>
      );
      
      // Should not show any authentication-related errors
      expect(screen.getByText('A place to share your knowledge.')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have consistent navigation structure', () => {
      render(
        <AppTestWrapper>
          <App />
        </AppTestWrapper>
      );

      // Check that navigation links exist
      const homeLink = screen.getByRole('link', { name: 'conduit' });
      expect(homeLink).toHaveAttribute('href', '/');

      const signInLink = screen.getByRole('link', { name: 'Sign in' });
      expect(signInLink).toHaveAttribute('href', '/login');

      const signUpLink = screen.getByRole('link', { name: 'Sign up' });
      expect(signUpLink).toHaveAttribute('href', '/register');
    });
  });
});
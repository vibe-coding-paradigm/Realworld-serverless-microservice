import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import Header from '../layout/Header';
import { AuthProvider } from '../../contexts/AuthContext';
import { ROUTES } from '../../lib/routes';

// Mock the useAuth hook - use absolute import like in the actual file
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Guest Navigation', () => {
    beforeEach(async () => {
      const { useAuth } = await import('../../hooks/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout
      });
    });

    it('should render guest navigation links', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Check for logo link
      const logoLink = screen.getByRole('link', { name: 'conduit' });
      expect(logoLink).toHaveAttribute('href', ROUTES.HOME);

      // Check for navigation links
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveAttribute('href', ROUTES.HOME);

      const signInLink = screen.getByRole('link', { name: 'Sign in' });
      expect(signInLink).toHaveAttribute('href', ROUTES.LOGIN);

      const signUpLink = screen.getByRole('link', { name: 'Sign up' });
      expect(signUpLink).toHaveAttribute('href', ROUTES.REGISTER);
    });

    it('should not show authenticated user elements', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Should not show "New Article" link
      expect(screen.queryByText('New Article')).not.toBeInTheDocument();
      
      // Should not show "Sign out" button
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User Navigation', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg'
    };

    beforeEach(async () => {
      const { useAuth } = await import('../../hooks/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout
      });
    });

    it('should render authenticated user navigation', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Check for logo and home links
      expect(screen.getByRole('link', { name: 'conduit' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();

      // Check for "New Article" link
      const newArticleLink = screen.getByRole('link', { name: /New Article/ });
      expect(newArticleLink).toHaveAttribute('href', ROUTES.EDITOR);

      // Check for username display
      expect(screen.getByText(mockUser.username)).toBeInTheDocument();

      // Check for sign out button
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    });

    it('should not show guest navigation links', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Should not show "Sign in" or "Sign up" links
      expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign up')).not.toBeInTheDocument();
    });

    it('should display user avatar when available', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const avatarImage = screen.getByAltText(mockUser.username);
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', mockUser.image);
    });

    it('should handle logout correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const signOutButton = screen.getByRole('button', { name: 'Sign out' });
      await user.click(signOutButton);

      expect(mockLogout).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.HOME);
    });
  });

  describe('Route Constants Usage', () => {
    beforeEach(async () => {
      const { useAuth } = await import('../../hooks/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout
      });
    });

    it('should use ROUTES constants for all navigation links', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verify all links use route constants
      const logoLink = screen.getByRole('link', { name: 'conduit' });
      expect(logoLink.getAttribute('href')).toBe(ROUTES.HOME);

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink.getAttribute('href')).toBe(ROUTES.HOME);

      const signInLink = screen.getByRole('link', { name: 'Sign in' });
      expect(signInLink.getAttribute('href')).toBe(ROUTES.LOGIN);

      const signUpLink = screen.getByRole('link', { name: 'Sign up' });
      expect(signUpLink.getAttribute('href')).toBe(ROUTES.REGISTER);
    });
  });
});
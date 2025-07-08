import React, { useEffect, useState, type ReactNode } from 'react';
import { type User, type AuthContextType, type LoginCredentials, type RegisterCredentials } from '@/types';
import { authAPI } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-handler';
import { AuthContext } from './auth-context';

export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          // Verify token is still valid
          try {
            const response = await authAPI.getCurrentUser();
            setUser(response.user);
          } catch {
            // Token is invalid, clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(credentials.email, credentials.password);
      const { user: userData } = response;

      // Store token and user data
      if (userData.token) {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      
      return response;
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, 'Login failed. Please check your credentials.');
      setError(errorMessage);
      throw error; // Re-throw original error for proper handling
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(
        credentials.username,
        credentials.email,
        credentials.password
      );
      const { user: userData } = response;

      // Store token and user data
      if (userData.token) {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      
      return response;
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, 'Registration failed. Please try again.');
      setError(errorMessage);
      throw error; // Re-throw original error for proper handling
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
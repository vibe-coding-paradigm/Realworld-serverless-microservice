import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MockAdapter from 'axios-mock-adapter'
import { AuthProvider } from '../AuthContext'
import { AuthContext } from '../auth-context'
import { api } from '@/lib/api'
import { useContext } from 'react'

describe('AuthContext', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(api)
    localStorage.clear()
  })

  afterEach(() => {
    mock.restore()
  })

  const TestComponent = () => {
    const auth = useContext(AuthContext)
    if (!auth) return <div>No Auth Context</div>

    const { user, login, register, logout, loading, error } = auth

    const handleLogin = async () => {
      try {
        await login({ email: 'test@example.com', password: 'password123' })
      } catch {
        // Error is handled by the context
      }
    }

    const handleRegister = async () => {
      try {
        await register({ username: 'testuser', email: 'test@example.com', password: 'password123' })
      } catch {
        // Error is handled by the context
      }
    }

    return (
      <div>
        <div data-testid="user">{user ? user.username : 'No user'}</div>
        <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
        <div data-testid="error">{error || 'No error'}</div>
        <button data-testid="login" onClick={handleLogin}>
          Login
        </button>
        <button data-testid="register" onClick={handleRegister}>
          Register
        </button>
        <button data-testid="logout" onClick={() => logout()}>
          Logout
        </button>
      </div>
    )
  }

  const renderWithProvider = () => {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
  }

  describe('Initial State', () => {
    it('should initialize with no user and not loading', async () => {
      mock.onGet('/user').reply(401)
      
      renderWithProvider()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
        expect(screen.getByTestId('error')).toHaveTextContent('No error')
      })
    })

    it('should restore user from localStorage if token exists', async () => {
      const savedUser = { id: '1', username: 'testuser', email: 'test@example.com' }
      localStorage.setItem('token', 'valid-token')
      localStorage.setItem('user', JSON.stringify(savedUser))

      mock.onGet('/user').reply(200, { user: savedUser })

      renderWithProvider()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser')
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })
    })

    it('should clear invalid token from localStorage', async () => {
      localStorage.setItem('token', 'invalid-token')
      localStorage.setItem('user', JSON.stringify({ username: 'testuser' }))

      mock.onGet('/user').reply(401)

      renderWithProvider()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('user')).toBeNull()
      })
    })
  })

  describe('Login', () => {
    it('should login successfully and store user data', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', token: 'jwt-token' }
      mock.onPost('/users/login').reply(200, { user })

      renderWithProvider()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      const loginButton = screen.getByTestId('login')
      await userEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser')
        expect(localStorage.getItem('token')).toBe('jwt-token')
        expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject({
          username: 'testuser',
          email: 'test@example.com'
        })
      })
    })

    it('should handle login failure with error message', async () => {
      mock.onPost('/users/login').reply(422, {
        errors: { email: ['Invalid email or password'] }
      })

      renderWithProvider()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      const loginButton = screen.getByTestId('login')
      await userEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid email or password')
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })
    })
  })

  describe('Register', () => {
    it('should register successfully and store user data', async () => {
      const user = { id: '1', username: 'newuser', email: 'new@example.com', token: 'jwt-token' }
      mock.onPost('/users').reply(201, { user })

      renderWithProvider()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      const registerButton = screen.getByTestId('register')
      await userEvent.click(registerButton)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('newuser')
        expect(localStorage.getItem('token')).toBe('jwt-token')
      })
    })

    it('should handle registration failure with error message', async () => {
      mock.onPost('/users').reply(422, {
        errors: { username: ['Username already taken'] }
      })

      renderWithProvider()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      const registerButton = screen.getByTestId('register')
      await userEvent.click(registerButton)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Username already taken')
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })
    })
  })

  describe('Logout', () => {
    it('should logout and clear user data', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', token: 'jwt-token' }
      
      // Setup initial logged in state
      localStorage.setItem('token', 'jwt-token')
      localStorage.setItem('user', JSON.stringify(user))
      mock.onGet('/user').reply(200, { user })

      renderWithProvider()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser')
      })

      const logoutButton = screen.getByTestId('logout')
      await userEvent.click(logoutButton)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
        expect(screen.getByTestId('error')).toHaveTextContent('No error')
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('user')).toBeNull()
      })
    })
  })
})
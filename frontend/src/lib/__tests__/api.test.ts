import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { api, authAPI } from '../api'

describe('API Client', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(api)
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token')
      
      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer test-token')
        return [200, { success: true }]
      })

      await api.get('/test')
    })

    it('should not add Authorization header when token does not exist', async () => {
      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined()
        return [200, { success: true }]
      })

      await api.get('/test')
    })
  })

  describe('Response Interceptor', () => {
    it('should handle 401 responses by clearing localStorage', async () => {
      localStorage.setItem('token', 'expired-token')
      localStorage.setItem('user', '{"id": "1", "username": "test"}')
      
      // Mock window.location.href without actual navigation
      const locationSetter = vi.fn()
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          set href(url: string) {
            locationSetter(url)
          },
          get href() {
            return 'http://localhost:3000'
          }
        },
        writable: true
      })

      mock.onGet('/test').reply(401, { message: 'Unauthorized' })

      try {
        await api.get('/test')
      } catch {
        // Expected to fail
      }

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(locationSetter).toHaveBeenCalledWith('/login')
    })
  })
})

describe('Auth API', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(api)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('login', () => {
    it('should make POST request to /users/login with correct payload', async () => {
      const expectedResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          token: 'jwt-token'
        }
      }

      mock.onPost('/users/login').reply((config) => {
        const data = JSON.parse(config.data)
        expect(data).toEqual({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        })
        return [200, expectedResponse]
      })

      const result = await authAPI.login('test@example.com', 'password123')
      expect(result).toEqual(expectedResponse)
    })

    it('should handle login failure', async () => {
      mock.onPost('/users/login').reply(422, {
        errors: {
          email: ['Invalid email or password']
        }
      })

      await expect(
        authAPI.login('invalid@example.com', 'wrong-password')
      ).rejects.toThrow()
    })
  })

  describe('register', () => {
    it('should make POST request to /users with correct payload', async () => {
      const expectedResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          token: 'jwt-token'
        }
      }

      mock.onPost('/users').reply((config) => {
        const data = JSON.parse(config.data)
        expect(data).toEqual({
          user: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
          }
        })
        return [201, expectedResponse]
      })

      const result = await authAPI.register('testuser', 'test@example.com', 'password123')
      expect(result).toEqual(expectedResponse)
    })

    it('should handle registration failure', async () => {
      mock.onPost('/users').reply(422, {
        errors: {
          email: ['Email already taken'],
          username: ['Username already taken']
        }
      })

      await expect(
        authAPI.register('existinguser', 'existing@example.com', 'password123')
      ).rejects.toThrow()
    })
  })

  describe('getCurrentUser', () => {
    it('should make GET request to /user', async () => {
      const expectedResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser'
        }
      }

      mock.onGet('/user').reply(200, expectedResponse)

      const result = await authAPI.getCurrentUser()
      expect(result).toEqual(expectedResponse)
    })

    it('should handle unauthorized request', async () => {
      mock.onGet('/user').reply(401, { message: 'Unauthorized' })

      await expect(authAPI.getCurrentUser()).rejects.toThrow()
    })
  })
})
import { describe, it, expect } from 'vitest'
import { extractErrorMessage } from '../error-handler'

describe('extractErrorMessage', () => {
  it('should extract error message from API error with errors field', () => {
    const error = {
      response: {
        data: {
          errors: {
            email: ['Email is required'],
            password: ['Password is too short']
          }
        }
      }
    }

    const result = extractErrorMessage(error, 'Default message')
    expect(result).toBe('Email is required')
  })

  it('should extract error message from API error with message field', () => {
    const error = {
      response: {
        data: {
          message: 'Invalid credentials'
        }
      }
    }

    const result = extractErrorMessage(error, 'Default message')
    expect(result).toBe('Invalid credentials')
  })

  it('should prefer errors field over message field', () => {
    const error = {
      response: {
        data: {
          errors: {
            username: ['Username already taken']
          },
          message: 'Validation failed'
        }
      }
    }

    const result = extractErrorMessage(error, 'Default message')
    expect(result).toBe('Username already taken')
  })

  it('should extract message from Error instance', () => {
    const error = new Error('Network error')
    
    const result = extractErrorMessage(error, 'Default message')
    expect(result).toBe('Network error')
  })

  it('should return default message for unknown error types', () => {
    const error = 'string error'
    
    const result = extractErrorMessage(error, 'Default message')
    expect(result).toBe('Default message')
  })

  it('should return default message for null error', () => {
    const result = extractErrorMessage(null, 'Default message')
    expect(result).toBe('Default message')
  })

  it('should return default message for undefined error', () => {
    const result = extractErrorMessage(undefined, 'Default message')
    expect(result).toBe('Default message')
  })

  it('should handle API error without data', () => {
    const error = {
      response: {}
    }
    
    const result = extractErrorMessage(error, 'Default message')
    expect(result).toBe('Default message')
  })

  it('should handle API error with empty errors object', () => {
    const error = {
      response: {
        data: {
          errors: {}
        }
      }
    }
    
    const result = extractErrorMessage(error, 'Default message')
    expect(result).toBe('Default message')
  })
})
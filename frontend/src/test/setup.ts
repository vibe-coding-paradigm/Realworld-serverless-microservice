import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.location globally to prevent jsdom navigation errors
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { mockClient } from '@supabase/supabase-js';

// Mock crypto for UUID generation
global.crypto = {
  randomUUID: () => 'test-uuid',
  subtle: {} as any,
  getRandomValues: () => new Uint8Array(10),
} as Crypto;

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockClient,
}));

// Mock monitoring service
jest.mock('@/lib/monitoring', () => ({
  monitoring: {
    captureException: jest.fn(),
    setTag: jest.fn(),
    startPerformanceTransaction: jest.fn(() => ({
      finish: jest.fn(),
    })),
  },
}));

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_SENTRY_DSN = 'test-dsn';
process.env.VITE_LOGROCKET_APP_ID = 'test/app';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return [] }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000); 
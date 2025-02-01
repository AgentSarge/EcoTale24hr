import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock crypto
const mockCrypto = {
  randomUUID: () => 'test-uuid',
  subtle: {},
  getRandomValues: () => new Uint8Array(10),
} as unknown as Crypto;

global.crypto = mockCrypto;

// Mock monitoring service
vi.mock('@/lib/monitoring', () => ({
  monitoring: {
    captureException: vi.fn(),
    setTag: vi.fn(),
    startPerformanceTransaction: vi.fn(() => ({
      finish: vi.fn(),
    })),
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock performance observer
const mockPerformanceObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: () => [],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PerformanceObserverMock = function(_callback: PerformanceObserverCallback) {
  return mockPerformanceObserver;
} as unknown as {
  new (callback: PerformanceObserverCallback): PerformanceObserver;
  supportedEntryTypes: string[];
};

PerformanceObserverMock.supportedEntryTypes = [
  'element',
  'event',
  'first-input',
  'largest-contentful-paint',
  'layout-shift',
  'longtask',
  'mark',
  'measure',
  'navigation',
  'paint',
  'resource',
];

global.PerformanceObserver = PerformanceObserverMock;

// Mock intersection observer
const mockIntersectionObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const IntersectionObserverMock = function(_callback: IntersectionObserverCallback) {
  return mockIntersectionObserver;
} as unknown as {
  new (callback: IntersectionObserverCallback, options?: IntersectionObserverInit): IntersectionObserver;
};

global.IntersectionObserver = IntersectionObserverMock;

// Mock resize observer
const mockResizeObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ResizeObserverMock = function(_callback: ResizeObserverCallback) {
  return mockResizeObserver;
} as unknown as {
  new (callback: ResizeObserverCallback): ResizeObserver;
};

global.ResizeObserver = ResizeObserverMock;

// Mock match media
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Set default timeout
vi.setConfig({ testTimeout: 10000 }); 
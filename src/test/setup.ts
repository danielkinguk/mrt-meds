import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock toast functions
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockShowInfo = vi.fn();
const mockShowWarning = vi.fn();

// Mock ToastContext
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showInfo: mockShowInfo,
    showWarning: mockShowWarning,
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock error handler
vi.mock('../utils/errorHandler', () => ({
  getErrorMessage: (error: any) => error?.message || 'Unknown error',
  logError: vi.fn(),
}));

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Clean up mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Export mock functions for use in tests
export const mockToast = {
  showSuccess: mockShowSuccess,
  showError: mockShowError,
  showInfo: mockShowInfo,
  showWarning: mockShowWarning,
};
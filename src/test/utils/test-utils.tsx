import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock toast functions
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockShowInfo = vi.fn();
const mockShowWarning = vi.fn();

// Mock the entire ToastContext module
vi.mock('../../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showInfo: mockShowInfo,
    showWarning: mockShowWarning,
  }),
}));

// Custom render function (without providers since we're mocking them)
const customRender = (
  ui: ReactElement,
  options?: RenderOptions
) => render(ui, options);

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Export mock functions for testing
export const mockToast = {
  showSuccess: mockShowSuccess,
  showError: mockShowError,
  showInfo: mockShowInfo,
  showWarning: mockShowWarning,
};

// Test helper to wait for async operations
export const waitForAsyncOperations = () => 
  new Promise(resolve => setTimeout(resolve, 0));
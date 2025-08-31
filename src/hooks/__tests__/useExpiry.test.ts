import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExpiry } from '../useExpiry';
import { mockToast } from '../../test/setup';

// Mock the database services
const mockGetExpiringMedicines = vi.fn();
const mockGetStockLevels = vi.fn();

vi.mock('../../services/db/medicines', () => ({
  getExpiringMedicines: mockGetExpiringMedicines,
  getStockLevels: mockGetStockLevels,
}));

describe('useExpiry Hook', () => {
  const mockExpiringData = [
    {
      medicine: {
        id: 'med-1',
        name: 'Paracetamol',
        strength: '500mg',
        form: 'tablet',
        route: 'oral',
        category: 'analgesic',
        isControlled: false,
        minStock: 10,
        maxStock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      batch: {
        id: 'batch-1',
        medicineId: 'med-1',
        lotNumber: 'LOT001',
        expiryDate: new Date('2025-06-01'),
        quantity: 50,
        receivedDate: new Date(),
        supplierId: 'supplier-1',
        cost: 25.00,
      },
      items: [],
      expiryStatus: {
        status: 'warning' as const,
        daysUntilExpiry: 45,
        expiryDate: new Date('2025-06-01'),
      },
    },
  ];

  const mockStockLevels = [
    {
      medicineId: 'med-1',
      medicineName: 'Paracetamol',
      currentStock: 5,
      minStock: 10,
      maxStock: 100,
      status: 'low' as const,
      percentage: 50,
    },
    {
      medicineId: 'med-2',
      medicineName: 'Morphine',
      currentStock: 2,
      minStock: 5,
      maxStock: 20,
      status: 'critical' as const,
      percentage: 10,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetExpiringMedicines.mockResolvedValue(mockExpiringData);
    mockGetStockLevels.mockResolvedValue(mockStockLevels);
  });

  describe('Initial State and Loading', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useExpiry());

      expect(result.current.loading).toBe(true);
      expect(result.current.expiringMedicines).toEqual([]);
      expect(result.current.stockLevels).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should load expiry data on mount', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.expiringMedicines).toHaveLength(1);
      expect(result.current.stockLevels).toHaveLength(2);
    });

    it('should use custom days threshold', async () => {
      const { result } = renderHook(() => useExpiry(30));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetExpiringMedicines).toHaveBeenCalledWith(30);
    });
  });

  describe('Expiry Status Calculations', () => {
    it('should calculate expired status', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const expiredDate = new Date('2023-01-01');
      const status = result.current.getExpiryStatus(expiredDate);

      expect(status.status).toBe('expired');
      expect(status.daysUntilExpiry).toBeLessThan(0);
      expect(status.color).toBe('text-red-800 bg-red-100');
      expect(status.message).toContain('Expired');
    });

    it('should calculate critical status (≤30 days)', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const criticalDate = new Date();
      criticalDate.setDate(criticalDate.getDate() + 15); // 15 days from now

      const status = result.current.getExpiryStatus(criticalDate);

      expect(status.status).toBe('critical');
      expect(status.daysUntilExpiry).toBeLessThanOrEqual(30);
      expect(status.color).toBe('text-red-600 bg-red-50');
      expect(status.message).toContain('Expires in');
    });

    it('should calculate warning status (31-60 days)', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 45); // 45 days from now

      const status = result.current.getExpiryStatus(warningDate);

      expect(status.status).toBe('warning');
      expect(status.daysUntilExpiry).toBeGreaterThan(30);
      expect(status.daysUntilExpiry).toBeLessThanOrEqual(60);
      expect(status.color).toBe('text-yellow-600 bg-yellow-50');
    });

    it('should calculate good status (>60 days)', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goodDate = new Date();
      goodDate.setDate(goodDate.getDate() + 90); // 90 days from now

      const status = result.current.getExpiryStatus(goodDate);

      expect(status.status).toBe('good');
      expect(status.daysUntilExpiry).toBeGreaterThan(60);
      expect(status.color).toBe('text-green-600 bg-green-50');
    });

    it('should handle undefined expiry date', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const status = result.current.getExpiryStatus(undefined);

      expect(status.status).toBe('good');
      expect(status.daysUntilExpiry).toBe(Infinity);
      expect(status.message).toBe('No expiry date');
    });
  });

  describe('Status Color Mapping', () => {
    it('should return correct colors for each status', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getStatusColor('expired')).toBe('text-red-800 bg-red-100');
      expect(result.current.getStatusColor('Expired')).toBe('text-red-800 bg-red-100');
      expect(result.current.getStatusColor('critical')).toBe('text-red-600 bg-red-50');
      expect(result.current.getStatusColor('Out of Stock')).toBe('text-red-600 bg-red-50');
      expect(result.current.getStatusColor('low')).toBe('text-orange-600 bg-orange-50');
      expect(result.current.getStatusColor('Low Stock')).toBe('text-orange-600 bg-orange-50');
      expect(result.current.getStatusColor('warning')).toBe('text-yellow-600 bg-yellow-50');
      expect(result.current.getStatusColor('Warning')).toBe('text-yellow-600 bg-yellow-50');
      expect(result.current.getStatusColor('good')).toBe('text-green-600 bg-green-50');
      expect(result.current.getStatusColor('Good')).toBe('text-green-600 bg-green-50');
      expect(result.current.getStatusColor('unknown')).toBe('text-gray-600 bg-gray-50');
    });
  });

  describe('Count Calculations', () => {
    it('should calculate expired count correctly', async () => {
      mockGetExpiringMedicines.mockResolvedValue([
        {
          ...mockExpiringData[0],
          expiryStatus: { ...mockExpiringData[0].expiryStatus, status: 'expired' },
        },
        mockExpiringData[0],
      ]);

      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.expiredCount).toBe(1);
      expect(result.current.expiringCount).toBe(1); // Only warning/critical, not expired
    });

    it('should calculate stock level counts correctly', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lowStockCount).toBe(1);
      expect(result.current.criticalStockCount).toBe(1);
    });
  });

  describe('Data Refresh', () => {
    it('should refresh expiry data manually', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.refreshExpiry();
      });

      expect(mockGetExpiringMedicines).toHaveBeenCalledWith(60);
      expect(mockGetStockLevels).toHaveBeenCalled();
    });

    it('should handle refresh error', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Refresh failed');
      mockGetExpiringMedicines.mockRejectedValueOnce(error);

      await act(async () => {
        await result.current.refreshExpiry();
      });

      expect(result.current.error).toBe('Refresh failed');
      expect(mockToast.showError).toHaveBeenCalledWith(
        'Failed to load expiry data',
        'Refresh failed'
      );
    });
  });

  describe('Data Transformation', () => {
    it('should transform expiring medicines data correctly', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const transformedMedicine = result.current.expiringMedicines[0];

      expect(transformedMedicine).toMatchObject({
        id: 'med-1',
        name: 'Paracetamol',
        expiryStatus: {
          status: 'warning',
          daysUntilExpiry: 45,
          color: expect.any(String),
          message: expect.stringContaining('Expires in'),
        },
        nearestExpiryDate: new Date('2025-06-01'),
        batchCount: 1,
      });
    });

    it('should transform "ok" status to "good"', async () => {
      mockGetExpiringMedicines.mockResolvedValue([
        {
          ...mockExpiringData[0],
          expiryStatus: { ...mockExpiringData[0].expiryStatus, status: 'ok' },
        },
      ]);

      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.expiringMedicines[0].expiryStatus.status).toBe('good');
    });
  });

  describe('Loading States', () => {
    it('should set loading state during refresh', async () => {
      const { result } = renderHook(() => useExpiry());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock a slow operation
      mockGetExpiringMedicines.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockExpiringData), 100))
      );

      act(() => {
        result.current.refreshExpiry();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 200 });
    });
  });
});
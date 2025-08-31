import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDatabase } from '../useDatabase';
import { mockDb, mockBatches } from '../../test/mocks/database';
import { mockToast } from '../../test/setup';

// Mock the modules
vi.mock('../../services/db/database');
vi.mock('../../services/db/seedData');

describe('useDatabase Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State and Connection', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useDatabase());

      expect(result.current.loading).toBe(true);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should check database connection on mount', async () => {
      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);
      expect(mockDb.medicines.count).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const error = new Error('Connection failed');
      mockDb.medicines.count.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe('Connection failed');
    });
  });

  describe('Database Statistics', () => {
    it('should calculate database statistics correctly', async () => {
      // Mock database counts
      mockDb.medicines.count.mockResolvedValue(2);
      mockDb.batches.count.mockResolvedValue(2);
      mockDb.batches.toArray.mockResolvedValue(mockBatches);
      mockDb.locations.count.mockResolvedValue(2);
      mockDb.movements.count.mockResolvedValue(5);

      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        totalMedicines: 2,
        totalItems: 60, // Sum of batch quantities (50 + 10)
        totalBatches: 2,
        totalLocations: 2,
        totalMovements: 5,
      });
    });

    it('should handle statistics calculation error', async () => {
      mockDb.medicines.count.mockResolvedValue(2);
      mockDb.batches.count.mockRejectedValueOnce(new Error('Stats error'));

      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Stats error');
    });
  });

  describe('Connection Management', () => {
    it('should check connection successfully', async () => {
      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let connectionResult;
      await act(async () => {
        connectionResult = await result.current.checkConnection();
      });

      expect(connectionResult).toBe(true);
      expect(result.current.isConnected).toBe(true);
    });

    it('should handle connection check failure', async () => {
      const { result } = renderHook(() => useDatabase());
      mockDb.medicines.count.mockRejectedValueOnce(new Error('Connection lost'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let connectionResult;
      await act(async () => {
        connectionResult = await result.current.checkConnection();
      });

      expect(connectionResult).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Database Reset', () => {
    it('should reset database successfully', async () => {
      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.resetData();
      });

      expect(mockToast.showSuccess).toHaveBeenCalledWith(
        'Database reset',
        'All data has been cleared and reseeded with default values'
      );
    });

    it('should handle reset failure', async () => {
      const { result } = renderHook(() => useDatabase());
      const { resetAndSeed } = await import('../../services/db/seedData');
      vi.mocked(resetAndSeed).mockRejectedValueOnce(new Error('Reset failed'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.resetData()).rejects.toThrow('Reset failed');
      });

      expect(mockToast.showError).toHaveBeenCalledWith(
        'Reset failed',
        'Reset failed'
      );
    });

    it('should refresh stats after successful reset', async () => {
      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalStats = result.current.stats;

      await act(async () => {
        await result.current.resetData();
      });

      // Stats should be refreshed after reset
      expect(mockDb.medicines.count).toHaveBeenCalledTimes(3); // Initial + after reset + stats refresh
    });
  });

  describe('Statistics Refresh', () => {
    it('should allow manual statistics refresh', async () => {
      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      vi.clearAllMocks();

      let statsResult;
      await act(async () => {
        statsResult = await result.current.getDatabaseStats();
      });

      expect(mockDb.medicines.count).toHaveBeenCalled();
      expect(mockDb.batches.count).toHaveBeenCalled();
      expect(mockDb.locations.count).toHaveBeenCalled();
      expect(mockDb.movements.count).toHaveBeenCalled();
      expect(statsResult).toBeDefined();
    });

    it('should handle statistics refresh error', async () => {
      const { result } = renderHook(() => useDatabase());
      mockDb.medicines.count.mockRejectedValueOnce(new Error('Stats refresh failed'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.getDatabaseStats()).rejects.toThrow('Stats refresh failed');
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading state during reset operation', async () => {
      const { result } = renderHook(() => useDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start reset operation
      act(() => {
        result.current.resetData();
      });

      // Should be loading during operation
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle loading state correctly on initialization', async () => {
      const { result } = renderHook(() => useDatabase());

      // Initially should be loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // After initialization, should not be loading
      expect(result.current.loading).toBe(false);
    });
  });
});
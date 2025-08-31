import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMedicines } from '../useMedicines';
import { mockDb, mockMedicines, mockBatches } from '../../test/mocks/database';
import { mockToast } from '../../test/setup';
import type { Medicine } from '../../types';

// Mock the database
vi.mock('../../services/db/database');

describe('useMedicines Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockDb.batches.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockBatches.filter(b => b.medicineId === 'med-1')),
      }),
    });
  });

  describe('Initial State and Loading', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useMedicines());

      expect(result.current.loading).toBe(true);
      expect(result.current.medicines).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should load medicines on mount', async () => {
      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.medicines).toHaveLength(2);
      expect(result.current.medicines[0]).toMatchObject({
        id: 'med-1',
        name: 'Paracetamol',
        currentStock: 50,
        unit: 'units',
      });
    });

    it('should handle loading error', async () => {
      const error = new Error('Database connection failed');
      mockDb.medicines.toArray.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Database connection failed');
      expect(mockToast.showError).toHaveBeenCalledWith(
        'Failed to load medicines',
        'Database connection failed'
      );
    });
  });

  describe('Medicine Management', () => {
    it('should add a new medicine', async () => {
      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newMedicine: Omit<Medicine, 'id'> = {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        strength: '400mg',
        form: 'tablet',
        route: 'oral',
        category: 'analgesic',
        isControlled: false,
        minStock: 20,
        maxStock: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await act(async () => {
        await result.current.addMedicine(newMedicine);
      });

      expect(mockDb.medicines.add).toHaveBeenCalledWith({
        ...newMedicine,
        id: expect.stringMatching(/^med-\d+$/),
      });
      expect(mockToast.showSuccess).toHaveBeenCalledWith(
        'Medicine added successfully',
        'Ibuprofen has been added to inventory'
      );
    });

    it('should handle add medicine error', async () => {
      const { result } = renderHook(() => useMedicines());
      const error = new Error('Add failed');
      mockDb.medicines.add.mockRejectedValueOnce(error);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newMedicine: Omit<Medicine, 'id'> = {
        name: 'Test Medicine',
        strength: '100mg',
        form: 'tablet',
        route: 'oral',
        category: 'analgesic',
        isControlled: false,
        minStock: 10,
        maxStock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await act(async () => {
        await expect(result.current.addMedicine(newMedicine)).rejects.toThrow('Add failed');
      });

      expect(mockToast.showError).toHaveBeenCalledWith(
        'Failed to add medicine',
        'Add failed'
      );
    });

    it('should update an existing medicine', async () => {
      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedMedicine: Medicine = {
        ...mockMedicines[0],
        name: 'Updated Paracetamol',
        minStock: 15,
      };

      await act(async () => {
        await result.current.updateMedicine(updatedMedicine);
      });

      expect(mockDb.medicines.update).toHaveBeenCalledWith(
        updatedMedicine.id,
        updatedMedicine
      );
      expect(mockToast.showSuccess).toHaveBeenCalledWith(
        'Medicine updated successfully',
        'Updated Paracetamol has been updated'
      );
    });

    it('should update medicine with expiration date and update batches', async () => {
      const { result } = renderHook(() => useMedicines());

      // Mock batches query for specific medicine
      const medicineId = 'med-1';
      const mockMedicineBatches = [{ id: 'batch-1', medicineId }];
      
      mockDb.batches.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockMedicineBatches),
        }),
      });

      mockDb.batches.update = vi.fn().mockResolvedValue(1);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedMedicine: Medicine = {
        ...mockMedicines[0],
        expirationDate: new Date('2026-12-31'),
      };

      await act(async () => {
        await result.current.updateMedicine(updatedMedicine);
      });

      expect(mockDb.batches.update).toHaveBeenCalledWith(
        'batch-1',
        { expiryDate: new Date('2026-12-31') }
      );
      expect(mockToast.showInfo).toHaveBeenCalledWith(
        'Updated 1 batch(es) with new expiration date'
      );
    });

    it('should delete a medicine and related records', async () => {
      const { result } = renderHook(() => useMedicines());

      // Setup mock responses for related data
      mockDb.batches.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([{ id: 'batch-1' }]),
          delete: vi.fn().mockResolvedValue(1),
        }),
      });

      mockDb.items.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([{ id: 'item-1' }]),
          delete: vi.fn().mockResolvedValue(1),
        }),
      });

      mockDb.movements.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([{ id: 'movement-1' }]),
          delete: vi.fn().mockResolvedValue(1),
        }),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteMedicine('med-1');
      });

      expect(mockDb.medicines.delete).toHaveBeenCalledWith('med-1');
      expect(mockToast.showSuccess).toHaveBeenCalledWith(
        'Medicine deleted successfully',
        'Paracetamol and 2 related records removed'
      );
    });
  });

  describe('Status Calculations', () => {
    it('should calculate expired status for medicines', async () => {
      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const expiredMedicine = {
        ...mockMedicines[0],
        nearestExpiry: new Date('2023-01-01'), // Past date
        currentStock: 50,
        minStock: 10,
      };

      const status = result.current.getOverallStatus(expiredMedicine);
      expect(status).toBe('Expired');
    });

    it('should calculate out of stock status', async () => {
      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const outOfStockMedicine = {
        ...mockMedicines[0],
        currentStock: 0,
        minStock: 10,
      };

      const status = result.current.getOverallStatus(outOfStockMedicine);
      expect(status).toBe('Out of Stock');
    });

    it('should calculate low stock status', async () => {
      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const lowStockMedicine = {
        ...mockMedicines[0],
        currentStock: 5,
        minStock: 10,
      };

      const status = result.current.getOverallStatus(lowStockMedicine);
      expect(status).toBe('Low Stock');
    });

    it('should calculate warning status', async () => {
      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const warningMedicine = {
        ...mockMedicines[0],
        currentStock: 12,
        minStock: 10,
      };

      const status = result.current.getOverallStatus(warningMedicine);
      expect(status).toBe('Warning');
    });

    it('should calculate good status', async () => {
      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goodMedicine = {
        ...mockMedicines[0],
        currentStock: 50,
        minStock: 10,
        nearestExpiry: new Date('2026-01-01'), // Future date
      };

      const status = result.current.getOverallStatus(goodMedicine);
      expect(status).toBe('Good');
    });
  });

  describe('Stock Calculations', () => {
    it('should calculate current stock from batches', async () => {
      mockDb.batches.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            { quantity: 25, medicineId: 'med-1' },
            { quantity: 25, medicineId: 'med-1' },
          ]),
        }),
      });

      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.medicines[0].currentStock).toBe(50);
    });

    it('should calculate nearest expiry date', async () => {
      const nearDate = new Date('2025-06-01');
      const farDate = new Date('2025-12-31');

      mockDb.batches.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            { quantity: 25, expiryDate: farDate, medicineId: 'med-1' },
            { quantity: 25, expiryDate: nearDate, medicineId: 'med-1' },
          ]),
        }),
      });

      const { result } = renderHook(() => useMedicines());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.medicines[0].nearestExpiry).toEqual(nearDate);
    });
  });
});
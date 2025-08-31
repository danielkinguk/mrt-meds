import { useState, useEffect, useCallback } from 'react';
import { Medicine } from '../types';
import { db } from '../services/db/database';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage, logError } from '../utils/errorHandler';

export interface MedicineWithStock extends Medicine {
  currentStock?: number;
  batchCount?: number;
  genericName?: string;
  unit?: string;
  nearestExpiry?: Date;
}

interface UseMedicinesReturn {
  medicines: MedicineWithStock[];
  loading: boolean;
  error: string | null;
  loadMedicines: () => Promise<void>;
  addMedicine: (medicineData: Omit<Medicine, 'id'>) => Promise<void>;
  updateMedicine: (medicineData: Medicine) => Promise<void>;
  deleteMedicine: (medicineId: string) => Promise<void>;
  getOverallStatus: (medicine: MedicineWithStock) => string;
}

export function useMedicines(): UseMedicinesReturn {
  const [medicines, setMedicines] = useState<MedicineWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError, showInfo } = useToast();

  const loadMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const meds = await db.medicines.toArray();
      
      const medsWithStock = await Promise.all(meds.map(async (med) => {
        const batches = await db.batches.where('medicineId').equals(med.id!).toArray();
        
        const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
        
        // Find the nearest expiry date
        const nearestExpiry = batches.length > 0 
          ? batches.reduce((nearest, batch) => 
              batch.expiryDate < nearest ? batch.expiryDate : nearest
            , batches[0].expiryDate)
          : undefined;
        
        return {
          ...med,
          currentStock: totalQuantity,
          batchCount: batches.length,
          unit: 'units',
          nearestExpiry
        };
      }));
      
      setMedicines(medsWithStock);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, 'useMedicines.loadMedicines');
      showError('Failed to load medicines', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addMedicine = useCallback(async (medicineData: Omit<Medicine, 'id'>) => {
    try {
      const newId = `med-${Date.now()}`;
      await db.medicines.add({ ...medicineData, id: newId });
      showSuccess('Medicine added successfully', `${medicineData.name} has been added to inventory`);
      await loadMedicines();
    } catch (err) {
      logError(err, 'useMedicines.addMedicine');
      showError('Failed to add medicine', getErrorMessage(err));
      throw err;
    }
  }, [loadMedicines, showSuccess, showError]);

  const updateMedicine = useCallback(async (medicineData: Medicine) => {
    try {
      await db.medicines.update(medicineData.id, medicineData);
      
      // If expiration date was provided, update all batches for this medicine
      if (medicineData.expirationDate) {
        const batches = await db.batches.where('medicineId').equals(medicineData.id).toArray();
        const newExpiryDate = new Date(medicineData.expirationDate);
        
        // Update each batch with the new expiration date
        await Promise.all(
          batches.map(batch => 
            db.batches.update(batch.id, { expiryDate: newExpiryDate })
          )
        );
        
        showInfo(`Updated ${batches.length} batch(es) with new expiration date`);
      }
      showSuccess('Medicine updated successfully', `${medicineData.name} has been updated`);
      await loadMedicines();
    } catch (err) {
      logError(err, 'useMedicines.updateMedicine');
      showError('Failed to update medicine', getErrorMessage(err));
      throw err;
    }
  }, [loadMedicines, showSuccess, showError, showInfo]);

  const deleteMedicine = useCallback(async (medicineId: string) => {
    try {
      // Get medicine details for the success message
      const medicine = await db.medicines.get(medicineId);
      if (!medicine) {
        throw new Error('Medicine not found');
      }

      // Get all related data
      const batches = await db.batches.where('medicineId').equals(medicineId).toArray();
      const items = await db.items.where('medicineId').equals(medicineId).toArray();
      const movements = await db.movements.where('medicineId').equals(medicineId).toArray();

      // Delete in correct order: movements -> items -> batches -> medicine
      if (movements.length > 0) {
        await db.movements.where('medicineId').equals(medicineId).delete();
      }
      
      if (items.length > 0) {
        await db.items.where('medicineId').equals(medicineId).delete();
      }
      
      if (batches.length > 0) {
        await db.batches.where('medicineId').equals(medicineId).delete();
      }
      
      // Finally delete the medicine
      await db.medicines.delete(medicineId);

      // Show success message with details
      const deletedCount = batches.length + items.length;
      showSuccess(
        'Medicine deleted successfully', 
        `${medicine.name} and ${deletedCount} related records removed`
      );
      
      await loadMedicines();
    } catch (err) {
      logError(err, 'useMedicines.deleteMedicine');
      showError('Failed to delete medicine', getErrorMessage(err));
      throw err;
    }
  }, [loadMedicines, showSuccess, showError]);

  const getOverallStatus = useCallback((medicine: MedicineWithStock): string => {
    const now = new Date();
    
    // Check both batch expiry and medicine's own expiration date
    const batchExpired = medicine.nearestExpiry && new Date(medicine.nearestExpiry) < now;
    const medicineExpired = medicine.expirationDate && new Date(medicine.expirationDate) < now;
    
    // If either the batch or the medicine itself is expired
    if (batchExpired || medicineExpired) {
      return 'Expired';
    }
    
    // Then check stock levels
    const current = medicine.currentStock || 0;
    const min = medicine.minStock;
    
    if (current === 0) return 'Out of Stock';
    if (current < min) return 'Low Stock';
    if (current < min * 1.5) return 'Warning';
    return 'Good';
  }, []);

  // Load medicines on mount
  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  return {
    medicines,
    loading,
    error,
    loadMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    getOverallStatus
  };
}
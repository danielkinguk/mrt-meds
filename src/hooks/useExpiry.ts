import { useState, useEffect, useCallback } from 'react';
import { Medicine, StockLevel } from '../types';
import { getExpiringMedicines, getStockLevels } from '../services/db/medicines';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage, logError } from '../utils/errorHandler';

export interface ExpiryStatus {
  status: 'expired' | 'critical' | 'warning' | 'good';
  daysUntilExpiry: number;
  color: string;
  message: string;
}

export interface MedicineWithExpiry extends Medicine {
  expiryStatus: ExpiryStatus;
  nearestExpiryDate?: Date;
  batchCount?: number;
}

interface UseExpiryReturn {
  expiringMedicines: MedicineWithExpiry[];
  expiredCount: number;
  expiringCount: number;
  stockLevels: StockLevel[];
  lowStockCount: number;
  criticalStockCount: number;
  loading: boolean;
  error: string | null;
  refreshExpiry: () => Promise<void>;
  getExpiryStatus: (expiryDate: Date | undefined) => ExpiryStatus;
  getStatusColor: (status: string) => string;
}

export function useExpiry(daysThreshold: number = 60): UseExpiryReturn {
  const [expiringMedicines, setExpiringMedicines] = useState<MedicineWithExpiry[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const getExpiryStatus = useCallback((expiryDate: Date | undefined): ExpiryStatus => {
    if (!expiryDate) {
      return {
        status: 'good',
        daysUntilExpiry: Infinity,
        color: 'text-gray-500',
        message: 'No expiry date'
      };
    }

    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: 'expired',
        daysUntilExpiry,
        color: 'text-red-800 bg-red-100',
        message: `Expired ${Math.abs(daysUntilExpiry)} days ago`
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'critical',
        daysUntilExpiry,
        color: 'text-red-600 bg-red-50',
        message: `Expires in ${daysUntilExpiry} days`
      };
    } else if (daysUntilExpiry <= 60) {
      return {
        status: 'warning',
        daysUntilExpiry,
        color: 'text-yellow-600 bg-yellow-50',
        message: `Expires in ${daysUntilExpiry} days`
      };
    } else {
      return {
        status: 'good',
        daysUntilExpiry,
        color: 'text-green-600 bg-green-50',
        message: `Expires in ${daysUntilExpiry} days`
      };
    }
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'Expired':
      case 'expired':
        return 'text-red-800 bg-red-100';
      case 'Out of Stock':
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'Low Stock':
      case 'low':
        return 'text-orange-600 bg-orange-50';
      case 'Warning':
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'Good':
      case 'good':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }, []);

  const refreshExpiry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get expiring medicines data
      const expiringData = await getExpiringMedicines(daysThreshold);
      
      // Transform to MedicineWithExpiry format
      const medicinesWithExpiry: MedicineWithExpiry[] = expiringData.map(data => {
        const statusColor = data.expiryStatus.status === 'expired' ? 'text-red-800 bg-red-100' :
                            data.expiryStatus.status === 'critical' ? 'text-red-600 bg-red-50' :
                            data.expiryStatus.status === 'warning' ? 'text-yellow-600 bg-yellow-50' :
                            'text-green-600 bg-green-50';
        
        return {
          ...data.medicine,
          expiryStatus: {
            status: data.expiryStatus.status === 'ok' ? 'good' : data.expiryStatus.status,
            daysUntilExpiry: data.expiryStatus.daysUntilExpiry,
            color: statusColor,
            message: `Expires in ${data.expiryStatus.daysUntilExpiry} days`
          },
          nearestExpiryDate: data.batch.expiryDate,
          batchCount: 1
        };
      });
      
      setExpiringMedicines(medicinesWithExpiry);

      // Get stock levels
      const stocks = await getStockLevels();
      setStockLevels(stocks);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, 'useExpiry.refreshExpiry');
      showError('Failed to load expiry data', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [daysThreshold, showError]);

  // Calculate counts
  const expiredCount = expiringMedicines.filter(
    m => m.expiryStatus.status === 'expired'
  ).length;

  const expiringCount = expiringMedicines.filter(
    m => m.expiryStatus.status === 'critical' || m.expiryStatus.status === 'warning'
  ).length;

  const lowStockCount = stockLevels.filter(s => s.status === 'low').length;
  const criticalStockCount = stockLevels.filter(s => s.status === 'critical').length;

  // Load data on mount
  useEffect(() => {
    refreshExpiry();
  }, [refreshExpiry]);

  return {
    expiringMedicines,
    expiredCount,
    expiringCount,
    stockLevels,
    lowStockCount,
    criticalStockCount,
    loading,
    error,
    refreshExpiry,
    getExpiryStatus,
    getStatusColor
  };
}
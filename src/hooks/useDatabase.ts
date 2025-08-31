import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db/database';
import { resetAndSeed } from '../services/db/seedData';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage, logError } from '../utils/errorHandler';

interface DatabaseStats {
  totalMedicines: number;
  totalItems: number;
  totalBatches: number;
  totalLocations: number;
  totalMovements: number;
}

interface UseDatabaseReturn {
  isConnected: boolean;
  stats: DatabaseStats | null;
  loading: boolean;
  error: string | null;
  resetData: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  getDatabaseStats: () => Promise<DatabaseStats>;
}

export function useDatabase(): UseDatabaseReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try to count medicines as a connection test
      await db.medicines.count();
      setIsConnected(true);
      setError(null);
      return true;
    } catch (err) {
      setIsConnected(false);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, 'useDatabase.checkConnection');
      return false;
    }
  }, []);

  const getDatabaseStats = useCallback(async (): Promise<DatabaseStats> => {
    try {
      const [medicines, batches, locations, movements] = await Promise.all([
        db.medicines.count(),
        db.batches.count(),
        db.locations.count(),
        db.movements.count()
      ]);

      // Calculate total items from batches
      const allBatches = await db.batches.toArray();
      const totalItems = allBatches.reduce((sum, batch) => sum + batch.quantity, 0);

      const statsData = {
        totalMedicines: medicines,
        totalItems: totalItems,
        totalBatches: batches,
        totalLocations: locations,
        totalMovements: movements
      };

      setStats(statsData);
      return statsData;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, 'useDatabase.getDatabaseStats');
      throw err;
    }
  }, []);

  const resetData = useCallback(async () => {
    try {
      setLoading(true);
      await resetAndSeed();
      showSuccess('Database reset', 'All data has been cleared and reseeded with default values');
      
      // Refresh stats after reset
      await getDatabaseStats();
      await checkConnection();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, 'useDatabase.resetData');
      showError('Reset failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkConnection, getDatabaseStats, showSuccess, showError]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const connected = await checkConnection();
        if (connected) {
          await getDatabaseStats();
        }
      } catch (err) {
        logError(err, 'useDatabase.initialize');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [checkConnection, getDatabaseStats]);

  return {
    isConnected,
    stats,
    loading,
    error,
    resetData,
    checkConnection,
    getDatabaseStats
  };
}
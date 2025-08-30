import { db } from './db/database';
import { Medicine, Batch, Item, Location, Movement } from '../types';

export interface BackupData {
  version: string;
  exportDate: string;
  exportedBy: string;
  medicines: Medicine[];
  batches: Batch[];
  items?: Item[];
  locations?: Location[];
  movements?: Movement[];
  metadata: {
    medicineCount: number;
    batchCount: number;
    itemCount: number;
    locationCount: number;
    movementCount: number;
    totalValue?: number;
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported?: {
    medicines: number;
    batches: number;
    items: number;
    locations: number;
    movements: number;
  };
  errors?: string[];
}

/**
 * Export entire database to JSON
 * Focuses on critical data: medicines, batches (with expiration), and stock levels
 */
export async function exportDatabase(includeMovements: boolean = false): Promise<BackupData> {
  try {
    // Fetch all data from database
    const medicines = await db.medicines.toArray();
    const batches = await db.batches.toArray();
    const items = await db.items.toArray();
    const locations = await db.locations.toArray();
    const movements = includeMovements ? await db.movements.toArray() : [];

    // Create backup object with metadata
    const backup: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      exportedBy: 'DFMRT Medicine Tracker v0.1.20',
      medicines: medicines,
      batches: batches,
      items: items,
      locations: locations,
      movements: movements,
      metadata: {
        medicineCount: medicines.length,
        batchCount: batches.length,
        itemCount: items.length,
        locationCount: locations.length,
        movementCount: movements.length
      }
    };

    return backup;
  } catch (error) {
    console.error('Failed to export database:', error);
    throw new Error('Failed to export database');
  }
}

/**
 * Export critical data only (medicines and batches with expiration)
 * This is the minimal data needed to restore inventory after a failure
 */
export async function exportCriticalData(): Promise<string> {
  try {
    const medicines = await db.medicines.toArray();
    const batches = await db.batches.toArray();
    
    // Create a simplified export focused on restoration
    const criticalData = medicines.map(medicine => {
      const medicineBatches = batches.filter(b => b.medicineId === medicine.id);
      const totalStock = medicineBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      
      return {
        // Medicine info
        name: medicine.name,
        strength: medicine.strength,
        form: medicine.form,
        route: medicine.route,
        category: medicine.category,
        isControlled: medicine.isControlled,
        minStock: medicine.minStock,
        maxStock: medicine.maxStock,
        storageRequirements: medicine.storageRequirements,
        notes: medicine.notes,
        
        // Stock info
        currentStock: totalStock,
        
        // Batch info with expiration
        batches: medicineBatches.map(batch => ({
          lotNumber: batch.lotNumber,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          manufacturer: batch.manufacturer,
          supplierName: batch.supplierName,
          receivedDate: batch.receivedDate
        }))
      };
    });

    const exportData = {
      exportType: 'critical',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      medicineCount: medicines.length,
      totalBatches: batches.length,
      data: criticalData
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export critical data:', error);
    throw new Error('Failed to export critical data');
  }
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(data: BackupData | string, filename?: string): void {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const defaultFilename = filename || `dfmrt-medicine-backup-${date}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Import database from backup
 */
export async function importDatabase(jsonData: string, clearExisting: boolean = false): Promise<ImportResult> {
  const errors: string[] = [];
  
  try {
    const backup = JSON.parse(jsonData) as BackupData | any;
    
    // Validate backup structure
    if (!backup.version || (!backup.medicines && !backup.data)) {
      return {
        success: false,
        message: 'Invalid backup file format',
        errors: ['Missing required fields in backup file']
      };
    }

    // If clearExisting, clear all data first
    if (clearExisting) {
      await db.clearAllData();
      await db.initializeDefaults();
    }

    let medicineCount = 0;
    let batchCount = 0;
    let itemCount = 0;
    let locationCount = 0;
    let movementCount = 0;

    // Handle critical data format (simplified export)
    if (backup.exportType === 'critical' && backup.data) {
      for (const item of backup.data) {
        try {
          // Create medicine
          const medicineId = `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await db.medicines.add({
            id: medicineId,
            name: item.name,
            strength: item.strength,
            form: item.form,
            route: item.route,
            category: item.category,
            isControlled: item.isControlled,
            minStock: item.minStock,
            maxStock: item.maxStock,
            storageRequirements: item.storageRequirements,
            notes: item.notes
          });
          medicineCount++;

          // Create batches
          for (const batch of item.batches) {
            const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await db.batches.add({
              id: batchId,
              medicineId: medicineId,
              lotNumber: batch.lotNumber,
              quantity: batch.quantity,
              expiryDate: new Date(batch.expiryDate),
              manufacturer: batch.manufacturer,
              supplierName: batch.supplierName,
              receivedDate: new Date(batch.receivedDate)
            });
            batchCount++;
          }
        } catch (error) {
          errors.push(`Failed to import medicine: ${item.name} - ${error}`);
        }
      }
    } 
    // Handle full backup format
    else if (backup.medicines) {
      // Import medicines
      for (const medicine of backup.medicines) {
        try {
          await db.medicines.add(medicine);
          medicineCount++;
        } catch (error) {
          errors.push(`Failed to import medicine: ${medicine.name}`);
        }
      }

      // Import batches
      if (backup.batches) {
        for (const batch of backup.batches) {
          try {
            await db.batches.add({
              ...batch,
              expiryDate: new Date(batch.expiryDate),
              receivedDate: new Date(batch.receivedDate)
            });
            batchCount++;
          } catch (error) {
            errors.push(`Failed to import batch: ${batch.lotNumber}`);
          }
        }
      }

      // Import items if present
      if (backup.items) {
        for (const item of backup.items) {
          try {
            await db.items.add(item);
            itemCount++;
          } catch (error) {
            errors.push(`Failed to import item: ${item.id}`);
          }
        }
      }

      // Import locations if present
      if (backup.locations) {
        for (const location of backup.locations) {
          try {
            await db.locations.add(location);
            locationCount++;
          } catch (error) {
            errors.push(`Failed to import location: ${location.name}`);
          }
        }
      }

      // Import movements if present
      if (backup.movements) {
        for (const movement of backup.movements) {
          try {
            await db.movements.add({
              ...movement,
              timestamp: new Date(movement.timestamp)
            });
            movementCount++;
          } catch (error) {
            errors.push(`Failed to import movement: ${movement.id}`);
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? 'Database imported successfully' 
        : `Import completed with ${errors.length} errors`,
      imported: {
        medicines: medicineCount,
        batches: batchCount,
        items: itemCount,
        locations: locationCount,
        movements: movementCount
      },
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to parse backup file',
      errors: [`Invalid JSON format: ${error}`]
    };
  }
}

/**
 * Validate backup file before import
 */
export function validateBackupFile(jsonData: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const backup = JSON.parse(jsonData);
    
    // Check for required fields
    if (!backup.version && !backup.exportType) {
      errors.push('Missing version or export type');
    }
    
    if (!backup.medicines && !backup.data) {
      errors.push('No medicine data found in backup');
    }
    
    // Validate data structure
    if (backup.medicines && !Array.isArray(backup.medicines)) {
      errors.push('Medicines must be an array');
    }
    
    if (backup.batches && !Array.isArray(backup.batches)) {
      errors.push('Batches must be an array');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['Invalid JSON format']
    };
  }
}
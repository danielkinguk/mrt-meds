import Dexie, { Table } from 'dexie';
import type {
  Medicine,
  Batch,
  Item,
  Location,
  Movement,
  User,
  KitCheck,
  AuditLog,
  AppSettings
} from '../../types';

export class MRTMedsDatabase extends Dexie {
  medicines!: Table<Medicine>;
  batches!: Table<Batch>;
  items!: Table<Item>;
  locations!: Table<Location>;
  movements!: Table<Movement>;
  users!: Table<User>;
  kitChecks!: Table<KitCheck>;
  auditLogs!: Table<AuditLog>;
  settings!: Table<AppSettings & { id: string }>;

  constructor(dbName?: string) {
    super(dbName || 'MRTMedsDB');
    
    this.version(1).stores({
      medicines: '++id, name, category, isControlled',
      batches: '++id, medicineId, lotNumber, expiryDate',
      items: '++id, batchId, medicineId, locationId, status',
      locations: '++id, name, type, parentId',
      movements: '++id, itemId, medicineId, action, timestamp',
      users: '++id, name, role, email',
      kitChecks: '++id, locationId, checkedDate, status',
      auditLogs: '++id, timestamp, userId, action, entity',
      settings: '++id'
    });
  }

  async initializeDefaults() {
    try {
      const settingsCount = await this.settings.count();
      
      if (settingsCount === 0) {
        await this.settings.add({
          id: 'default',
          expiryWarningDays: 60,
          expiryCriticalDays: 30,
          lowStockPercentage: 30,
          criticalStockPercentage: 10,
          kitCheckIntervalDays: 30,
          temperatureUnit: 'celsius',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h'
        });
      }

      const locationsCount = await this.locations.count();
      
      if (locationsCount === 0) {
        // Add default locations one by one to avoid constraint errors
        const defaultLocations = [
          {
            id: 'base-1',
            name: 'Base',
            type: 'base' as const,
            description: 'Duddon and Furness Mountain Rescue Team, Foxfield, Cumbria',
            isActive: true,
            sortOrder: 1
          },
          {
            id: 'cabinet-1',
            name: 'Drug Safe',
            type: 'cabinet' as const,
            parentId: 'base-1',
            description: 'Secure drug storage',
            isActive: true,
            sortOrder: 2
          },
          {
            id: 'store-1',
            name: 'Store',
            type: 'storage' as const,
            parentId: 'base-1',
            description: 'New drugs and spare stock not yet assigned to DM bags',
            isActive: true,
            sortOrder: 3
          }
        ];

        for (const location of defaultLocations) {
          try {
            await this.locations.add(location);
          } catch (error) {
            // Location might already exist, continue
            console.log(`Default location ${location.id} already exists`);
          }
        }
      }

      const usersCount = await this.users.count();
      
      if (usersCount === 0) {
        try {
          await this.users.add({
            id: 'user-1',
            name: 'System Admin',
            role: 'admin',
            email: 'admin@mrt.local',
            isActive: true
          });
        } catch (error) {
          // User might already exist, continue
          console.log('Default user already exists');
        }
      }
    } catch (error) {
      console.error('Error initializing database defaults:', error);
      // Don't throw - let the application continue with partial initialization
    }
  }

  async clearAllData() {
    await this.transaction('rw', this.tables, async () => {
      await Promise.all(this.tables.map(table => table.clear()));
    });
  }
}

// Legacy singleton for backward compatibility (deprecated)
export const db = new MRTMedsDatabase();

// Add localStorage fallback for environments where IndexedDB fails
export class LocalStorageFallback {
  private static instance: LocalStorageFallback;
  private storageKey = 'mrt-meds-data';
  
  static getInstance(): LocalStorageFallback {
    if (!LocalStorageFallback.instance) {
      LocalStorageFallback.instance = new LocalStorageFallback();
    }
    return LocalStorageFallback.instance;
  }
  
  async saveData(data: any): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }
  
  async loadData(): Promise<any> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }
  
  async clearData(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

// Legacy initialization function (deprecated - use ConnectionManager instead)
export async function initializeDatabase() {
  try {
    console.log('Attempting to initialize database...');
    
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      throw new Error('IndexedDB is not supported in this browser/environment');
    }
    
    // Check if we're in a private browsing mode or restricted environment
    const testDB = indexedDB.open('test-db', 1);
    testDB.onerror = () => {
      console.warn('IndexedDB test failed - possible private browsing or restricted environment');
    };
    
    await db.open();
    console.log('Database opened successfully');
    
    await db.initializeDefaults();
    console.log('Database initialized successfully');
    
    // Test database operations
    const testCount = await db.medicines.count();
    console.log(`Database test: ${testCount} medicines found`);
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    
    // Try localStorage fallback
    console.log('Attempting localStorage fallback...');
    const fallback = LocalStorageFallback.getInstance();
    
    try {
      const fallbackData = await fallback.loadData();
      if (fallbackData) {
        console.log('Using localStorage fallback data');
        // You could implement a way to use this fallback data
        // For now, we'll just log it
        console.log('Fallback data available:', fallbackData);
      }
    } catch (fallbackError) {
      console.error('LocalStorage fallback also failed:', fallbackError);
    }
    
    // Provide more specific error information
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please clear browser data or use a different browser.');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Database is in an invalid state. Please refresh the page.');
      } else if (error.name === 'VersionError') {
        throw new Error('Database version mismatch. Please clear browser data.');
      }
    }
    
    throw error;
  }
}
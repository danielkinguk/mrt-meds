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

  constructor() {
    super('MRTMedsDB');
    
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
      await this.locations.bulkAdd([
        {
          id: 'base-1',
          name: 'Base',
          type: 'base',
          description: 'Duddon and Furness Mountain Rescue Team, Foxfield, Cumbria',
          isActive: true,
          sortOrder: 1
        },
        {
          id: 'cabinet-1',
          name: 'Drug Safe',
          type: 'cabinet',
          parentId: 'base-1',
          description: 'Secure drug storage',
          isActive: true,
          sortOrder: 2
        },
        {
          id: 'store-1',
          name: 'Store',
          type: 'storage',
          parentId: 'base-1',
          description: 'New drugs and spare stock not yet assigned to DM bags',
          isActive: true,
          sortOrder: 3
        }
      ]);
    }

    const usersCount = await this.users.count();
    
    if (usersCount === 0) {
      await this.users.add({
        id: 'user-1',
        name: 'System Admin',
        role: 'admin',
        email: 'admin@mrt.local',
        isActive: true
      });
    }
  }

  async clearAllData() {
    await this.transaction('rw', this.tables, async () => {
      await Promise.all(this.tables.map(table => table.clear()));
    });
  }
}

export const db = new MRTMedsDatabase();

export async function initializeDatabase() {
  try {
    await db.open();
    await db.initializeDefaults();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
import { vi } from 'vitest';
import type { Medicine, Batch, Item, Location } from '../../types';

// Mock medicines data
export const mockMedicines: Medicine[] = [
  {
    id: 'med-1',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    strength: '500mg',
    form: 'tablet',
    route: 'oral',
    category: 'analgesic',
    isControlled: false,
    minStock: 10,
    maxStock: 100,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'med-2',
    name: 'Morphine',
    genericName: 'Morphine sulfate',
    strength: '10mg/ml',
    form: 'injection',
    route: 'intravenous',
    category: 'analgesic',
    isControlled: true,
    minStock: 5,
    maxStock: 20,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Mock batches data
export const mockBatches: Batch[] = [
  {
    id: 'batch-1',
    medicineId: 'med-1',
    lotNumber: 'LOT001',
    expiryDate: new Date('2025-12-31'),
    quantity: 50,
    receivedDate: new Date('2024-01-01'),
    supplierId: 'supplier-1',
    cost: 25.00,
  },
  {
    id: 'batch-2',
    medicineId: 'med-2',
    lotNumber: 'LOT002',
    expiryDate: new Date('2024-06-30'), // Expired
    quantity: 10,
    receivedDate: new Date('2024-01-01'),
    supplierId: 'supplier-1',
    cost: 100.00,
  },
];

// Mock locations data
export const mockLocations: Location[] = [
  {
    id: 'loc-1',
    name: 'Base',
    description: 'Main storage location',
    type: 'storage',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'loc-2',
    name: 'DM 1 Red Bag',
    description: 'Emergency response kit',
    type: 'kit',
    parentId: 'loc-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Mock database operations
export const mockDb = {
  medicines: {
    toArray: vi.fn().mockResolvedValue(mockMedicines),
    get: vi.fn().mockImplementation((id: string) => 
      Promise.resolve(mockMedicines.find(m => m.id === id))
    ),
    add: vi.fn().mockImplementation((medicine: Omit<Medicine, 'id'>) => 
      Promise.resolve(`med-${Date.now()}`)
    ),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(mockMedicines.length),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
  },
  batches: {
    toArray: vi.fn().mockResolvedValue(mockBatches),
    get: vi.fn().mockImplementation((id: string) => 
      Promise.resolve(mockBatches.find(b => b.id === id))
    ),
    add: vi.fn().mockResolvedValue('batch-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(mockBatches.length),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    belowOrEqual: vi.fn().mockReturnThis(),
  },
  items: {
    toArray: vi.fn().mockResolvedValue([]),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue(0),
  },
  locations: {
    toArray: vi.fn().mockResolvedValue(mockLocations),
    count: vi.fn().mockResolvedValue(mockLocations.length),
  },
  movements: {
    where: vi.fn().mockReturnThis(),
    above: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    count: vi.fn().mockResolvedValue(5),
    delete: vi.fn().mockResolvedValue(0),
  },
};

// Mock the database module
vi.mock('../../services/db/database', () => ({
  db: mockDb,
}));

// Mock database services
vi.mock('../../services/db/medicines', () => ({
  getExpiringMedicines: vi.fn().mockResolvedValue([
    {
      medicine: mockMedicines[0],
      batch: mockBatches[0],
      items: [],
      expiryStatus: {
        status: 'warning',
        daysUntilExpiry: 45,
        expiryDate: mockBatches[0].expiryDate,
      },
    },
  ]),
  getStockLevels: vi.fn().mockResolvedValue([
    {
      medicineId: 'med-1',
      medicineName: 'Paracetamol',
      currentStock: 50,
      minStock: 10,
      maxStock: 100,
      status: 'ok',
      percentage: 50,
    },
  ]),
}));

vi.mock('../../services/db/seedData', () => ({
  resetAndSeed: vi.fn().mockResolvedValue(undefined),
}));
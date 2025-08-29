import { db } from './database';
import type { Medicine, Batch, Item, StockLevel, ExpiryStatus } from '../../types';

export async function getAllMedicines(): Promise<Medicine[]> {
  return await db.medicines.toArray();
}

export async function getMedicineById(id: string): Promise<Medicine | undefined> {
  return await db.medicines.get(id);
}

export async function addMedicine(medicine: Omit<Medicine, 'id'>): Promise<string> {
  const id = await db.medicines.add({ ...medicine, id: crypto.randomUUID() });
  return id as string;
}

export async function updateMedicine(id: string, updates: Partial<Medicine>): Promise<void> {
  await db.medicines.update(id, updates);
}

export async function deleteMedicine(id: string): Promise<void> {
  await db.transaction('rw', db.medicines, db.batches, db.items, async () => {
    await db.items.where('medicineId').equals(id).delete();
    await db.batches.where('medicineId').equals(id).delete();
    await db.medicines.delete(id);
  });
}

export async function getMedicineStock(medicineId: string): Promise<number> {
  const items = await db.items
    .where('medicineId')
    .equals(medicineId)
    .and(item => item.status === 'available')
    .toArray();
  
  return items.length;
}

export async function getStockLevels(): Promise<StockLevel[]> {
  const medicines = await db.medicines.toArray();
  const stockLevels: StockLevel[] = [];

  for (const medicine of medicines) {
    const currentStock = await getMedicineStock(medicine.id);
    const percentage = medicine.maxStock > 0 
      ? (currentStock / medicine.maxStock) * 100 
      : 0;

    let status: StockLevel['status'] = 'ok';
    if (currentStock <= medicine.minStock * 0.5) {
      status = 'critical';
    } else if (currentStock <= medicine.minStock) {
      status = 'low';
    } else if (currentStock > medicine.maxStock) {
      status = 'excess';
    }

    stockLevels.push({
      medicineId: medicine.id,
      medicineName: medicine.name,
      currentStock,
      minStock: medicine.minStock,
      maxStock: medicine.maxStock,
      status,
      percentage
    });
  }

  return stockLevels;
}

export async function getExpiringMedicines(daysAhead: number = 60): Promise<{
  medicine: Medicine;
  batch: Batch;
  items: Item[];
  expiryStatus: ExpiryStatus;
}[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  const expiringBatches = await db.batches
    .where('expiryDate')
    .belowOrEqual(cutoffDate)
    .toArray();

  const results = [];

  for (const batch of expiringBatches) {
    const medicine = await db.medicines.get(batch.medicineId);
    if (!medicine) continue;

    const items = await db.items
      .where('batchId')
      .equals(batch.id)
      .and(item => item.status === 'available')
      .toArray();

    if (items.length === 0) continue;

    const today = new Date();
    const expiryDate = new Date(batch.expiryDate);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let status: ExpiryStatus['status'] = 'ok';
    if (daysUntilExpiry < 0) {
      status = 'expired';
    } else if (daysUntilExpiry <= 30) {
      status = 'critical';
    } else if (daysUntilExpiry <= 60) {
      status = 'warning';
    }

    results.push({
      medicine,
      batch,
      items,
      expiryStatus: {
        status,
        daysUntilExpiry,
        expiryDate: batch.expiryDate
      }
    });
  }

  return results.sort((a, b) => a.expiryStatus.daysUntilExpiry - b.expiryStatus.daysUntilExpiry);
}

export async function searchMedicines(query: string): Promise<Medicine[]> {
  const lowerQuery = query.toLowerCase();
  
  return await db.medicines
    .filter(medicine => 
      medicine.name.toLowerCase().includes(lowerQuery) ||
      medicine.category.toLowerCase().includes(lowerQuery) ||
      medicine.form.toLowerCase().includes(lowerQuery)
    )
    .toArray();
}
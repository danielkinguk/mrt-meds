import { db } from '../services/db/database';
import { Medicine, Batch, Item, Movement } from '../types';

export interface ReportData {
  title: string;
  generated: Date;
  data: any[];
  summary?: Record<string, any>;
}

export async function generateExpiryReport(daysAhead: number = 60): Promise<ReportData> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  const batches = await db.batches
    .where('expiryDate')
    .below(futureDate)
    .toArray();
  
  const medicineIds = [...new Set(batches.map(b => b.medicineId))];
  const medicines = await db.medicines
    .where('id')
    .anyOf(medicineIds)
    .toArray();
  
  const medicineMap = new Map(medicines.map(m => [m.id, m]));
  
  const reportData = batches.map(batch => {
    const medicine = medicineMap.get(batch.medicineId);
    const daysUntilExpiry = Math.floor((batch.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return {
      medicineName: medicine?.name || 'Unknown',
      strength: medicine?.strength || '',
      lotNumber: batch.lotNumber,
      expiryDate: batch.expiryDate.toLocaleDateString(),
      daysUntilExpiry,
      quantity: batch.quantity,
      status: daysUntilExpiry < 0 ? 'Expired' : daysUntilExpiry <= 30 ? 'Critical' : 'Warning'
    };
  }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  
  return {
    title: `Expiry Report - Items expiring within ${daysAhead} days`,
    generated: new Date(),
    data: reportData,
    summary: {
      totalItems: reportData.length,
      expired: reportData.filter(d => d.status === 'Expired').length,
      critical: reportData.filter(d => d.status === 'Critical').length,
      warning: reportData.filter(d => d.status === 'Warning').length
    }
  };
}

export async function generateStockLevelReport(): Promise<ReportData> {
  const medicines = await db.medicines.toArray();
  const batches = await db.batches.toArray();
  
  const stockByMedicine = new Map<string, number>();
  batches.forEach(batch => {
    const current = stockByMedicine.get(batch.medicineId) || 0;
    stockByMedicine.set(batch.medicineId, current + batch.quantity);
  });
  
  const reportData = medicines.map(medicine => {
    const currentStock = stockByMedicine.get(medicine.id!) || 0;
    const stockPercentage = medicine.maxStock > 0 ? (currentStock / medicine.maxStock) * 100 : 0;
    
    let status = 'Good';
    if (currentStock === 0) status = 'Out of Stock';
    else if (currentStock < medicine.minStock) status = 'Critical';
    else if (currentStock < medicine.minStock * 1.5) status = 'Low';
    
    return {
      medicineName: medicine.name,
      category: medicine.category,
      form: medicine.form,
      strength: medicine.strength,
      currentStock,
      minStock: medicine.minStock,
      maxStock: medicine.maxStock,
      stockPercentage: stockPercentage.toFixed(1),
      status,
      reorderNeeded: currentStock < medicine.minStock
    };
  }).sort((a, b) => {
    // Sort by status priority, then by name
    const statusOrder = { 'Out of Stock': 0, 'Critical': 1, 'Low': 2, 'Good': 3 };
    const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    if (statusDiff !== 0) return statusDiff;
    return a.medicineName.localeCompare(b.medicineName);
  });
  
  return {
    title: 'Stock Level Report',
    generated: new Date(),
    data: reportData,
    summary: {
      totalMedicines: reportData.length,
      outOfStock: reportData.filter(d => d.status === 'Out of Stock').length,
      critical: reportData.filter(d => d.status === 'Critical').length,
      low: reportData.filter(d => d.status === 'Low').length,
      reorderNeeded: reportData.filter(d => d.reorderNeeded).length
    }
  };
}

export async function generateControlledDrugsReport(): Promise<ReportData> {
  const controlledMeds = await db.medicines
    .where('isControlled')
    .equals(1)
    .toArray();
  
  const medIds = controlledMeds.map(m => m.id!);
  const movements = await db.movements
    .where('medicineId')
    .anyOf(medIds)
    .toArray();
  
  const batches = await db.batches
    .where('medicineId')
    .anyOf(medIds)
    .toArray();
  
  const reportData = movements.map(movement => {
    const medicine = controlledMeds.find(m => m.id === movement.medicineId);
    const batch = batches.find(b => b.id === movement.batchId);
    
    return {
      date: movement.timestamp.toLocaleDateString(),
      time: movement.timestamp.toLocaleTimeString(),
      medicineName: medicine?.name || 'Unknown',
      strength: medicine?.strength || '',
      lotNumber: batch?.lotNumber || '',
      action: movement.action,
      quantity: movement.quantity,
      performedBy: movement.performedBy,
      notes: movement.notes || ''
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
  
  return {
    title: 'Controlled Drugs Register',
    generated: new Date(),
    data: reportData,
    summary: {
      totalEntries: reportData.length,
      totalMedicines: controlledMeds.length,
      actions: {
        receive: reportData.filter(d => d.action === 'receive').length,
        administer: reportData.filter(d => d.action === 'administer').length,
        dispose: reportData.filter(d => d.action === 'dispose').length,
        transfer: reportData.filter(d => d.action === 'transfer').length
      }
    }
  };
}

export function exportToCSV(report: ReportData): string {
  if (report.data.length === 0) return '';
  
  const headers = Object.keys(report.data[0]);
  const rows = report.data.map(item => 
    headers.map(header => {
      const value = item[header];
      const stringValue = value?.toString() || '';
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    }).join(',')
  );
  
  const summaryRows = report.summary ? [
    '',
    'Summary:',
    ...Object.entries(report.summary).map(([key, value]) => {
      if (typeof value === 'object') {
        return Object.entries(value).map(([k, v]) => `${key} - ${k}: ${v}`).join('\n');
      }
      return `${key}: ${value}`;
    })
  ] : [];
  
  return [
    report.title,
    `Generated: ${report.generated.toLocaleString()}`,
    '',
    headers.join(','),
    ...rows,
    ...summaryRows
  ].join('\n');
}

export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
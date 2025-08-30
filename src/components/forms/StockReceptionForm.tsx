import { useState, useEffect } from 'react';
import { X, Package, Plus, AlertCircle } from 'lucide-react';
import type { Medicine, Batch } from '../../types';
import { db } from '../../services/db/database';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage, logError } from '../../utils/errorHandler';

interface StockReceptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface BatchFormData {
  medicineId: string;
  quantity: number;
  lotNumber: string;
  expiryDate: string;
  manufacturer: string;
  supplierName: string;
  invoiceNumber: string;
}

const initialBatchData: BatchFormData = {
  medicineId: '',
  quantity: 0,
  lotNumber: '',
  expiryDate: '',
  manufacturer: '',
  supplierName: '',
  invoiceNumber: ''
};

export function StockReceptionForm({ isOpen, onClose, onSave }: StockReceptionFormProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<BatchFormData[]>([initialBatchData]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadMedicines();
      setBatches([initialBatchData]);
      setErrors({});
    }
  }, [isOpen]);

  const loadMedicines = async () => {
    try {
      const meds = await db.medicines.orderBy('name').toArray();
      setMedicines(meds);
    } catch (error) {
      logError(error, 'loadMedicines');
      showError('Failed to load medicines', getErrorMessage(error));
    }
  };

  const addBatchRow = () => {
    setBatches([...batches, { ...initialBatchData }]);
  };

  const removeBatchRow = (index: number) => {
    if (batches.length > 1) {
      setBatches(batches.filter((_, i) => i !== index));
    }
  };

  const updateBatch = (index: number, field: keyof BatchFormData, value: string | number) => {
    const updated = [...batches];
    updated[index] = { ...updated[index], [field]: value };
    setBatches(updated);
    
    const errorKey = `${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    batches.forEach((batch, index) => {
      if (!batch.medicineId) {
        newErrors[`${index}.medicineId`] = 'Medicine selection is required';
      }
      if (!batch.quantity || batch.quantity <= 0) {
        newErrors[`${index}.quantity`] = 'Quantity must be greater than 0';
      }
      if (!batch.lotNumber.trim()) {
        newErrors[`${index}.lotNumber`] = 'Lot number is required';
      }
      if (!batch.expiryDate) {
        newErrors[`${index}.expiryDate`] = 'Expiry date is required';
      }
      if (!batch.manufacturer.trim()) {
        newErrors[`${index}.manufacturer`] = 'Manufacturer is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const receivedDate = new Date();
      let successCount = 0;
      
      for (const batchData of batches) {
        const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const batch: Batch = {
          id: batchId,
          medicineId: batchData.medicineId,
          lotNumber: batchData.lotNumber.trim(),
          expiryDate: new Date(batchData.expiryDate),
          manufacturer: batchData.manufacturer.trim(),
          receivedDate,
          quantity: batchData.quantity,
          supplierName: batchData.supplierName.trim() || undefined,
          invoiceNumber: batchData.invoiceNumber.trim() || undefined
        };

        await db.batches.add(batch);

        await db.movements.add({
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          itemId: batchId,
          medicineId: batchData.medicineId,
          batchId: batchId,
          action: 'receive',
          toLocationId: 'loc-store',
          performedBy: 'Current User',
          timestamp: receivedDate,
          quantity: batchData.quantity,
          notes: `Received from ${batchData.supplierName || batchData.manufacturer}`
        });
        successCount++;
      }

      showSuccess(
        'Stock received successfully', 
        `${successCount} batch${successCount > 1 ? 'es' : ''} added to inventory`
      );
      onSave();
      onClose();
    } catch (error) {
      logError(error, 'handleSubmit');
      showError('Failed to receive stock', getErrorMessage(error));
      setErrors({ submit: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-primary-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Receive Stock</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{errors.submit}</span>
            </div>
          )}

          <div className="space-y-6">
            {batches.map((batch, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Batch {index + 1}
                  </h3>
                  {batches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBatchRow(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicine *
                    </label>
                    <select
                      value={batch.medicineId}
                      onChange={(e) => updateBatch(index, 'medicineId', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors[`${index}.medicineId`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select medicine...</option>
                      {medicines.map(med => (
                        <option key={med.id} value={med.id}>
                          {med.name} - {med.strength} ({med.form})
                        </option>
                      ))}
                    </select>
                    {errors[`${index}.medicineId`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`${index}.medicineId`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={batch.quantity || ''}
                      onChange={(e) => updateBatch(index, 'quantity', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors[`${index}.quantity`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 10"
                    />
                    {errors[`${index}.quantity`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`${index}.quantity`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lot Number *
                    </label>
                    <input
                      type="text"
                      value={batch.lotNumber}
                      onChange={(e) => updateBatch(index, 'lotNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors[`${index}.lotNumber`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., LOT123ABC"
                    />
                    {errors[`${index}.lotNumber`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`${index}.lotNumber`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={batch.expiryDate}
                      onChange={(e) => updateBatch(index, 'expiryDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors[`${index}.expiryDate`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors[`${index}.expiryDate`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`${index}.expiryDate`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      value={batch.manufacturer}
                      onChange={(e) => updateBatch(index, 'manufacturer', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors[`${index}.manufacturer`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Pfizer"
                    />
                    {errors[`${index}.manufacturer`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`${index}.manufacturer`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      value={batch.supplierName}
                      onChange={(e) => updateBatch(index, 'supplierName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Medical Supplies Ltd"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={batch.invoiceNumber}
                      onChange={(e) => updateBatch(index, 'invoiceNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., INV-2024-001"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={addBatchRow}
              className="flex items-center px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Batch
            </button>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              <Package className="w-4 h-4 mr-2" />
              {loading ? 'Receiving Stock...' : 'Receive Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
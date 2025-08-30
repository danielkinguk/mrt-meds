import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { Medicine, MedicineForm as Form, MedicineRoute, MedicineCategory } from '../../types';
import { db } from '../../services/db/database';
import { useToast } from '../../contexts/ToastContext';

interface MedicineFormProps {
  medicine?: Medicine;
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicine: Omit<Medicine, 'id'> | Medicine) => void;
}

interface FormData {
  name: string;
  strength: string;
  form: Form;
  route: MedicineRoute;
  category: MedicineCategory;
  isControlled: boolean;
  storageRequirements: string;
  notes: string;
  expirationDate: string;
}

const initialFormData: FormData = {
  name: '',
  strength: '',
  form: 'tablet',
  route: 'oral',
  category: 'other',
  isControlled: false,
  storageRequirements: '',
  notes: '',
  expirationDate: ''
};

const medicineFormOptions: Form[] = [
  'tablet', 'capsule', 'injection', 'ampoule', 'vial', 'nebule', 'inhaler', 
  'spray', 'gel', 'cream', 'liquid', 'suspension', 'suppository', 'patch', 
  'mask', 'cylinder', 'device', 'consumable', 'battery', 'electrode', 
  'airway', 'dressing', 'equipment'
];

const medicineRouteOptions: MedicineRoute[] = [
  'oral', 'sublingual', 'buccal', 'intramuscular', 'intravenous', 
  'subcutaneous', 'intraosseous', 'rectal', 'nebulised', 'inhaled', 
  'nasal', 'topical', 'transdermal'
];

const medicineCategoryOptions: MedicineCategory[] = [
  'analgesic', 'antibiotic', 'antiemetic', 'antihistamine', 'cardiac',
  'respiratory', 'sedative', 'emergency', 'controlled', 'fluid', 
  'equipment', 'consumable', 'airway', 'trauma', 'other'
];

export function MedicineForm({ medicine, isOpen, onClose, onSave }: MedicineFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name,
        strength: medicine.strength,
        form: medicine.form,
        route: medicine.route,
        category: medicine.category,
        isControlled: medicine.isControlled,
        storageRequirements: medicine.storageRequirements || '',
        notes: medicine.notes || '',
        expirationDate: medicine.expirationDate ? new Date(medicine.expirationDate).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [medicine, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required';
    }

    if (!formData.strength.trim()) {
      newErrors.strength = 'Strength is required';
    }


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
      // Check for duplicate medicine name (if adding new or changing name)
      if (!medicine || medicine.name !== formData.name) {
        const existing = await db.medicines.where('name').equalsIgnoreCase(formData.name.trim()).first();
        if (existing) {
          setErrors({ name: 'A medicine with this name already exists' });
          setLoading(false);
          return;
        }
      }

      const medicineData = {
        ...formData,
        name: formData.name.trim(),
        strength: formData.strength.trim(),
        storageRequirements: formData.storageRequirements.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined,
        minStock: 5, // Default value
        maxStock: 20 // Default value
      };

      if (medicine) {
        // Edit existing
        onSave({ ...medicineData, id: medicine.id });
      } else {
        // Add new
        onSave(medicineData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving medicine:', error);
      setErrors({ submit: 'Failed to save medicine. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {medicine ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Medicine Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medicine Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Paracetamol, Morphine, Salbutamol"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Strength */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strength *
              </label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) => handleInputChange('strength', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.strength ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 500mg, 10mg/ml, 100mcg"
              />
              {errors.strength && <p className="mt-1 text-sm text-red-600">{errors.strength}</p>}
            </div>

            {/* Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form *
              </label>
              <select
                value={formData.form}
                onChange={(e) => handleInputChange('form', e.target.value as Form)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {medicineFormOptions.map(form => (
                  <option key={form} value={form}>
                    {form.charAt(0).toUpperCase() + form.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Route */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route *
              </label>
              <select
                value={formData.route}
                onChange={(e) => handleInputChange('route', e.target.value as MedicineRoute)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {medicineRouteOptions.map(route => (
                  <option key={route} value={route}>
                    {route.charAt(0).toUpperCase() + route.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as MedicineCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {medicineCategoryOptions.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Used for single-expiry items like pre-loaded syringes
              </p>
            </div>

            {/* Controlled Drug */}
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isControlled}
                  onChange={(e) => handleInputChange('isControlled', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Controlled Drug</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Check this if the medicine is a controlled substance requiring special storage and tracking
              </p>
            </div>

            {/* Storage Requirements */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Requirements
              </label>
              <textarea
                value={formData.storageRequirements}
                onChange={(e) => handleInputChange('storageRequirements', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
                placeholder="e.g., Store below 25°C, protect from light, refrigerate"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Additional notes, contraindications, or special instructions"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : (medicine ? 'Update Medicine' : 'Add Medicine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
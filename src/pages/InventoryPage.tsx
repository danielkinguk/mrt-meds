import { useState } from 'react';
import { Package, Plus, Search, Filter, Download, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Medicine } from '../types';
import { MedicineForm } from '../components/forms/MedicineForm';
import { useToast } from '../contexts/ToastContext';
import { useMedicines, useExpiry } from '../hooks';
import type { MedicineWithStock } from '../hooks';

type SortField = 'name' | 'category' | 'currentStock' | 'nearestExpiry' | 'form' | 'status';
type SortDirection = 'asc' | 'desc';

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | undefined>();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);
  const { showSuccess } = useToast();
  
  // Use custom hooks
  const { medicines, loading, addMedicine, updateMedicine, deleteMedicine, getOverallStatus } = useMedicines();
  const { getStatusColor } = useExpiry();


  const handleAddMedicine = () => {
    setEditingMedicine(undefined);
    setShowMedicineForm(true);
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setShowMedicineForm(true);
  };

  const handleSaveMedicine = async (medicineData: Omit<Medicine, 'id'> | Medicine) => {
    try {
      if ('id' in medicineData) {
        // Update existing medicine
        await updateMedicine(medicineData);
      } else {
        // Add new medicine
        await addMedicine(medicineData);
      }
      
      setShowMedicineForm(false);
      setEditingMedicine(undefined);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCloseForm = () => {
    setShowMedicineForm(false);
    setEditingMedicine(undefined);
  };

  const handleDeleteMedicine = (medicine: Medicine) => {
    setDeletingMedicine(medicine);
  };

  const confirmDeleteMedicine = async () => {
    if (!deletingMedicine) return;

    try {
      await deleteMedicine(deletingMedicine.id!);
      setDeletingMedicine(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const cancelDeleteMedicine = () => {
    setDeletingMedicine(null);
  };

  const handleExportCSV = () => {
    try {
      const csvContent = [
      ['Name', 'Generic Name', 'Strength', 'Form', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Nearest Expiry'],
      ...sortedAndFilteredMedicines.map(med => [
        med.name,
        med.genericName || '',
        med.strength,
        med.form,
        med.category,
        med.currentStock?.toString() || '0',
        med.minStock.toString(),
        getOverallStatus(med),
        med.nearestExpiry ? new Date(med.nearestExpiry).toLocaleDateString() : 'N/A'
      ])
    ].map(row => row.map(cell => 
      cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showSuccess('Export successful', 'Inventory data has been exported to CSV');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortMedicines = (medicines: MedicineWithStock[]) => {
    return [...medicines].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle special cases for different data types
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'category':
          aVal = a.category.toLowerCase();
          bVal = b.category.toLowerCase();
          break;
        case 'currentStock':
          aVal = a.currentStock || 0;
          bVal = b.currentStock || 0;
          break;
        case 'nearestExpiry':
          aVal = a.nearestExpiry ? new Date(a.nearestExpiry).getTime() : 0;
          bVal = b.nearestExpiry ? new Date(b.nearestExpiry).getTime() : 0;
          break;
        case 'form':
          aVal = a.form.toLowerCase();
          bVal = b.form.toLowerCase();
          break;
        case 'status':
          aVal = getOverallStatus(a).toLowerCase();
          bVal = getOverallStatus(b).toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredMedicines = medicines.filter(med => {
    // Search filter
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.genericName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || 
      (categoryFilter === 'controlled' && med.isControlled) ||
      (categoryFilter === 'regular' && !med.isControlled) ||
      med.category === categoryFilter;
    
    // Stock filter
    const stockStatus = getOverallStatus(med);
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'out' && stockStatus === 'Out of Stock') ||
      (stockFilter === 'low' && stockStatus === 'Low Stock') ||
      (stockFilter === 'expired' && stockStatus === 'Expired') ||
      (stockFilter === 'good' && stockStatus === 'Good');
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const sortedAndFilteredMedicines = sortMedicines(filteredMedicines);


  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    const IconComponent = isActive ? (sortDirection === 'asc' ? ChevronUp : ChevronDown) : ChevronUp;
    
    return (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        <button
          onClick={() => handleSort(field)}
          className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none group"
        >
          <span>{children}</span>
          <IconComponent 
            className={`w-4 h-4 transition-colors ${
              isActive ? 'text-primary-600' : 'text-gray-300 group-hover:text-gray-500'
            }`} 
          />
        </button>
      </th>
    );
  };

  const formatSortFieldName = (field: SortField): string => {
    switch (field) {
      case 'name': return 'Name';
      case 'category': return 'Category';
      case 'currentStock': return 'Stock';
      case 'nearestExpiry': return 'Expiration';
      case 'form': return 'Form';
      case 'status': return 'Status';
      default: return field;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 text-primary-500 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="w-6 h-6 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Medicine Inventory</h2>
              <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                Sorted by: {formatSortFieldName(sortField)} {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleAddMedicine}
                className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </button>
              <button 
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg transition-colors ${
                showFilters ? 'bg-primary-50 border-primary-500 text-primary-700' : 'hover:bg-white'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters {(categoryFilter !== 'all' || stockFilter !== 'all') && '•'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="controlled">Controlled Drugs</option>
                  <option value="regular">Regular Medicines</option>
                  <option value="analgesic">Analgesic</option>
                  <option value="antibiotic">Antibiotic</option>
                  <option value="cardiac">Cardiac</option>
                  <option value="respiratory">Respiratory</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stock Status</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="expired">Expired</option>
                  <option value="out">Out of Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="good">Good Stock</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setStockFilter('all');
                }}
                className="mt-5 px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader field="name">Medicine</SortableHeader>
                <SortableHeader field="form">Form/Strength</SortableHeader>
                <SortableHeader field="category">Category</SortableHeader>
                <SortableHeader field="currentStock">Current Stock</SortableHeader>
                <SortableHeader field="nearestExpiry">Expiration</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredMedicines.map((medicine) => {
                const status = getOverallStatus(medicine);
                const statusColor = getStatusColor(status);
                
                return (
                  <tr key={medicine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                        {medicine.genericName && (
                          <div className="text-sm text-gray-500">{medicine.genericName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {medicine.form} {medicine.strength}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        medicine.isControlled ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {medicine.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {medicine.currentStock || 0} {medicine.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {medicine.nearestExpiry ? new Date(medicine.nearestExpiry).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditMedicine(medicine)}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteMedicine(medicine)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Delete medicine"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedAndFilteredMedicines.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No medicines found</p>
          </div>
        )}
      </div>

      <MedicineForm
        medicine={editingMedicine}
        isOpen={showMedicineForm}
        onClose={handleCloseForm}
        onSave={handleSaveMedicine}
      />

      {/* Delete Confirmation Dialog */}
      {deletingMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Medicine</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete <strong>{deletingMedicine.name}</strong>?
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This will also delete all associated:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
                    <li>Batch records and lot numbers</li>
                    <li>Stock items and quantities</li>
                    <li>Movement history and audit trail</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteMedicine}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMedicine}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Medicine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
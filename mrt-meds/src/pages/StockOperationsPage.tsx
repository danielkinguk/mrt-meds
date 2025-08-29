import { useState } from 'react';
import { Plus, ArrowRightLeft, Trash2, ClipboardList } from 'lucide-react';
import { StockReceptionForm } from '../components/forms/StockReceptionForm';

export function StockOperationsPage() {
  const [selectedOperation, setSelectedOperation] = useState<string>('receive');
  const [showReceptionForm, setShowReceptionForm] = useState(false);

  const operations = [
    { id: 'receive', label: 'Receive Stock', icon: Plus, color: 'text-green-600 bg-green-50' },
    { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'text-purple-600 bg-purple-50' },
    { id: 'dispose', label: 'Dispose', icon: Trash2, color: 'text-red-600 bg-red-50' },
    { id: 'check', label: 'Stock Check', icon: ClipboardList, color: 'text-gray-600 bg-gray-50' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Stock Operations</h2>
          <p className="mt-1 text-sm text-gray-500">Record stock movements and updates</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {operations.map((op) => {
              const Icon = op.icon;
              return (
                <button
                  key={op.id}
                  onClick={() => setSelectedOperation(op.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedOperation === op.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${
                    selectedOperation === op.id ? 'text-primary-600' : op.color.split(' ')[0]
                  }`} />
                  <p className="text-sm font-medium text-gray-900">{op.label}</p>
                </button>
              );
            })}
          </div>

          {selectedOperation === 'receive' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Receive New Stock</h3>
                <button
                  onClick={() => setShowReceptionForm(true)}
                  className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Reception
                </button>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <Plus className="w-8 h-8 text-blue-600 mr-4" />
                  <div>
                    <h4 className="text-lg font-medium text-blue-900">Stock Reception System</h4>
                    <p className="text-blue-700 mt-1">
                      Receive new medicine deliveries with complete batch tracking, lot numbers, and expiry date management.
                    </p>
                    <p className="text-blue-600 text-sm mt-2">
                      • Multi-batch support • Full audit trail • Automatic stock updates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {selectedOperation === 'transfer' && (
            <div className="text-center py-12">
              <ArrowRightLeft className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Transfer functionality coming soon</p>
            </div>
          )}

          {selectedOperation === 'dispose' && (
            <div className="text-center py-12">
              <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Disposal functionality coming soon</p>
            </div>
          )}

          {selectedOperation === 'check' && (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Stock check functionality coming soon</p>
            </div>
          )}
        </div>
      </div>

      <StockReceptionForm
        isOpen={showReceptionForm}
        onClose={() => setShowReceptionForm(false)}
        onSave={() => {
          setShowReceptionForm(false);
          // Could add success message here
        }}
      />
    </div>
  );
}
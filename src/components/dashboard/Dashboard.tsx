import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  Package, 
  Clock, 
  TrendingDown,
  Plus,
  FileText,
  CheckSquare,
  List
} from 'lucide-react';
import { DashboardTile } from './DashboardTile';
import { useDatabase, useExpiry } from '../../hooks';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Use custom hooks
  const { stats, loading } = useDatabase();
  const { expiredCount, expiringCount, lowStockCount, criticalStockCount } = useExpiry();
  
  // Default values if stats is null
  const totalMedicines = stats?.totalMedicines || 0;
  const totalItems = stats?.totalItems || 0;
  const recentMovements = stats?.totalMovements || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">DFMRT Medicine Dashboard</h1>
        <p className="text-gray-600 mt-2">Quick overview of your medical inventory</p>
      </div>

      {/* Alert Section */}
      {(expiredCount > 0 || criticalStockCount > 0) && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-3" size={24} />
            <div>
              <p className="font-semibold text-red-900">Immediate Attention Required</p>
              <p className="text-red-700 text-sm mt-1">
                {expiredCount > 0 && `${expiredCount} expired items`}
                {expiredCount > 0 && criticalStockCount > 0 && ' • '}
                {criticalStockCount > 0 && `${criticalStockCount} medicines critically low`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardTile
          title="Total Medicines"
          value={totalMedicines}
          subtitle="Types in formulary"
          icon={Package}
          color="primary"
        />
        
        <DashboardTile
          title="Available Items"
          value={totalItems}
          subtitle="In stock across all locations"
          icon={Package}
          color="success"
        />
        
        <DashboardTile
          title="Expiring Soon"
          value={expiringCount}
          subtitle={expiredCount > 0 ? `+ ${expiredCount} expired` : "Within 60 days"}
          icon={Clock}
          color={expiredCount > 0 ? "danger" : "warning"}
        />
        
        <DashboardTile
          title="Low Stock"
          value={lowStockCount}
          subtitle={criticalStockCount > 0 ? `${criticalStockCount} critical` : "Below minimum"}
          icon={TrendingDown}
          color={criticalStockCount > 0 ? "danger" : "warning"}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/inventory')}
            className="flex items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <List className="mr-2" size={20} />
            <span className="font-medium">Inventory View</span>
          </button>
          
          <button 
            onClick={() => navigate('/stock-operations')}
            className="flex items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="mr-2" size={20} />
            <span className="font-medium">Receive Stock</span>
          </button>
          
          <button 
            onClick={() => navigate('/kits')}
            className="flex items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckSquare className="mr-2" size={20} />
            <span className="font-medium">Kit Check</span>
          </button>
          
          <button 
            onClick={() => navigate('/reports')}
            className="flex items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="mr-2" size={20} />
            <span className="font-medium">Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">
            {recentMovements > 0 
              ? `${recentMovements} stock movements in the last 7 days`
              : 'No recent stock movements'
            }
          </p>
        </div>
      </div>
    </div>
  );
};
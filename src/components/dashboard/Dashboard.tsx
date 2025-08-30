import React, { useEffect, useState } from 'react';
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
import { db } from '../../services/db/database';
import { getExpiringMedicines, getStockLevels } from '../../services/db/medicines';

interface DashboardStats {
  totalMedicines: number;
  totalItems: number;
  expiringCount: number;
  expiredCount: number;
  lowStockCount: number;
  criticalStockCount: number;
  locationsCount: number;
  recentMovements: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalMedicines: 0,
    totalItems: 0,
    expiringCount: 0,
    expiredCount: 0,
    lowStockCount: 0,
    criticalStockCount: 0,
    locationsCount: 0,
    recentMovements: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get basic counts
      const medicines = await db.medicines.count();
      // Calculate total stock from batches instead of individual items
      const batches = await db.batches.toArray();
      const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const locations = await db.locations.count();
      
      // Get expiring medicines
      const expiringMeds = await getExpiringMedicines(60);
      const expired = expiringMeds.filter(m => m.expiryStatus.status === 'expired').length;
      const expiring = expiringMeds.filter(m => 
        m.expiryStatus.status === 'critical' || m.expiryStatus.status === 'warning'
      ).length;
      
      // Get stock levels
      const stockLevels = await getStockLevels();
      const lowStock = stockLevels.filter(s => s.status === 'low').length;
      const criticalStock = stockLevels.filter(s => s.status === 'critical').length;
      
      // Get recent movements (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentMovements = await db.movements
        .where('timestamp')
        .above(weekAgo)
        .count();
      
      setStats({
        totalMedicines: medicines,
        totalItems: totalStock,
        expiringCount: expiring,
        expiredCount: expired,
        lowStockCount: lowStock,
        criticalStockCount: criticalStock,
        locationsCount: locations,
        recentMovements
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      {(stats.expiredCount > 0 || stats.criticalStockCount > 0) && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-3" size={24} />
            <div>
              <p className="font-semibold text-red-900">Immediate Attention Required</p>
              <p className="text-red-700 text-sm mt-1">
                {stats.expiredCount > 0 && `${stats.expiredCount} expired items`}
                {stats.expiredCount > 0 && stats.criticalStockCount > 0 && ' • '}
                {stats.criticalStockCount > 0 && `${stats.criticalStockCount} medicines critically low`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardTile
          title="Total Medicines"
          value={stats.totalMedicines}
          subtitle="Types in formulary"
          icon={Package}
          color="primary"
        />
        
        <DashboardTile
          title="Available Items"
          value={stats.totalItems}
          subtitle="In stock across all locations"
          icon={Package}
          color="success"
        />
        
        <DashboardTile
          title="Expiring Soon"
          value={stats.expiringCount}
          subtitle={stats.expiredCount > 0 ? `+ ${stats.expiredCount} expired` : "Within 60 days"}
          icon={Clock}
          color={stats.expiredCount > 0 ? "danger" : "warning"}
        />
        
        <DashboardTile
          title="Low Stock"
          value={stats.lowStockCount}
          subtitle={stats.criticalStockCount > 0 ? `${stats.criticalStockCount} critical` : "Below minimum"}
          icon={TrendingDown}
          color={stats.criticalStockCount > 0 ? "danger" : "warning"}
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
            {stats.recentMovements > 0 
              ? `${stats.recentMovements} stock movements in the last 7 days`
              : 'No recent stock movements'
            }
          </p>
        </div>
      </div>
    </div>
  );
};
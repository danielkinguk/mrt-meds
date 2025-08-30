import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Briefcase, 
  FileText,
  Database,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { BackupRestore } from '../BackupRestore';

interface NavigationProps {
  onReseed: () => void;
}

export function Navigation({ onReseed }: NavigationProps) {
  const [showBackup, setShowBackup] = useState(false);
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/kits', label: 'Kits', icon: Briefcase },
    { path: '/stock-operations', label: 'Stock Operations', icon: ArrowRightLeft },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-primary-500 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">DFMRT Medicine Tracker</h1>
            <span className="ml-3 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
              v0.1.20
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBackup(true)}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              title="Backup and restore database"
            >
              <HardDrive className="w-4 h-4 mr-1" />
              Backup
            </button>
            <button
              onClick={onReseed}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              title="Reset and reseed database"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset Data
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>
      
      <BackupRestore 
        isOpen={showBackup} 
        onClose={() => setShowBackup(false)} 
      />
    </nav>
  );
}
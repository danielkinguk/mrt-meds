import { FileText, Download, Calendar, TrendingUp, AlertTriangle, Package } from 'lucide-react';

export function ReportsPage() {
  const reports = [
    {
      id: 'expiry',
      title: 'Expiry Report',
      description: 'Items expiring within specified date range',
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      id: 'stock-levels',
      title: 'Stock Levels',
      description: 'Current stock levels and reorder suggestions',
      icon: Package,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'usage',
      title: 'Usage Analytics',
      description: 'Medicine consumption patterns and trends',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50'
    },
    {
      id: 'cd-register',
      title: 'Controlled Drugs Register',
      description: 'Audit trail for controlled substances',
      icon: FileText,
      color: 'text-red-600 bg-red-50'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
          <p className="mt-1 text-sm text-gray-500">Generate and export inventory reports</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <div key={report.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg ${report.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                      
                      <div className="mt-4 flex items-center space-x-3">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Generate
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reports</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expiry Report - December 2025</p>
                    <p className="text-xs text-gray-500">Generated 2 days ago</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm">
                  <Download className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Stock Levels - Weekly</p>
                    <p className="text-xs text-gray-500">Generated 5 days ago</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
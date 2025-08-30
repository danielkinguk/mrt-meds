import { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, AlertTriangle, Package, Loader } from 'lucide-react';
import { 
  generateExpiryReport, 
  generateStockLevelReport, 
  generateControlledDrugsReport,
  exportToCSV,
  downloadCSV,
  ReportData
} from '../utils/reportGenerator';

interface ReportConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  generator: () => Promise<ReportData>;
}

export function ReportsPage() {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<Array<{
    id: string;
    title: string;
    generated: Date;
    data: ReportData;
  }>>([]);

  const reports: ReportConfig[] = [
    {
      id: 'expiry',
      title: 'Expiry Report',
      description: 'Items expiring within specified date range',
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50',
      generator: () => generateExpiryReport(60)
    },
    {
      id: 'stock-levels',
      title: 'Stock Levels',
      description: 'Current stock levels and reorder suggestions',
      icon: Package,
      color: 'text-blue-600 bg-blue-50',
      generator: generateStockLevelReport
    },
    {
      id: 'usage',
      title: 'Usage Analytics',
      description: 'Medicine consumption patterns and trends',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50',
      generator: generateStockLevelReport // Placeholder - would need usage tracking
    },
    {
      id: 'cd-register',
      title: 'Controlled Drugs Register',
      description: 'Audit trail for controlled substances',
      icon: FileText,
      color: 'text-red-600 bg-red-50',
      generator: generateControlledDrugsReport
    }
  ];

  const handleGenerateReport = async (report: ReportConfig) => {
    setGeneratingReport(report.id);
    try {
      const reportData = await report.generator();
      
      // Add to recent reports
      const newReport = {
        id: `${report.id}-${Date.now()}`,
        title: reportData.title,
        generated: reportData.generated,
        data: reportData
      };
      
      setRecentReports(prev => [newReport, ...prev.slice(0, 4)]);
      
      // Auto-download the report
      const csv = exportToCSV(reportData);
      const filename = `${report.id}_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(filename, csv);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadReport = (report: { data: ReportData; title: string }) => {
    const csv = exportToCSV(report.data);
    const filename = `${report.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filename, csv);
  };

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
              const isGenerating = generatingReport === report.id;
              
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
                        <button 
                          onClick={() => handleGenerateReport(report)}
                          disabled={isGenerating}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isGenerating ? (
                            <>
                              <Loader className="w-4 h-4 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            'Generate & Download'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {recentReports.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reports</h3>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{report.title}</p>
                        <p className="text-xs text-gray-500">
                          Generated {report.generated.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownloadReport(report)}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
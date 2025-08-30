import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, Database, FileJson, X } from 'lucide-react';
import { 
  exportDatabase, 
  exportCriticalData, 
  downloadBackup, 
  importDatabase, 
  validateBackupFile 
} from '../services/backupService';
import { useToast } from '../contexts/ToastContext';

interface BackupRestoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupRestore({ isOpen, onClose }: BackupRestoreProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleExportFull = async () => {
    setIsExporting(true);
    try {
      showInfo('Exporting database...', 'This may take a moment');
      const backup = await exportDatabase(true);
      downloadBackup(backup);
      showSuccess('Export successful', `Exported ${backup.metadata.medicineCount} medicines and ${backup.metadata.batchCount} batches`);
    } catch (error) {
      showError('Export failed', 'Failed to export database');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCritical = async () => {
    setIsExporting(true);
    try {
      showInfo('Exporting critical data...', 'Preparing medicines and expiration data');
      const criticalData = await exportCriticalData();
      const date = new Date().toISOString().split('T')[0];
      downloadBackup(criticalData, `dfmrt-medicine-critical-${date}.json`);
      showSuccess('Critical export successful', 'Essential medicine and expiration data exported');
    } catch (error) {
      showError('Export failed', 'Failed to export critical data');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        showError('Invalid file type', 'Please select a JSON backup file');
        return;
      }
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      showError('No file selected', 'Please select a backup file to import');
      return;
    }

    setIsImporting(true);
    try {
      const text = await importFile.text();
      
      // Validate file first
      const validation = validateBackupFile(text);
      if (!validation.valid) {
        showError('Invalid backup file', validation.errors.join(', '));
        setIsImporting(false);
        return;
      }

      if (clearExisting) {
        showWarning('Clearing existing data...', 'This cannot be undone');
      }

      const result = await importDatabase(text, clearExisting);
      
      if (result.success) {
        showSuccess(
          'Import successful', 
          `Imported ${result.imported?.medicines || 0} medicines and ${result.imported?.batches || 0} batches`
        );
        // Reload the page to show new data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showError('Import failed', result.message);
        if (result.errors && result.errors.length > 0) {
          console.error('Import errors:', result.errors);
        }
      }
    } catch (error) {
      showError('Import failed', 'Failed to read or parse backup file');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="w-6 h-6 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Backup & Restore</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Export Database
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              Create a backup of your medicine inventory data
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleExportCritical}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileJson className="w-5 h-5 mr-2" />
                Export Critical Data (Medicines & Expiration)
              </button>
              
              <button
                onClick={handleExportFull}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-3 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Database className="w-5 h-5 mr-2" />
                Export Full Database (All Data)
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Critical Export:</strong> Contains medicines, quantities, and expiration dates - everything needed to rebuild inventory after a failure.
              </p>
              <p className="text-xs text-blue-800 mt-1">
                <strong>Full Export:</strong> Includes all data including movements, locations, and complete history.
              </p>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 mb-3 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Import Database
            </h3>
            <p className="text-green-700 text-sm mb-4">
              Restore data from a backup file
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Backup File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                />
                {importFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {importFile.name} selected
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="clearExisting"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="clearExisting" className="ml-2 text-sm text-gray-700">
                  Clear existing data before import
                </label>
              </div>

              <button
                onClick={handleImport}
                disabled={!importFile || isImporting}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Import Selected File
                  </>
                )}
              </button>
            </div>

            {clearExisting && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <strong>Warning:</strong> Clearing existing data will permanently delete all current medicines, batches, and stock information. This action cannot be undone.
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Important Notes:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Regular backups are recommended to prevent data loss</li>
              <li>• Store backup files in a secure location</li>
              <li>• Test restore functionality periodically</li>
              <li>• Keep multiple backup versions for safety</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import { InventoryPage } from './pages/InventoryPage';
import { StockOperationsPage } from './pages/StockOperationsPage';
import { KitsPage } from './pages/KitsPage';
import { ReportsPage } from './pages/ReportsPage';
import { Navigation } from './components/layout/Navigation';
import { initializeDatabase, db } from './services/db/database';
import { seedDatabase } from './services/db/seedData';
import { Database } from 'lucide-react';
import { DebugInfo } from './components/DebugInfo';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      

      console.log('Starting app initialization...');
      
      // Initialize database
      await initializeDatabase();
      
      // Check if we have data
      const medicineCount = await db.medicines.count();
      console.log(`Found ${medicineCount} medicines in database`);
      
      // If no medicines, seed the database
      if (medicineCount === 0) {
        console.log('No medicines found, seeding database...');
        await seedDatabase();
        
        // Verify seeding worked
        const newCount = await db.medicines.count();
        console.log(`After seeding: ${newCount} medicines found`);
      }
      
      setIsInitialized(true);
      console.log('App initialization completed successfully');
    } catch (err) {
      console.error('Failed to initialize app:', err);
      
      // Log additional debugging information
      console.log('Environment info:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        indexedDB: !!window.indexedDB,
        localStorage: !!window.localStorage
      });
      
      setError(err instanceof Error ? err.message : 'Failed to initialize application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReseed = async () => {
    if (!confirm('This will clear all existing data and reseed the database. Continue?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear and reseed
      await db.clearAllData();
      await db.initializeDefaults();
      await seedDatabase();
      
      // Refresh the page to reload everything
      window.location.reload();
    } catch (err) {
      console.error('Failed to reseed database:', err);
      setError(err instanceof Error ? err.message : 'Failed to reseed database');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Initialization Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-500 text-white py-2 px-4 rounded hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation onReseed={handleReseed} />
            
            <main>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/stock-operations" element={<StockOperationsPage />} />
                <Route path="/kits" element={<KitsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </main>
            
            <DebugInfo />
          </div>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
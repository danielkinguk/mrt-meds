import { useState, useEffect } from 'react';
import { db } from '../services/db/database';

export function DebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        indexedDB: !!window.indexedDB,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        databaseStatus: 'unknown'
      };

      try {
        // Test database connection
        const medicineCount = await db.medicines.count();
        info.databaseStatus = `connected (${medicineCount} medicines)`;
      } catch (error) {
        info.databaseStatus = `error: ${error instanceof Error ? error.message : 'unknown error'}`;
      }

      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 max-w-md text-xs z-50 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Information</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-xs">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}

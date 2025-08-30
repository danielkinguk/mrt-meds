import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Users, Database } from 'lucide-react';
import { ConnectionManager, SessionManager } from '../services/db/connectionManager';
import { ConcurrencyManager } from '../services/db/concurrencyManager';

export function ConnectionStatus() {
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStats, setConnectionStats] = useState({
    totalConnections: 0,
    activeConnections: 0,
    maxConnections: 10
  });
  const [lockStatus, setLockStatus] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  useEffect(() => {
    const updateStats = () => {
      const connectionManager = ConnectionManager.getInstance();
      const concurrencyManager = ConcurrencyManager.getInstance();
      
      setConnectionStats(connectionManager.getConnectionStats());
      setLockStatus(concurrencyManager.getLockStatus());
      setCurrentSessionId(SessionManager.getSessionId());
    };

    // Update stats immediately
    updateStats();

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded text-xs z-50 flex items-center space-x-1"
      >
        <Database className="w-3 h-3" />
        <span>Connections</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 max-w-sm text-xs z-50 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Connection Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      {/* Connection Statistics */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            Active Connections:
          </span>
          <span className={`font-mono ${
            connectionStats.activeConnections > connectionStats.maxConnections * 0.8 
              ? 'text-red-600' 
              : 'text-green-600'
          }`}>
            {connectionStats.activeConnections}/{connectionStats.maxConnections}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Total Connections:</span>
          <span className="font-mono">{connectionStats.totalConnections}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Current Session:</span>
          <span className="font-mono text-xs truncate max-w-24">
            {currentSessionId.slice(-8)}
          </span>
        </div>
      </div>

      {/* Active Locks */}
      {lockStatus.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Active Locks:</h4>
          <div className="space-y-1">
            {lockStatus.map((lock) => (
              <div key={lock.id} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-24">{lock.operation}</span>
                <span className="text-gray-500">
                  {new Date(lock.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Health */}
      <div className="flex items-center justify-between">
        <span>Status:</span>
        <span className="flex items-center">
          {connectionStats.activeConnections > 0 ? (
            <>
              <Wifi className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-500 mr-1" />
              <span className="text-red-600">Disconnected</span>
            </>
          )}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={() => {
            SessionManager.clearSession();
            window.location.reload();
          }}
          className="w-full px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          Reset Session
        </button>
      </div>
    </div>
  );
}

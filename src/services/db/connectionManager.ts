import { MRTMedsDatabase } from './database';
import type { Medicine, Batch, Item, Location, Movement, User, KitCheck, AuditLog, AppSettings } from '../../types';

// Validation utilities
function validateSessionId(sessionId: string): void {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID must be a non-empty string');
  }
  if (sessionId.length < 10 || sessionId.length > 100) {
    throw new Error('Session ID must be between 10 and 100 characters');
  }
  if (!/^[a-zA-Z0-9\-_]+$/.test(sessionId)) {
    throw new Error('Session ID contains invalid characters');
  }
}

export interface DatabaseConnection {
  id: string;
  db: MRTMedsDatabase;
  isInitialized: boolean;
  lastActivity: Date;
  sessionId: string;
}

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Map<string, DatabaseConnection> = new Map();
  private initializationPromise: Promise<void> | null = null;
  private readonly maxConnections = 10;
  private readonly connectionTimeout = 30 * 60 * 1000; // 30 minutes

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Get or create a database connection for a session
   */
  async getConnection(sessionId: string): Promise<DatabaseConnection> {
    // Validate session ID
    validateSessionId(sessionId);
    
    // Check if connection already exists and is still valid
    const existingConnection = this.connections.get(sessionId);
    if (existingConnection && this.isConnectionValid(existingConnection)) {
      existingConnection.lastActivity = new Date();
      return existingConnection;
    }

    // Clean up expired connections
    this.cleanupExpiredConnections();

    // Check connection limit
    if (this.connections.size >= this.maxConnections) {
      throw new Error('Maximum number of database connections reached');
    }

    // Create new connection
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const db = new MRTMedsDatabase();
    
    const connection: DatabaseConnection = {
      id: connectionId,
      db,
      isInitialized: false,
      lastActivity: new Date(),
      sessionId
    };

    this.connections.set(sessionId, connection);

    // Initialize the database connection
    await this.initializeConnection(connection);

    return connection;
  }

  /**
   * Initialize a database connection with proper locking
   */
  private async initializeConnection(connection: DatabaseConnection): Promise<void> {
    // Use a shared initialization promise to prevent race conditions
    if (!this.initializationPromise) {
      this.initializationPromise = this.performInitialization(connection);
    }

    await this.initializationPromise;
    connection.isInitialized = true;
  }

  /**
   * Perform actual database initialization with proper error handling
   */
  private async performInitialization(connection: DatabaseConnection): Promise<void> {
    try {
      console.log(`Initializing database connection ${connection.id}...`);
      
      // Check if IndexedDB is supported
      if (!window.indexedDB) {
        throw new Error('IndexedDB is not supported in this browser/environment');
      }

      // Open database connection with timeout
      const openPromise = connection.db.open();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 10000);
      });
      
      await Promise.race([openPromise, timeoutPromise]);
      console.log(`Database connection ${connection.id} opened successfully`);

      // Initialize defaults (this is safe to call multiple times)
      await connection.db.initializeDefaults();
      console.log(`Database connection ${connection.id} initialized successfully`);

    } catch (error) {
      console.error(`Failed to initialize database connection ${connection.id}:`, error);
      
      // Clean up failed connection
      this.connections.delete(connection.sessionId);
      
      // Reset initialization promise to allow retry
      this.initializationPromise = null;
      
      // Throw a more specific error
      if (error instanceof Error) {
        throw new Error(`Database initialization failed: ${error.message}`);
      } else {
        throw new Error('Database initialization failed with unknown error');
      }
    }
  }

  /**
   * Check if a connection is still valid (not expired)
   */
  private isConnectionValid(connection: DatabaseConnection): boolean {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime();
    return timeSinceLastActivity < this.connectionTimeout;
  }

  /**
   * Clean up expired connections
   */
  private cleanupExpiredConnections(): void {
    const now = new Date();
    for (const [sessionId, connection] of this.connections.entries()) {
      if (!this.isConnectionValid(connection)) {
        console.log(`Cleaning up expired connection ${connection.id}`);
        this.connections.delete(sessionId);
      }
    }
  }

  /**
   * Close a specific connection
   */
  async closeConnection(sessionId: string): Promise<void> {
    // Validate session ID
    validateSessionId(sessionId);
    
    const connection = this.connections.get(sessionId);
    if (connection) {
      try {
        await connection.db.close();
        console.log(`Closed database connection ${connection.id}`);
      } catch (error) {
        console.error(`Error closing database connection ${connection.id}:`, error);
      } finally {
        this.connections.delete(sessionId);
      }
    }
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.keys()).map(sessionId => 
      this.closeConnection(sessionId)
    );
    await Promise.all(closePromises);
    
    // Clear all connections and reset initialization
    this.connections.clear();
    this.initializationPromise = null;
  }

  /**
   * Clean up resources and reset state
   */
  async cleanup(): Promise<void> {
    try {
      await this.closeAllConnections();
      console.log('ConnectionManager cleanup completed');
    } catch (error) {
      console.error('Error during ConnectionManager cleanup:', error);
      // Force cleanup even if some connections fail to close
      this.connections.clear();
      this.initializationPromise = null;
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    maxConnections: number;
  } {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => this.isConnectionValid(conn)).length;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      maxConnections: this.maxConnections
    };
  }

  /**
   * Reset initialization promise (useful for testing or manual reset)
   */
  resetInitialization(): void {
    this.initializationPromise = null;
  }
}

// Global cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const manager = ConnectionManager.getInstance();
    manager.cleanup().catch(error => {
      console.error('Error during page unload cleanup:', error);
    });
  });
}

// Session management utilities
export class SessionManager {
  private static sessionId: string | null = null;

  static getSessionId(): string {
    if (!this.sessionId) {
      // Generate a unique session ID
      this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store in sessionStorage for persistence across page reloads
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('mrt-meds-session-id', this.sessionId);
      }
    }
    return this.sessionId;
  }

  static restoreSessionId(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('mrt-meds-session-id');
      if (stored) {
        this.sessionId = stored;
        return stored;
      }
    }
    return null;
  }

  static clearSession(): void {
    this.sessionId = null;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('mrt-meds-session-id');
    }
  }
}

// Convenience function to get database connection
export async function getDatabaseConnection(): Promise<MRTMedsDatabase> {
  const sessionId = SessionManager.getSessionId();
  const connectionManager = ConnectionManager.getInstance();
  const connection = await connectionManager.getConnection(sessionId);
  return connection.db;
}

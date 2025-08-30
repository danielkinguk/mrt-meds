import { getDatabaseConnection, SessionManager } from './connectionManager';
import type { Medicine } from '../../types';

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

function validateOperationName(operation: string): void {
  if (!operation || typeof operation !== 'string') {
    throw new Error('Operation name must be a non-empty string');
  }
  if (operation.length < 1 || operation.length > 50) {
    throw new Error('Operation name must be between 1 and 50 characters');
  }
  if (!/^[a-zA-Z0-9\-_]+$/.test(operation)) {
    throw new Error('Operation name contains invalid characters');
  }
}

export interface OperationLock {
  id: string;
  operation: string;
  timestamp: Date;
  sessionId: string;
}

export class ConcurrencyManager {
  private static instance: ConcurrencyManager;
  private activeLocks: Map<string, OperationLock> = new Map();
  private readonly lockTimeout = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ConcurrencyManager {
    if (!ConcurrencyManager.instance) {
      ConcurrencyManager.instance = new ConcurrencyManager();
    }
    return ConcurrencyManager.instance;
  }

  /**
   * Acquire a lock for a specific operation
   */
  async acquireLock(operation: string, sessionId: string): Promise<string> {
    // Validate inputs
    validateOperationName(operation);
    validateSessionId(sessionId);
    
    const lockId = `${operation}-${sessionId}-${Date.now()}`;
    
    // Check if operation is already locked
    const existingLock = this.activeLocks.get(operation);
    if (existingLock && this.isLockValid(existingLock)) {
      if (existingLock.sessionId !== sessionId) {
        throw new Error(`Operation ${operation} is currently locked by another session`);
      }
    }

    // Clean up expired locks
    this.cleanupExpiredLocks();

    // Create new lock
    const lock: OperationLock = {
      id: lockId,
      operation,
      timestamp: new Date(),
      sessionId
    };

    this.activeLocks.set(operation, lock);
    console.log(`Lock acquired: ${operation} by session ${sessionId}`);
    
    return lockId;
  }

  /**
   * Release a lock
   */
  releaseLock(operation: string, sessionId: string): void {
    // Validate inputs
    validateOperationName(operation);
    validateSessionId(sessionId);
    
    const lock = this.activeLocks.get(operation);
    if (lock && lock.sessionId === sessionId) {
      this.activeLocks.delete(operation);
      console.log(`Lock released: ${operation} by session ${sessionId}`);
    }
  }

  /**
   * Check if a lock is still valid
   */
  private isLockValid(lock: OperationLock): boolean {
    const now = new Date();
    const timeSinceLock = now.getTime() - lock.timestamp.getTime();
    return timeSinceLock < this.lockTimeout;
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    for (const [operation, lock] of this.activeLocks.entries()) {
      if (!this.isLockValid(lock)) {
        this.activeLocks.delete(operation);
        console.log(`Expired lock cleaned up: ${operation}`);
      }
    }
  }

  /**
   * Get current lock status
   */
  getLockStatus(): OperationLock[] {
    return Array.from(this.activeLocks.values());
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalLocks: number;
    activeLocks: number;
    maxLocks: number;
  } {
    const activeLocks = Array.from(this.activeLocks.values())
      .filter(lock => this.isLockValid(lock)).length;

    return {
      totalLocks: this.activeLocks.size,
      activeLocks,
      maxLocks: 50 // Configurable limit
    };
  }
}

/**
 * Decorator for database operations that require concurrency protection
 */
export function withConcurrencyProtection(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const concurrencyManager = ConcurrencyManager.getInstance();
      const sessionId = SessionManager.getSessionId();
      
      let lockId: string | null = null;
      
      try {
        // Acquire lock
        lockId = await concurrencyManager.acquireLock(operation, sessionId);
        
        // Execute the original method
        const result = await method.apply(this, args);
        
        return result;
      } finally {
        // Always release the lock
        if (lockId) {
          concurrencyManager.releaseLock(operation, sessionId);
        }
      }
    };
  };
}

/**
 * Higher-order function for concurrency protection
 */
export function withLock<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const concurrencyManager = ConcurrencyManager.getInstance();
    const sessionId = SessionManager.getSessionId();
    
    let lockId: string | null = null;
    
    try {
      // Acquire lock
      lockId = await concurrencyManager.acquireLock(operation, sessionId);
      
      // Execute the function
      const result = await fn(...args);
      
      return result;
    } finally {
      // Always release the lock
      if (lockId) {
        concurrencyManager.releaseLock(operation, sessionId);
      }
    }
  };
}

/**
 * Safe database operations with concurrency protection
 */
export class SafeDatabaseOperations {
  /**
   * Safe seeding operation with concurrency protection
   */
  static seedDatabase = withLock('seed-database', async (): Promise<{
    medicines: number;
    batches: number;
    items: number;
    locations: number;
  }> => {
    const { seedDatabase } = await import('./seedData');
    return await seedDatabase();
  });

  /**
   * Safe clear all data operation with concurrency protection
   */
  static clearAllData = withLock('clear-all-data', async (): Promise<void> => {
    const db = await getDatabaseConnection();
    return await db.clearAllData();
  });

  /**
   * Safe bulk operations with concurrency protection
   */
  static bulkAddMedicines = withLock('bulk-add-medicines', async (medicines: Omit<Medicine, 'id'>[]): Promise<string[]> => {
    const db = await getDatabaseConnection();
    return await db.medicines.bulkAdd(medicines);
  });

  /**
   * Safe bulk operations with concurrency protection
   */
  static bulkUpdateMedicines = withLock('bulk-update-medicines', async (updates: Medicine[]): Promise<string[]> => {
    const db = await getDatabaseConnection();
    return await db.medicines.bulkPut(updates);
  });
}

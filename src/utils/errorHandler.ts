export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific error types
    if (error instanceof DatabaseError) {
      return `Database error: ${error.message}`;
    }
    if (error instanceof ValidationError) {
      return `Validation error: ${error.message}`;
    }
    if (error instanceof NetworkError) {
      return `Network error: ${error.message}`;
    }
    
    // Handle Dexie errors
    if (error.name === 'QuotaExceededError') {
      return 'Storage quota exceeded. Please clear some data and try again.';
    }
    if (error.name === 'DataError') {
      return 'Invalid data format. Please check your input and try again.';
    }
    if (error.name === 'ConstraintError') {
      return 'This operation violates a database constraint. Please check for duplicates.';
    }
    if (error.name === 'NotFoundError') {
      return 'The requested item was not found.';
    }
    
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}]${context ? ` [${context}]` : ''} Error:`, error);
  
  // In production, you would send this to an error tracking service
  if (import.meta.env.PROD) {
    // Send to error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error, { context });
  }
}

export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, 'Database Operation');
    throw new DatabaseError(errorMessage, error);
  }
}
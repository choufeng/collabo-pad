/**
 * Database Error Handling Utilities
 *
 * This module provides comprehensive error handling for database operations,
 * including custom error classes, retry mechanisms, and circuit breaker patterns.
 */

export const ERROR_CODES = {
  // Connection errors
  CONNECTION_ERROR: "CONNECTION_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // Query errors
  QUERY_ERROR: "QUERY_ERROR",
  SYNTAX_ERROR: "SYNTAX_ERROR",

  // Data validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",

  // Permission errors
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // System errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Custom Database Error class with structured error information
 */
export class DatabaseError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly name = "DatabaseError";

  constructor(
    message: string,
    code: ErrorCode = ERROR_CODES.UNKNOWN_ERROR,
    details?: any,
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  /**
   * Check if this is a transient error that might be resolved by retrying
   */
  isTransient(): boolean {
    return isTransientError(this.code);
  }
}

/**
 * Type guard to check if an error is a DatabaseError
 */
export function isDatabaseError(error: any): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Convert various error types to DatabaseError with proper error codes
 */
export function handleDatabaseError(error: any): DatabaseError {
  // If it's already a DatabaseError, return it
  if (isDatabaseError(error)) {
    return error;
  }

  // Handle PostgreSQL specific errors
  if (error && typeof error === "object") {
    const message = error.message || error.toString();
    const pgCode = error.code;

    // PostgreSQL error codes
    if (pgCode) {
      switch (pgCode) {
        case "23505": // unique_violation
          return new DatabaseError(
            `Duplicate entry: ${message}`,
            ERROR_CODES.DUPLICATE_ENTRY,
            { originalError: error },
          );

        case "23503": // foreign_key_violation
          return new DatabaseError(
            `Foreign key violation: ${message}`,
            ERROR_CODES.FOREIGN_KEY_VIOLATION,
            { originalError: error },
          );

        case "23502": // not_null_violation
        case "23514": // check_violation
          return new DatabaseError(
            `Validation error: ${message}`,
            ERROR_CODES.VALIDATION_ERROR,
            { originalError: error },
          );

        case "42703": // undefined_column
        case "42883": // undefined_function
          return new DatabaseError(
            `Query error: ${message}`,
            ERROR_CODES.QUERY_ERROR,
            { originalError: error },
          );

        case "42501": // insufficient_privilege
          return new DatabaseError(
            `Permission denied: ${message}`,
            ERROR_CODES.PERMISSION_DENIED,
            { originalError: error },
          );
      }
    }

    // Handle timeout errors first to take precedence over connection errors
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes("timeout") ||
      lowerMessage.includes("timed out")
    ) {
      return new DatabaseError(
        `Timeout error: ${message}`,
        ERROR_CODES.TIMEOUT_ERROR,
        { originalError: error },
      );
    }

    // Handle connection errors
    if (
      lowerMessage.includes("connection") ||
      lowerMessage.includes("connect") ||
      lowerMessage.includes("econnrefused") ||
      lowerMessage.includes("enotfound")
    ) {
      return new DatabaseError(
        `Connection error: ${message}`,
        ERROR_CODES.CONNECTION_ERROR,
        { originalError: error },
      );
    }

    // Handle permission errors
    if (
      lowerMessage.includes("permission denied") ||
      lowerMessage.includes("access denied")
    ) {
      return new DatabaseError(
        `Permission denied: ${message}`,
        ERROR_CODES.PERMISSION_DENIED,
        { originalError: error },
      );
    }
  }

  // Handle generic errors
  const message =
    error?.message || error?.toString() || "Unknown database error";

  // Try to categorize the error based on the message
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("not found")) {
    return new DatabaseError(message, ERROR_CODES.NOT_FOUND, {
      originalError: error,
    });
  }

  if (lowerMessage.includes("connection") || lowerMessage.includes("timeout")) {
    return new DatabaseError(message, ERROR_CODES.CONNECTION_ERROR, {
      originalError: error,
    });
  }

  // Default to unknown error
  return new DatabaseError(message, ERROR_CODES.UNKNOWN_ERROR, {
    originalError: error,
  });
}

/**
 * Create a new DatabaseError with optional context
 */
export function createDatabaseError(
  message: string,
  code: ErrorCode = ERROR_CODES.UNKNOWN_ERROR,
  context?: any,
): DatabaseError {
  return new DatabaseError(message, code, context);
}

/**
 * Check if an error code represents a transient error that might be resolved by retrying
 */
export function isTransientError(code: ErrorCode): boolean {
  const transientCodes = [
    ERROR_CODES.CONNECTION_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
  ];

  return transientCodes.includes(code);
}

/**
 * Retry mechanism for database operations
 */
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffMultiplier = 2,
    maxDelay = 30000,
    shouldRetry = (error, attempt) => {
      const dbError = handleDatabaseError(error);
      return dbError.isTransient() && attempt < maxAttempts;
    },
  } = options;

  let lastError: any;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw handleDatabaseError(error);
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, currentDelay));

      // Update delay for next attempt
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw handleDatabaseError(lastError);
}

/**
 * Circuit Breaker pattern for preventing cascade failures
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

export class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly monitoringPeriod: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
  }

  get currentState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
    return this.state;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
      } else {
        throw new DatabaseError(
          "Circuit breaker is OPEN - operation not allowed",
          ERROR_CODES.CONNECTION_ERROR,
          { state: this.state, failureCount: this.failureCount },
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      // Single success in HALF_OPEN state should close the circuit
      this.reset();
    } else {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.state === "HALF_OPEN" ||
      this.failureCount >= this.failureThreshold
    ) {
      this.state = "OPEN";
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime > this.resetTimeout;
  }

  private reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
    };
  }
}

/**
 * Database health check utility
 */
export interface HealthCheckOptions {
  timeout?: number;
  retries?: number;
}

export async function checkDatabaseHealth(
  healthCheck: () => Promise<boolean>,
  options: HealthCheckOptions = {},
): Promise<{ healthy: boolean; details: any }> {
  const { timeout = 5000, retries = 2 } = options;

  try {
    const healthy = await withRetry(healthCheck, {
      maxAttempts: retries + 1,
      delay: 100,
    });

    return {
      healthy,
      details: {
        timestamp: new Date(),
        attempts: retries + 1,
        timeout,
      },
    };
  } catch (error) {
    return {
      healthy: false,
      details: {
        timestamp: new Date(),
        error: handleDatabaseError(error).toJSON(),
        attempts: retries + 1,
        timeout,
      },
    };
  }
}

/**
 * Default circuit breaker instance for database operations
 */
export const defaultCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
});

/**
 * Execute operation with default circuit breaker
 */
export function withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
  return defaultCircuitBreaker.execute(operation);
}

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

describe("DatabaseError Handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      DATABASE_URL:
        "postgresql://postgres:postgres_dev@localhost:9198/collabo_pad_db?schema=public",
    };
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  it("should have DatabaseError class available", () => {
    expect(() => {
      require("../../utils/DatabaseError");
    }).not.toThrow();
  });

  it("should export DatabaseError as a class", async () => {
    const { DatabaseError } = require("../../utils/DatabaseError");

    expect(DatabaseError).toBeDefined();
    expect(typeof DatabaseError).toBe("function");

    const error = new DatabaseError("Test error", "CONNECTION_ERROR");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DatabaseError);
  });

  it("should create DatabaseError with proper structure", async () => {
    const { DatabaseError } = require("../../utils/DatabaseError");

    const message = "Database connection failed";
    const code = "CONNECTION_ERROR";
    const details = { host: "localhost", port: 5432 };

    const error = new DatabaseError(message, code, details);

    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
    expect(error.details).toBe(details);
    expect(error.name).toBe("DatabaseError");
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it("should serialize error to JSON correctly", async () => {
    const { DatabaseError } = require("../../utils/DatabaseError");

    const message = "Query failed";
    const code = "QUERY_ERROR";
    const details = { query: "SELECT * FROM topics" };

    const error = new DatabaseError(message, code, details);
    const json = error.toJSON();

    expect(json).toEqual({
      name: "DatabaseError",
      message,
      code,
      details,
      timestamp: error.timestamp,
    });
  });

  it("should handle different error codes", async () => {
    const { DatabaseError, ERROR_CODES } = require("../../utils/DatabaseError");

    expect(ERROR_CODES).toBeDefined();
    expect(typeof ERROR_CODES).toBe("object");

    // Test common error codes
    const testCases = [
      ERROR_CODES.CONNECTION_ERROR,
      ERROR_CODES.QUERY_ERROR,
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.NOT_FOUND,
      ERROR_CODES.DUPLICATE_ENTRY,
      ERROR_CODES.FOREIGN_KEY_VIOLATION,
      ERROR_CODES.TIMEOUT_ERROR,
      ERROR_CODES.PERMISSION_DENIED,
    ];

    testCases.forEach((code) => {
      const error = new DatabaseError(`Test ${code}`, code);
      expect(error.code).toBe(code);
    });
  });

  it("should have error handler utility functions", async () => {
    const {
      DatabaseError,
      isDatabaseError,
      handleDatabaseError,
      createDatabaseError,
    } = require("../../utils/DatabaseError");

    expect(typeof isDatabaseError).toBe("function");
    expect(typeof handleDatabaseError).toBe("function");
    expect(typeof createDatabaseError).toBe("function");
  });

  it("should identify DatabaseError instances correctly", async () => {
    const {
      DatabaseError,
      isDatabaseError,
    } = require("../../utils/DatabaseError");

    const dbError = new DatabaseError("Test", "CONNECTION_ERROR");
    const regularError = new Error("Regular error");
    const customError = { code: "CUSTOM", message: "Custom error" };

    expect(isDatabaseError(dbError)).toBe(true);
    expect(isDatabaseError(regularError)).toBe(false);
    expect(isDatabaseError(customError)).toBe(false);
    expect(isDatabaseError(null)).toBe(false);
    expect(isDatabaseError(undefined)).toBe(false);
  });

  it("should handle PostgreSQL error conversion", async () => {
    const {
      handleDatabaseError,
      DatabaseError,
      ERROR_CODES,
    } = require("../../utils/DatabaseError");

    // Test PostgreSQL specific errors
    const testCases = [
      {
        input: new Error("connection failed"),
        expectedCode: ERROR_CODES.CONNECTION_ERROR,
      },
      {
        input: new Error("connection timeout"),
        expectedCode: ERROR_CODES.TIMEOUT_ERROR,
      },
      {
        input: {
          code: "23505",
          message: "duplicate key value violates unique constraint",
        },
        expectedCode: ERROR_CODES.DUPLICATE_ENTRY,
      },
      {
        input: { code: "23503", message: "violates foreign key constraint" },
        expectedCode: ERROR_CODES.FOREIGN_KEY_VIOLATION,
      },
      {
        input: { code: "23502", message: "null value in column" },
        expectedCode: ERROR_CODES.VALIDATION_ERROR,
      },
      {
        input: { code: "42703", message: "column does not exist" },
        expectedCode: ERROR_CODES.QUERY_ERROR,
      },
      {
        input: new Error("permission denied"),
        expectedCode: ERROR_CODES.PERMISSION_DENIED,
      },
      {
        input: new Error("unknown error"),
        expectedCode: ERROR_CODES.UNKNOWN_ERROR,
      },
    ];

    testCases.forEach(({ input, expectedCode }) => {
      const result = handleDatabaseError(input);
      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.code).toBe(expectedCode);
    });
  });

  it("should create database errors with context", async () => {
    const {
      createDatabaseError,
      DatabaseError,
    } = require("../../utils/DatabaseError");

    const context = {
      operation: "create",
      table: "topics",
      userId: "user-123",
    };

    const error = createDatabaseError(
      "Failed to create topic",
      "OPERATION_ERROR",
      context,
    );

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.message).toBe("Failed to create topic");
    expect(error.code).toBe("OPERATION_ERROR");
    expect(error.details).toEqual(context);
  });

  it("should have retry mechanism for transient errors", async () => {
    const {
      withRetry,
      isTransientError,
      ERROR_CODES,
    } = require("../../utils/DatabaseError");

    expect(typeof withRetry).toBe("function");
    expect(typeof isTransientError).toBe("function");

    // Test transient error identification
    expect(isTransientError(ERROR_CODES.CONNECTION_ERROR)).toBe(true);
    expect(isTransientError(ERROR_CODES.TIMEOUT_ERROR)).toBe(true);
    expect(isTransientError(ERROR_CODES.QUERY_ERROR)).toBe(false);
    expect(isTransientError(ERROR_CODES.VALIDATION_ERROR)).toBe(false);
  });

  it("should retry operations on transient errors", async () => {
    const {
      withRetry,
      DatabaseError,
      ERROR_CODES,
    } = require("../../utils/DatabaseError");

    let attemptCount = 0;
    const mockOperation = jest.fn(() => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new DatabaseError(
          "Connection failed",
          ERROR_CODES.CONNECTION_ERROR,
        );
      }
      return "success";
    });

    const result = await withRetry(mockOperation, {
      maxAttempts: 3,
      delay: 10,
    });

    expect(result).toBe("success");
    expect(attemptCount).toBe(3);
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it("should fail after max retry attempts", async () => {
    const {
      withRetry,
      DatabaseError,
      ERROR_CODES,
    } = require("../../utils/DatabaseError");

    const mockOperation = jest.fn(() => {
      throw new DatabaseError(
        "Persistent connection error",
        ERROR_CODES.CONNECTION_ERROR,
      );
    });

    await expect(
      withRetry(mockOperation, { maxAttempts: 2, delay: 10 }),
    ).rejects.toThrow("Persistent connection error");

    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it("should not retry on non-transient errors", async () => {
    const {
      withRetry,
      DatabaseError,
      ERROR_CODES,
    } = require("../../utils/DatabaseError");

    const mockOperation = jest.fn(() => {
      throw new DatabaseError(
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
      );
    });

    await expect(
      withRetry(mockOperation, { maxAttempts: 3, delay: 10 }),
    ).rejects.toThrow("Validation failed");

    expect(mockOperation).toHaveBeenCalledTimes(1); // Should not retry
  });

  it("should handle connection health check", async () => {
    const {
      checkDatabaseHealth,
      CircuitBreaker,
    } = require("../../utils/DatabaseError");

    expect(typeof checkDatabaseHealth).toBe("function");
    expect(typeof CircuitBreaker).toBe("function");
  });

  it("should implement circuit breaker pattern", async () => {
    const {
      CircuitBreaker,
      DatabaseError,
      ERROR_CODES,
    } = require("../../utils/DatabaseError");

    const mockOperation = jest.fn(() => {
      throw new DatabaseError(
        "Connection failed",
        ERROR_CODES.CONNECTION_ERROR,
      );
    });

    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 100, // 100ms for testing
    });

    // First failure - should allow operation, but not open yet
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
    expect(circuitBreaker.currentState).toBe("CLOSED");

    // Second failure - should open the circuit breaker
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
    expect(circuitBreaker.currentState).toBe("OPEN");

    // Third failure while open - should fail immediately
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
    expect(mockOperation).toHaveBeenCalledTimes(2); // Should not execute on third attempt

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should be half-open and allow one operation
    const successOperation = jest.fn(() => "success");
    const result = await circuitBreaker.execute(successOperation);

    expect(result).toBe("success");
    expect(circuitBreaker.currentState).toBe("CLOSED");
  });
});

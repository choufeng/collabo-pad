import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

describe("Database Connection", () => {
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

  it("should create database connection instance", async () => {
    const { getDatabaseConnection } = require("../../database/db");

    expect(() => {
      getDatabaseConnection();
    }).not.toThrow();
  });

  it("should return the same connection instance (singleton)", async () => {
    const { getDatabaseConnection } = require("../../database/db");

    const connection1 = getDatabaseConnection();
    const connection2 = getDatabaseConnection();

    expect(connection1).toBe(connection2);
  });

  it("should throw error for invalid database URL", async () => {
    process.env.DATABASE_URL = "invalid-url";

    // Reset any existing connection
    const {
      resetDatabaseConnection,
      getDatabaseConnection,
    } = require("../../database/db");
    resetDatabaseConnection();

    expect(() => {
      getDatabaseConnection();
    }).toThrow();
  });

  it("should validate connection can be established", async () => {
    const { getDatabaseConnection } = require("../../database/db");
    const connection = getDatabaseConnection();

    // Test that connection has expected Drizzle methods
    expect(typeof connection.select).toBe("function");
    expect(typeof connection.insert).toBe("function");
    expect(typeof connection.update).toBe("function");
    expect(typeof connection.delete).toBe("function");
    expect(typeof connection.query).toBe("object"); // In Drizzle, query is an object with methods
  });
});

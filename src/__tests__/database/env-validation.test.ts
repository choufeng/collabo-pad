import { describe, it, expect, beforeEach } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  it("should validate required database environment variables", () => {
    // Set valid environment variables
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.POSTGRES_URL = "postgresql://test:test@localhost:5432/test";

    const { validateDatabaseEnv } = require("../../lib/validation");
    const result = validateDatabaseEnv();

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return errors for missing DATABASE_URL", () => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL; // Remove fallback too

    const { validateDatabaseEnv } = require("../../lib/validation");
    const result = validateDatabaseEnv();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("DATABASE_URL is required");
  });

  it("should return errors for invalid DATABASE_URL format", () => {
    process.env.DATABASE_URL = "invalid-url";
    process.env.POSTGRES_URL = "postgresql://test:test@localhost:5432/test";

    const { validateDatabaseEnv } = require("../../lib/validation");
    const result = validateDatabaseEnv();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "DATABASE_URL must be a valid PostgreSQL connection string",
    );
  });

  it("should accept fallback to POSTGRES_URL when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    process.env.POSTGRES_URL = "postgresql://test:test@localhost:5432/test";

    const { validateDatabaseEnv } = require("../../lib/validation");
    const result = validateDatabaseEnv();

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate PostgreSQL connection string components", () => {
    process.env.DATABASE_URL = "postgresql://user:password@host:5432/database";

    const { validateDatabaseEnv } = require("../../lib/validation");
    const result = validateDatabaseEnv();

    expect(result.isValid).toBe(true);
    expect(result.config).toEqual({
      host: "host",
      port: "5432",
      database: "database",
      user: "user",
      password: "password",
    });
  });
});

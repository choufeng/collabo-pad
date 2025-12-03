import { describe, it, expect } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

describe("Drizzle ORM Installation", () => {
  it("should import drizzle-orm successfully", () => {
    expect(() => {
      require("drizzle-orm");
    }).not.toThrow();
  });

  it("should import pg driver successfully", () => {
    expect(() => {
      require("pg");
    }).not.toThrow();
  });

  it("should import drizzle-kit successfully", () => {
    expect(() => {
      require("drizzle-kit");
    }).not.toThrow();
  });

  it("should have drizzle-orm types available", () => {
    const nodePgModule = require("drizzle-orm/node-postgres");
    expect(nodePgModule).toBeDefined();
    expect(nodePgModule.drizzle).toBeDefined();
    expect(typeof nodePgModule.drizzle).toBe("function");
  });

  it("should have PostgreSQL specific imports available", () => {
    const { pgTable, uuid, text, integer } = require("drizzle-orm/pg-core");
    expect(typeof pgTable).toBe("function");
    expect(typeof uuid).toBe("function");
    expect(typeof text).toBe("function");
    expect(typeof integer).toBe("function");
  });

  it("should have SQL operators available", () => {
    const { eq, and, or, like } = require("drizzle-orm");
    expect(typeof eq).toBe("function");
    expect(typeof and).toBe("function");
    expect(typeof or).toBe("function");
    expect(typeof like).toBe("function");
  });
});

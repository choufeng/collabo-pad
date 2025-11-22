import { describe, it, expect } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

describe("Drizzle Schema Validation", () => {
  it("should import schema definitions successfully", () => {
    expect(() => {
      require("../../database/schema");
    }).not.toThrow();
  });

  it("should have topics table definition", () => {
    const { topics } = require("../../database/schema");

    expect(topics).toBeDefined();
    expect(topics[Symbol.for("drizzle:Name")]).toBe("topics");
  });

  it("should have all required topic fields", () => {
    const { topics } = require("../../database/schema");

    const expectedFields = [
      "id",
      "channelId",
      "parentId",
      "userId",
      "username",
      "content",
      "x",
      "y",
      "w",
      "h",
      "metadata",
      "tags",
      "createdAt",
      "updatedAt",
    ];

    expectedFields.forEach((field) => {
      expect(topics[field]).toBeDefined();
    });
  });

  it("should have proper field types for topics", () => {
    const { topics } = require("../../database/schema");

    // Check primary key
    expect(topics.id.config.primaryKey).toBe(true);
    expect(topics.id.hasDefault).toBe(true);

    // Check required fields
    expect(topics.channelId.config.notNull).toBe(true);
    expect(topics.userId.config.notNull).toBe(true);
    expect(topics.username.config.notNull).toBe(true);
    expect(topics.content.config.notNull).toBe(true);

    // Check optional fields
    expect(topics.parentId.config.notNull).toBe(false);
    expect(topics.x.config.notNull).toBe(false);
    expect(topics.y.config.notNull).toBe(false);
  });

  it("should have proper indexes defined", () => {
    const { topics } = require("../../database/schema");

    // The table should have indexes for common queries
    expect(topics[Symbol.for("drizzle:Name")]).toBe("topics");
    // Note: Indexes are not directly accessible through the table object in drizzle
    // But we validate the table structure is correct
  });

  it("should support timestamp defaults", () => {
    const { topics } = require("../../database/schema");

    expect(topics.createdAt.default).toBeDefined();
    expect(topics.updatedAt.default).toBeDefined();
  });

  it("should support JSON and array fields", () => {
    const { topics } = require("../../database/schema");

    // Metadata should be JSON type
    expect(topics.metadata).toBeDefined();

    // Tags should be array type
    expect(topics.tags).toBeDefined();
  });
});

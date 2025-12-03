import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

describe("Database Seed Data", () => {
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

  it("should have seed data script available", () => {
    expect(() => {
      require("../../database/seed");
    }).not.toThrow();
  });

  it("should export seed data functions", async () => {
    const seedModule = require("../../database/seed");

    expect(seedModule.seedTopics).toBeDefined();
    expect(typeof seedModule.seedTopics).toBe("function");
    expect(seedModule.generateTestTopics).toBeDefined();
    expect(typeof seedModule.generateTestTopics).toBe("function");
  });

  it("should generate valid test topics data", async () => {
    const { generateTestTopics } = require("../../database/seed");
    const testTopics = generateTestTopics();

    expect(Array.isArray(testTopics)).toBe(true);
    expect(testTopics.length).toBeGreaterThan(0);

    // Validate topic structure
    testTopics.forEach((topic) => {
      expect(topic).toHaveProperty("channelId");
      expect(topic).toHaveProperty("userId");
      expect(topic).toHaveProperty("username");
      expect(topic).toHaveProperty("content");
      expect(topic).toHaveProperty("x");
      expect(topic).toHaveProperty("y");
      expect(topic).toHaveProperty("w");
      expect(topic).toHaveProperty("h");

      // Validate data types
      expect(typeof topic.channelId).toBe("string");
      expect(typeof topic.userId).toBe("string");
      expect(typeof topic.username).toBe("string");
      expect(typeof topic.content).toBe("string");
      expect(typeof topic.x).toBe("string");
      expect(typeof topic.y).toBe("string");
      expect(typeof topic.w).toBe("string");
      expect(typeof topic.h).toBe("string");

      // Validate UUID format
      expect(topic.channelId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(topic.userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  it("should generate topics with valid spatial coordinates", async () => {
    const { generateTestTopics } = require("../../database/seed");
    const testTopics = generateTestTopics();

    testTopics.forEach((topic) => {
      // Convert string decimals to numbers for validation
      const x = parseFloat(topic.x);
      const y = parseFloat(topic.y);
      const w = parseFloat(topic.w);
      const h = parseFloat(topic.h);

      // Validate that coordinates are within reasonable bounds
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);

      // Validate decimal precision
      expect(x.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      expect(y.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      expect(w.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      expect(h.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    });
  });

  it("should generate topics with hierarchical relationships", async () => {
    const { generateTestTopics } = require("../../database/seed");
    const testTopics = generateTestTopics();

    // Should have some topics with parent_id and some without
    const topicsWithParent = testTopics.filter((topic) => topic.parentId);
    const topicsWithoutParent = testTopics.filter((topic) => !topic.parentId);

    expect(topicsWithParent.length).toBeGreaterThan(0);
    expect(topicsWithoutParent.length).toBeGreaterThan(0);

    // Validate parent-child relationships
    topicsWithParent.forEach((topic) => {
      expect(topic.parentId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      // Parent ID should reference another topic in the dataset
      const parentExists = testTopics.some((t) => t.id === topic.parentId);
      expect(parentExists).toBe(true);
    });
  });

  it("should generate topics with varied content and metadata", async () => {
    const { generateTestTopics } = require("../../database/seed");
    const testTopics = generateTestTopics();

    // Should have topics with different content
    const uniqueContents = new Set(testTopics.map((topic) => topic.content));
    expect(uniqueContents.size).toBeGreaterThan(1);

    // Should have topics with metadata and tags
    const topicsWithMetadata = testTopics.filter((topic) => topic.metadata);
    const topicsWithTags = testTopics.filter(
      (topic) => topic.tags && topic.tags.length > 0,
    );

    expect(topicsWithMetadata.length).toBeGreaterThan(0);
    expect(topicsWithTags.length).toBeGreaterThan(0);

    // Validate metadata structure
    topicsWithMetadata.forEach((topic) => {
      expect(typeof topic.metadata).toBe("object");
      expect(topic.metadata).not.toBeNull();
    });

    // Validate tags structure
    topicsWithTags.forEach((topic) => {
      expect(Array.isArray(topic.tags)).toBe(true);
      topic.tags.forEach((tag) => {
        expect(typeof tag).toBe("string");
      });
    });
  });

  it("should have valid usernames and user content", async () => {
    const { generateTestTopics } = require("../../database/seed");
    const testTopics = generateTestTopics();

    testTopics.forEach((topic) => {
      // Username should be non-empty string
      expect(topic.username).toBeTruthy();
      expect(typeof topic.username).toBe("string");
      expect(topic.username.length).toBeGreaterThan(0);

      // Content should be meaningful
      expect(topic.content).toBeTruthy();
      expect(typeof topic.content).toBe("string");
      expect(topic.content.length).toBeGreaterThan(0);
      expect(topic.content.length).toBeLessThan(1000); // Reasonable length limit
    });
  });

  it("should support configurable seed data generation", async () => {
    const { generateTestTopics } = require("../../database/seed");

    // Test with custom parameters
    const smallDataset = generateTestTopics(3);
    const mediumDataset = generateTestTopics(10);
    const largeDataset = generateTestTopics(50);

    expect(smallDataset).toHaveLength(3);
    expect(mediumDataset).toHaveLength(10);
    expect(largeDataset).toHaveLength(50);

    // All datasets should maintain valid structure
    [smallDataset, mediumDataset, largeDataset].forEach((dataset) => {
      dataset.forEach((topic) => {
        expect(topic).toHaveProperty("id");
        expect(topic).toHaveProperty("channelId");
        expect(topic).toHaveProperty("content");
      });
    });
  });
});

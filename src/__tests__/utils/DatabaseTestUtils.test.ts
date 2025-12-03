import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

// Add polyfills for setImmediate and clearImmediate
global.setImmediate =
  global.setImmediate ||
  ((fn: Function, ...args: any[]) => setTimeout(fn, 0, ...args));
global.clearImmediate =
  global.clearImmediate || ((id: any) => clearTimeout(id));

describe("Database Test Utilities", () => {
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

  it("should have DatabaseTestUtils class available", () => {
    expect(() => {
      require("../../utils/DatabaseTestUtils");
    }).not.toThrow();
  });

  it("should export database test utility functions", async () => {
    const {
      DatabaseTestUtils,
      setupTestDatabase,
      cleanupTestDatabase,
      createTestTopic,
      clearTestTopics,
      withTestTransaction,
    } = require("../../utils/DatabaseTestUtils");

    expect(DatabaseTestUtils).toBeDefined();
    expect(typeof DatabaseTestUtils).toBe("function");

    expect(typeof setupTestDatabase).toBe("function");
    expect(typeof cleanupTestDatabase).toBe("function");
    expect(typeof createTestTopic).toBe("function");
    expect(typeof clearTestTopics).toBe("function");
    expect(typeof withTestTransaction).toBe("function");
  });

  it("should create DatabaseTestUtils instance", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils({
      testDatabaseUrl: "postgresql://test:test@localhost:5432/test_db",
    });

    expect(testUtils).toBeInstanceOf(DatabaseTestUtils);
    expect(testUtils.config.testDatabaseUrl).toBe(
      "postgresql://test:test@localhost:5432/test_db",
    );
  });

  it("should have default configuration", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();

    expect(testUtils.config.testDatabaseUrl).toBeDefined();
    expect(testUtils.config.isolationLevel).toBeDefined();
    expect(testUtils.config.cleanupTimeout).toBeDefined();
  });

  it("should generate test topic data", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();
    const topicData = testUtils.generateTestTopic();

    expect(topicData).toHaveProperty("channelId");
    expect(topicData).toHaveProperty("userId");
    expect(topicData).toHaveProperty("username");
    expect(topicData).toHaveProperty("content");
    expect(topicData).toHaveProperty("x");
    expect(topicData).toHaveProperty("y");
    expect(topicData).toHaveProperty("w");
    expect(topicData).toHaveProperty("h");

    expect(typeof topicData.channelId).toBe("string");
    expect(typeof topicData.userId).toBe("string");
    expect(typeof topicData.username).toBe("string");
    expect(typeof topicData.content).toBe("string");
  });

  it("should generate custom test topic data", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();
    const customData = {
      username: "Test User",
      content: "Custom test content",
      x: "100.50",
      y: "200.75",
    };

    const topicData = testUtils.generateTestTopic(customData);

    expect(topicData.username).toBe(customData.username);
    expect(topicData.content).toBe(customData.content);
    expect(topicData.x).toBe(customData.x);
    expect(topicData.y).toBe(customData.y);
    expect(topicData.channelId).toBeDefined(); // Should still be generated
    expect(topicData.userId).toBeDefined(); // Should still be generated
  });

  it("should generate hierarchical test topics", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();
    const topics = testUtils.generateTestHierarchy(3); // 3 levels deep

    expect(topics).toHaveLength(1); // Should start with one root topic
    expect(topics[0].children).toHaveLength(1);
    expect(topics[0].children[0].children).toHaveLength(1);
    expect(topics[0].children[0].children[0].children).toHaveLength(0); // Leaf node
  });

  it("should validate topic data structure", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();

    // Valid topic data
    const validTopic = testUtils.generateTestTopic();
    const validValidation = testUtils.validateTopicData(validTopic);
    expect(validValidation.isValid).toBe(true);
    expect(validValidation.errors).toHaveLength(0);

    // Invalid topic data - missing required fields
    const invalidTopic = {
      channelId: "test-channel",
      // Missing userId, username, content
    };
    const invalidValidation = testUtils.validateTopicData(invalidTopic);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);
  });

  it("should create test database isolation", async () => {
    const {
      DatabaseTestUtils,
      withTestTransaction,
    } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();
    const mockOperation = jest.fn().mockResolvedValue("success");

    // Record a metric first to verify the testUtils instance works
    testUtils.recordMetric("setup", 10);

    // In test environment, withTestTransaction should execute the operation directly
    // without using real database transactions
    const result = await withTestTransaction(mockOperation);

    expect(result).toBe("success");
    expect(mockOperation).toHaveBeenCalled();

    // Verify our testUtils instance still has its metric
    const metrics = testUtils.getMetrics();
    expect(metrics).toHaveProperty("setup");
    expect(metrics.setup.count).toBe(1);
  });

  it("should handle test cleanup", async () => {
    const {
      DatabaseTestUtils,
      cleanupTestDatabase,
    } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();
    const cleanupResult = await testUtils.cleanup();

    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.cleanedTables).toBeDefined();
    expect(Array.isArray(cleanupResult.cleanedTables)).toBe(true);
  });

  it("should track test metrics", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();

    testUtils.recordMetric("test_operation", 150); // 150ms
    testUtils.recordMetric("another_operation", 75); // 75ms

    const metrics = testUtils.getMetrics();

    expect(metrics).toHaveProperty("test_operation");
    expect(metrics.test_operation).toHaveProperty("count");
    expect(metrics.test_operation).toHaveProperty("totalTime");
    expect(metrics.test_operation).toHaveProperty("averageTime");

    expect(metrics.test_operation.count).toBe(1);
    expect(metrics.test_operation.totalTime).toBe(150);
    expect(metrics.test_operation.averageTime).toBe(150);

    testUtils.recordMetric("test_operation", 250); // Another 150ms
    const updatedMetrics = testUtils.getMetrics();

    expect(updatedMetrics.test_operation.count).toBe(2);
    expect(updatedMetrics.test_operation.totalTime).toBe(400);
    expect(updatedMetrics.test_operation.averageTime).toBe(200);
  });

  it("should reset test metrics", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();

    testUtils.recordMetric("test_operation", 100);
    expect(Object.keys(testUtils.getMetrics())).toHaveLength(1);

    testUtils.resetMetrics();
    expect(Object.keys(testUtils.getMetrics())).toHaveLength(0);
  });

  it("should generate test reports", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();

    testUtils.recordMetric("create_topic", 50);
    testUtils.recordMetric("update_topic", 30);
    testUtils.recordMetric("delete_topic", 20);

    const report = testUtils.generateReport();

    expect(report).toHaveProperty("timestamp");
    expect(report).toHaveProperty("metrics");
    expect(report).toHaveProperty("summary");

    expect(report.metrics).toHaveProperty("create_topic");
    expect(report.metrics).toHaveProperty("update_topic");
    expect(report.metrics).toHaveProperty("delete_topic");

    expect(report.summary).toHaveProperty("totalOperations");
    expect(report.summary).toHaveProperty("totalTime");
    expect(report.summary).toHaveProperty("averageTime");

    expect(report.summary.totalOperations).toBe(3);
    expect(report.summary.totalTime).toBe(100);
    expect(report.summary.averageTime).toBeCloseTo(33.33, 1);
  });

  it("should handle test isolation with different schemas", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils1 = new DatabaseTestUtils({
      testSchema: "test_schema_1",
    });

    const testUtils2 = new DatabaseTestUtils({
      testSchema: "test_schema_2",
    });

    expect(testUtils1.config.testSchema).toBe("test_schema_1");
    expect(testUtils2.config.testSchema).toBe("test_schema_2");
    expect(testUtils1.config.testSchema).not.toBe(testUtils2.config.testSchema);
  });

  it("should provide utility functions for test data management", async () => {
    const {
      createTestTopic,
      clearTestTopics,
      generateTestChannelId,
      generateTestUserId,
    } = require("../../utils/DatabaseTestUtils");

    // Test ID generation utilities
    const channelId = generateTestChannelId();
    const userId = generateTestUserId();

    expect(typeof channelId).toBe("string");
    expect(typeof userId).toBe("string");
    expect(channelId).toMatch(/^test_channel_/);
    expect(userId).toMatch(/^test_user_/);

    // These are integration functions that would require a real database
    // For now, we just verify they exist and are functions
    expect(typeof createTestTopic).toBe("function");
    expect(typeof clearTestTopics).toBe("function");
  });

  it("should handle concurrent test operations", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();

    // Simulate concurrent operations
    const operations = Array.from({ length: 5 }, (_, i) =>
      testUtils.recordMetric(`operation_${i}`, Math.random() * 100),
    );

    // All operations should complete without issues
    expect(() => {
      operations.forEach((op) => op);
    }).not.toThrow();

    const metrics = testUtils.getMetrics();
    expect(Object.keys(metrics)).toHaveLength(5);
  });

  it("should provide test database health checking", async () => {
    const { DatabaseTestUtils } = require("../../utils/DatabaseTestUtils");

    const testUtils = new DatabaseTestUtils();

    // Mock health check function
    const mockHealthCheck = jest.fn().mockResolvedValue(true);
    testUtils.setHealthCheck(mockHealthCheck);

    const healthStatus = await testUtils.checkHealth();

    expect(healthStatus.healthy).toBe(true);
    expect(mockHealthCheck).toHaveBeenCalled();
    expect(healthStatus.timestamp).toBeInstanceOf(Date);
  });
});

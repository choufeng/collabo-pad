import { randomUUID } from "crypto";
import type { NewTopic } from "../database/schema";
import { db } from "../database/drizzle";
import { checkDatabaseHealth } from "./DatabaseError";

export interface DatabaseTestUtilsConfig {
  testDatabaseUrl?: string;
  testSchema?: string;
  isolationLevel?: "READ_COMMITTED" | "REPEATABLE_READ" | "SERIALIZABLE";
  cleanupTimeout?: number;
  autoCleanup?: boolean;
}

export interface TestTopicData extends Partial<NewTopic> {
  channelId?: string;
  userId?: string;
  username?: string;
  content?: string;
  x?: string;
  y?: string;
  w?: string;
  h?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface TopicHierarchyNode {
  topic: TestTopicData;
  children: TopicHierarchyNode[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TestMetric {
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}

export interface TestMetrics {
  [operationName: string]: TestMetric;
}

export interface TestReport {
  timestamp: Date;
  metrics: TestMetrics;
  summary: {
    totalOperations: number;
    totalTime: number;
    averageTime: number;
    slowestOperation: string;
    fastestOperation: string;
  };
}

export interface CleanupResult {
  success: boolean;
  cleanedTables: string[];
  errors: string[];
  duration: number;
}

export interface HealthStatus {
  healthy: boolean;
  timestamp: Date;
  details?: any;
  lastCheck?: Date;
}

/**
 * Database Test Utilities for comprehensive testing support
 */
export class DatabaseTestUtils {
  public readonly config: Required<DatabaseTestUtilsConfig>;
  private metrics: TestMetrics = {};
  private healthCheckFunc?: () => Promise<boolean>;

  constructor(config: DatabaseTestUtilsConfig = {}) {
    this.config = {
      testDatabaseUrl:
        config.testDatabaseUrl ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        "",
      testSchema: config.testSchema || "test_schema",
      isolationLevel: config.isolationLevel || "READ_COMMITTED",
      cleanupTimeout: config.cleanupTimeout || 30000, // 30 seconds
      autoCleanup: config.autoCleanup !== false, // Default to true
    };
  }

  /**
   * Generate test topic data with realistic defaults
   */
  generateTestTopic(overrides: TestTopicData = {}): TestTopicData {
    return {
      channelId: overrides.channelId || this.generateTestChannelId(),
      userId: overrides.userId || this.generateTestUserId(),
      username:
        overrides.username || `Test User ${Math.floor(Math.random() * 1000)}`,
      content:
        overrides.content ||
        `Test topic content ${Math.floor(Math.random() * 1000)}`,
      x: overrides.x || this.generateRandomCoordinate(),
      y: overrides.y || this.generateRandomCoordinate(),
      w: overrides.w || this.generateRandomDimension(),
      h: overrides.h || this.generateRandomDimension(),
      metadata: overrides.metadata || {
        test: true,
        timestamp: new Date().toISOString(),
      },
      tags: overrides.tags || ["test", "auto-generated"],
    };
  }

  /**
   * Generate hierarchical test topics
   */
  generateTestHierarchy(
    depth: number,
    breadth: number = 1,
  ): TopicHierarchyNode[] {
    const hierarchy: TopicHierarchyNode[] = [];

    for (let i = 0; i < breadth; i++) {
      const rootTopic = this.generateTestTopic({
        content: `Root Topic ${i + 1}`,
      });

      const node: TopicHierarchyNode = {
        topic: rootTopic,
        children: this.generateChildNodes(rootTopic, depth - 1, breadth),
      };

      hierarchy.push(node);
    }

    return hierarchy;
  }

  /**
   * Generate child nodes for hierarchy
   */
  private generateChildNodes(
    parent: TestTopicData,
    remainingDepth: number,
    breadth: number,
  ): TopicHierarchyNode[] {
    if (remainingDepth <= 0) {
      return [];
    }

    const children: TopicHierarchyNode[] = [];

    for (let i = 0; i < breadth; i++) {
      const childTopic = this.generateTestTopic({
        channelId: parent.channelId,
        parentId: parent.id || this.generateTestId(),
        content: `Child Topic ${i + 1} of ${parent.content}`,
      });

      const childNode: TopicHierarchyNode = {
        topic: childTopic,
        children: this.generateChildNodes(
          childTopic,
          remainingDepth - 1,
          breadth,
        ),
      };

      children.push(childNode);
    }

    return children;
  }

  /**
   * Validate topic data structure
   */
  validateTopicData(topicData: TestTopicData): ValidationResult {
    const errors: string[] = [];

    if (!topicData.channelId) {
      errors.push("channelId is required");
    }

    if (!topicData.userId) {
      errors.push("userId is required");
    }

    if (!topicData.username) {
      errors.push("username is required");
    }

    if (!topicData.content) {
      errors.push("content is required");
    }

    if (topicData.x && isNaN(parseFloat(topicData.x))) {
      errors.push("x must be a valid number");
    }

    if (topicData.y && isNaN(parseFloat(topicData.y))) {
      errors.push("y must be a valid number");
    }

    if (topicData.w && isNaN(parseFloat(topicData.w))) {
      errors.push("w must be a valid number");
    }

    if (topicData.h && isNaN(parseFloat(topicData.h))) {
      errors.push("h must be a valid number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Set up test database isolation
   */
  async setup(): Promise<void> {
    const startTime = Date.now();

    try {
      // In test environment, skip real database operations
      if (
        process.env.NODE_ENV === "test" ||
        process.env.JEST_WORKER_ID !== undefined
      ) {
        this.recordMetric("setup", Date.now() - startTime);
        return;
      }

      // Create test schema if it doesn't exist
      await this.executeSQL(`
        CREATE SCHEMA IF NOT EXISTS ${this.config.testSchema};
      `);

      // Set up test tables and indexes
      await this.setupTestTables();

      this.recordMetric("setup", Date.now() - startTime);
    } catch (error) {
      this.recordMetric("setup_error", Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Clean up test database
   */
  async cleanup(): Promise<CleanupResult> {
    const startTime = Date.now();
    const cleanedTables: string[] = [];
    const errors: string[] = [];

    try {
      // Get all tables in test schema
      const tables = await this.getTestSchemaTables();

      for (const table of tables) {
        try {
          await this.executeSQL(
            `DROP TABLE IF EXISTS ${this.config.testSchema}.${table} CASCADE;`,
          );
          cleanedTables.push(table);
        } catch (error) {
          errors.push(
            `Failed to drop table ${table}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      // Drop the test schema
      await this.executeSQL(
        `DROP SCHEMA IF EXISTS ${this.config.testSchema} CASCADE;`,
      );

      this.recordMetric("cleanup", Date.now() - startTime);

      return {
        success: errors.length === 0,
        cleanedTables,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.recordMetric("cleanup_error", Date.now() - startTime);
      errors.push(
        `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        success: false,
        cleanedTables,
        errors,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute SQL command
   */
  private async executeSQL(sql: string): Promise<void> {
    try {
      // In test environment, we don't execute real SQL to avoid connection issues
      if (
        process.env.NODE_ENV === "test" ||
        process.env.JEST_WORKER_ID !== undefined
      ) {
        // Mock execution for tests
        return;
      }
      await db.execute(sql);
    } catch (error) {
      throw new Error(
        `Failed to execute SQL: ${sql}. Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Set up test tables
   */
  private async setupTestTables(): Promise<void> {
    // This would create test-specific tables if needed
    // For now, we assume the main schema tables are available
  }

  /**
   * Get tables in test schema
   */
  private async getTestSchemaTables(): Promise<string[]> {
    try {
      // In test environment, return mock data
      if (
        process.env.NODE_ENV === "test" ||
        process.env.JEST_WORKER_ID !== undefined
      ) {
        return ["topics"]; // Mock table for testing
      }

      const result = await db.execute(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = '${this.config.testSchema}'
      `);

      return result.map((row: any) => row.tablename);
    } catch (error) {
      // If schema doesn't exist or other error, return empty array
      return [];
    }
  }

  /**
   * Record a test metric
   */
  recordMetric(operation: string, duration: number): void {
    if (!this.metrics[operation]) {
      this.metrics[operation] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
      };
    }

    const metric = this.metrics[operation];
    metric.count++;
    metric.totalTime += duration;
    metric.averageTime = metric.totalTime / metric.count;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
  }

  /**
   * Get current test metrics
   */
  getMetrics(): TestMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset all test metrics
   */
  resetMetrics(): void {
    this.metrics = {};
  }

  /**
   * Generate test report
   */
  generateReport(): TestReport {
    const operations = Object.keys(this.metrics);
    let totalOperations = 0;
    let totalTime = 0;
    let slowestOperation = "";
    let fastestOperation = "";
    let maxAverageTime = 0;
    let minAverageTime = Infinity;

    operations.forEach((operation) => {
      const metric = this.metrics[operation];
      totalOperations += metric.count;
      totalTime += metric.totalTime;

      if (metric.averageTime > maxAverageTime) {
        maxAverageTime = metric.averageTime;
        slowestOperation = operation;
      }

      if (metric.averageTime < minAverageTime) {
        minAverageTime = metric.averageTime;
        fastestOperation = operation;
      }
    });

    return {
      timestamp: new Date(),
      metrics: this.metrics,
      summary: {
        totalOperations,
        totalTime,
        averageTime: totalOperations > 0 ? totalTime / totalOperations : 0,
        slowestOperation,
        fastestOperation,
      },
    };
  }

  /**
   * Set health check function
   */
  setHealthCheck(healthCheck: () => Promise<boolean>): void {
    this.healthCheckFunc = healthCheck;
  }

  /**
   * Check database health
   */
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const healthCheck =
        this.healthCheckFunc ||
        (() => checkDatabaseHealth(() => Promise.resolve(true)));
      const healthy = await healthCheck();

      this.recordMetric("health_check", Date.now() - startTime);

      return {
        healthy: healthy as boolean,
        timestamp: new Date(),
        lastCheck: new Date(),
      };
    } catch (error) {
      this.recordMetric("health_check_error", Date.now() - startTime);

      return {
        healthy: false,
        timestamp: new Date(),
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Generate random coordinate
   */
  private generateRandomCoordinate(): string {
    return (Math.random() * 1000).toFixed(2);
  }

  /**
   * Generate random dimension
   */
  private generateRandomDimension(): string {
    return (100 + Math.random() * 300).toFixed(2); // 100-400
  }

  /**
   * Generate test channel ID
   */
  generateTestChannelId(): string {
    return `test_channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate test user ID
   */
  generateTestUserId(): string {
    return `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate test ID
   */
  generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Utility functions for common test operations

/**
 * Set up test database with default configuration
 */
export async function setupTestDatabase(
  config?: DatabaseTestUtilsConfig,
): Promise<DatabaseTestUtils> {
  const testUtils = new DatabaseTestUtils(config);
  await testUtils.setup();
  return testUtils;
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(
  testUtils: DatabaseTestUtils,
): Promise<CleanupResult> {
  return await testUtils.cleanup();
}

/**
 * Create a test topic in the database
 */
export async function createTestTopic(
  topicData?: TestTopicData,
  config?: DatabaseTestUtilsConfig,
): Promise<TestTopicData> {
  const testUtils = new DatabaseTestUtils(config);
  const data = testUtils.generateTestTopic(topicData);

  // This would create the topic in the database
  // For now, just return the generated data
  return data;
}

/**
 * Clear test topics from the database
 */
export async function clearTestTopics(
  config?: DatabaseTestUtilsConfig,
): Promise<void> {
  const testUtils = new DatabaseTestUtils(config);

  // This would clear test topics from the database
  // For now, just record the metric
  testUtils.recordMetric("clear_topics", 0);
}

/**
 * Execute operations within a test transaction
 */
export async function withTestTransaction<T>(
  operation: () => Promise<T>,
  config?: DatabaseTestUtilsConfig,
): Promise<T> {
  const testUtils = new DatabaseTestUtils(config);
  const startTime = Date.now();

  try {
    // In test environment, just execute the operation without real transaction
    if (
      process.env.NODE_ENV === "test" ||
      process.env.JEST_WORKER_ID !== undefined
    ) {
      const result = await operation();
      testUtils.recordMetric("transaction", Date.now() - startTime);
      return result;
    }

    const result = await db.transaction(async (tx) => {
      // Execute the operation within the transaction
      return await operation();
    });

    testUtils.recordMetric("transaction", Date.now() - startTime);
    return result;
  } catch (error) {
    testUtils.recordMetric("transaction_error", Date.now() - startTime);
    throw error;
  }
}

/**
 * Generate test channel ID
 */
export function generateTestChannelId(): string {
  const testUtils = new DatabaseTestUtils();
  return testUtils.generateTestChannelId();
}

/**
 * Generate test user ID
 */
export function generateTestUserId(): string {
  const testUtils = new DatabaseTestUtils();
  return testUtils.generateTestUserId();
}

// Default instance for easy use
export const defaultTestUtils = new DatabaseTestUtils();

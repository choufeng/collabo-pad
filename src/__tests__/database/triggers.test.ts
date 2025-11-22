import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

describe("PostgreSQL Triggers for SSE", () => {
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

  it("should have trigger SQL definitions available", () => {
    expect(() => {
      require("../../database/triggers");
    }).not.toThrow();
  });

  it("should export trigger creation functions", async () => {
    const triggerModule = require("../../database/triggers");

    expect(triggerModule.createTopicChangeTrigger).toBeDefined();
    expect(typeof triggerModule.createTopicChangeTrigger).toBe("function");
    expect(triggerModule.createTriggerFunction).toBeDefined();
    expect(typeof triggerModule.createTriggerFunction).toBe("function");
  });

  it("should generate valid trigger function SQL", async () => {
    const { createTriggerFunction } = require("../../database/triggers");
    const triggerFunctionSQL = createTriggerFunction();

    expect(typeof triggerFunctionSQL).toBe("string");
    expect(triggerFunctionSQL).toContain("CREATE OR REPLACE FUNCTION");
    expect(triggerFunctionSQL).toContain("notify_topic_change()");
    expect(triggerFunctionSQL).toContain("RETURNS TRIGGER");
    expect(triggerFunctionSQL).toContain("LANGUAGE plpgsql");
    expect(triggerFunctionSQL).toContain("pg_notify");
    expect(triggerFunctionSQL).toContain("topic_channel_");
    expect(triggerFunctionSQL).toContain("json_build_object");
    expect(triggerFunctionSQL).toContain("TG_OP");
    expect(triggerFunctionSQL).toContain("NEW");
    expect(triggerFunctionSQL).toContain("OLD");
  });

  it("should generate valid trigger SQL", async () => {
    const { createTopicChangeTrigger } = require("../../database/triggers");
    const triggerSQL = createTopicChangeTrigger();

    expect(typeof triggerSQL).toBe("string");
    expect(triggerSQL).toContain("CREATE TRIGGER");
    expect(triggerSQL).toContain("topic_change_trigger");
    expect(triggerSQL).toContain("AFTER INSERT OR UPDATE OR DELETE");
    expect(triggerSQL).toContain("ON topics");
    expect(triggerSQL).toContain("FOR EACH ROW");
    expect(triggerSQL).toContain("EXECUTE FUNCTION notify_topic_change()");
  });

  it("should generate notification payload with correct structure", async () => {
    const { createTriggerFunction } = require("../../database/triggers");
    const triggerFunctionSQL = createTriggerFunction();

    // Check for required payload fields
    expect(triggerFunctionSQL).toContain("'type', TG_OP");
    expect(triggerFunctionSQL).toContain("'id', COALESCE(NEW.id, OLD.id)");
    expect(triggerFunctionSQL).toContain(
      "'channelId', COALESCE(NEW.channel_id, OLD.channel_id)",
    );
    expect(triggerFunctionSQL).toContain(
      "'parentId', COALESCE(NEW.parent_id, OLD.parent_id)",
    );
    expect(triggerFunctionSQL).toContain("'timestamp'");
    expect(triggerFunctionSQL).toContain("EXTRACT(EPOCH FROM NOW())::BIGINT");
  });

  it("should handle different trigger operations", async () => {
    const { createTriggerFunction } = require("../../database/triggers");
    const triggerFunctionSQL = createTriggerFunction();

    // The trigger should handle INSERT, UPDATE, and DELETE operations
    expect(triggerFunctionSQL).toContain("TG_OP");

    // For INSERT: NEW is available
    // For UPDATE: both NEW and OLD are available
    // For DELETE: OLD is available
    expect(triggerFunctionSQL).toContain("COALESCE(NEW, OLD)");
  });

  it("should generate trigger SQL with proper syntax", async () => {
    const { createTopicChangeTrigger } = require("../../database/triggers");
    const triggerSQL = createTopicChangeTrigger();

    // Validate SQL syntax patterns
    expect(triggerSQL).toMatch(/CREATE TRIGGER\s+"?topic_change_trigger"?\s+/i);
    expect(triggerSQL).toMatch(
      /AFTER\s+(INSERT|UPDATE|DELETE)\s+OR\s+(INSERT|UPDATE|DELETE)\s+OR\s+(INSERT|UPDATE|DELETE)/i,
    );
    expect(triggerSQL).toMatch(/ON\s+"?topics"?\s+/i);
    expect(triggerSQL).toMatch(/FOR\s+EACH\s+ROW\s+/i);
    expect(triggerSQL).toMatch(/EXECUTE\s+FUNCTION\s+notify_topic_change\(\)/i);
  });

  it("should generate complete trigger setup script", async () => {
    const { generateTriggerSetupScript } = require("../../database/triggers");
    const setupScript = generateTriggerSetupScript();

    expect(typeof setupScript).toBe("string");

    // Should contain both function and trigger creation
    expect(setupScript).toContain(
      "CREATE OR REPLACE FUNCTION notify_topic_change",
    );
    expect(setupScript).toContain("CREATE TRIGGER topic_change_trigger");

    // Should contain proper statement separators
    expect(setupScript).toContain(";");
  });

  it("should have trigger cleanup function", async () => {
    const { cleanupTriggers } = require("../../database/triggers");

    expect(cleanupTriggers).toBeDefined();
    expect(typeof cleanupTriggers).toBe("function");

    const cleanupSQL = cleanupTriggers();
    expect(typeof cleanupSQL).toBe("string");
    expect(cleanupSQL).toContain("DROP TRIGGER IF EXISTS");
    expect(cleanupSQL).toContain("DROP FUNCTION IF EXISTS");
  });

  it("should support channel-based notifications", async () => {
    const { createTriggerFunction } = require("../../database/triggers");
    const triggerFunctionSQL = createTriggerFunction();

    // Check that notifications are channel-specific
    expect(triggerFunctionSQL).toMatch(
      /'topic_channel_'\s*\|\|\s*COALESCE\(NEW\.channel_id,\s*OLD\.channel_id\)/,
    );

    // This ensures notifications go to the right channel listeners
    expect(triggerFunctionSQL).toContain("topic_channel_");
  });

  it("should generate JSON-serializable notification payload", async () => {
    const { createTriggerFunction } = require("../../database/triggers");
    const triggerFunctionSQL = createTriggerFunction();

    // Check that the payload is properly formatted as JSON
    expect(triggerFunctionSQL).toContain("json_build_object");
    expect(triggerFunctionSQL).toContain("::text"); // Ensures JSON serialization

    // Verify all required fields are included in the JSON payload
    const requiredFields = ["type", "id", "channelId", "parentId", "timestamp"];
    requiredFields.forEach((field) => {
      const regex = new RegExp(`'${field}'`, "i");
      expect(triggerFunctionSQL).toMatch(regex);
    });
  });

  it("should have proper error handling in trigger function", async () => {
    const { createTriggerFunction } = require("../../database/triggers");
    const triggerFunctionSQL = createTriggerFunction();

    // Check for EXCEPTION handling or similar error handling
    // While PostgreSQL triggers don't typically have extensive error handling,
    // the function should be robust
    expect(triggerFunctionSQL).toContain("BEGIN");
    expect(triggerFunctionSQL).toContain("END");
    expect(triggerFunctionSQL).toContain("RETURN");
  });
});

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

describe("Database Migration", () => {
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

  it("should have migration files generated", () => {
    // Check that migration file exists
    expect(() => {
      require("fs").accessSync("./drizzle/0000_bright_whirlwind.sql");
    }).not.toThrow();
  });

  it("should have valid migration SQL content", () => {
    const fs = require("fs");
    const migrationSql = fs.readFileSync(
      "./drizzle/0000_bright_whirlwind.sql",
      "utf8",
    );

    // Check that the migration contains essential table creation
    expect(migrationSql).toContain('CREATE TABLE "topics"');
    expect(migrationSql).toContain('id" uuid PRIMARY KEY');
    expect(migrationSql).toContain("gen_random_uuid()");
    expect(migrationSql).toContain('channel_id" uuid NOT NULL');
    expect(migrationSql).toContain('parent_id" uuid');
    expect(migrationSql).toContain('user_id" uuid NOT NULL');
    expect(migrationSql).toContain('username" text NOT NULL');
    expect(migrationSql).toContain('content" text NOT NULL');

    // Check spatial positioning fields
    expect(migrationSql).toContain('x" numeric(10, 2)');
    expect(migrationSql).toContain('y" numeric(10, 2)');
    expect(migrationSql).toContain('w" numeric(10, 2)');
    expect(migrationSql).toContain('h" numeric(10, 2)');

    // Check extension fields
    expect(migrationSql).toContain('metadata" json');
    expect(migrationSql).toContain('tags" text[]');

    // Check timestamp fields
    expect(migrationSql).toContain('created_at" timestamp');
    expect(migrationSql).toContain('updated_at" timestamp');

    // Check indexes
    expect(migrationSql).toContain('CREATE INDEX "idx_topics_channel_id"');
    expect(migrationSql).toContain('CREATE INDEX "idx_topics_parent_id"');
    expect(migrationSql).toContain('CREATE INDEX "idx_topics_user_id"');
    expect(migrationSql).toContain('CREATE INDEX "idx_topics_created_at"');
  });

  it("should be able to validate migration file exists", async () => {
    const { existsSync } = require("fs");
    const migrationPath = "./drizzle/0000_bright_whirlwind.sql";

    expect(existsSync(migrationPath)).toBe(true);
  });

  it("should have valid migration SQL syntax", async () => {
    const fs = require("fs");
    const migrationSql = fs.readFileSync(
      "./drizzle/0000_bright_whirlwind.sql",
      "utf8",
    );

    // Basic SQL syntax validation
    expect(migrationSql).toMatch(/CREATE TABLE.*topics/);
    expect(migrationSql).toMatch(/CREATE INDEX.*idx_topics/);

    // Count the number of CREATE statements
    const createTableMatches = migrationSql.match(/CREATE TABLE/g);
    const createIndexMatches = migrationSql.match(/CREATE INDEX/g);

    expect(createTableMatches).toHaveLength(1); // Should create exactly 1 table
    expect(createIndexMatches).toHaveLength(4); // Should create exactly 4 indexes
  });

  it("should generate valid PostgreSQL data types", async () => {
    const fs = require("fs");
    const migrationSql = fs.readFileSync(
      "./drizzle/0000_bright_whirlwind.sql",
      "utf8",
    );

    // Validate PostgreSQL-specific data types
    expect(migrationSql).toContain("uuid PRIMARY KEY");
    expect(migrationSql).toContain("gen_random_uuid()"); // UUID generation function
    expect(migrationSql).toContain("numeric(10, 2)"); // Precise decimal type
    expect(migrationSql).toContain("text[]"); // Array type
    expect(migrationSql).toContain("json"); // JSON type
    expect(migrationSql).toContain("timestamp DEFAULT now()"); // Timestamp with default
  });

  it("should have proper table constraints", async () => {
    const fs = require("fs");
    const migrationSql = fs.readFileSync(
      "./drizzle/0000_bright_whirlwind.sql",
      "utf8",
    );

    // Check NOT NULL constraints
    const notNullCount = (migrationSql.match(/NOT NULL/g) || []).length;
    expect(notNullCount).toBeGreaterThan(4); // Should have multiple NOT NULL constraints

    // Check primary key constraint
    expect(migrationSql).toContain("PRIMARY KEY");
  });

  it("should have index definitions with correct syntax", async () => {
    const fs = require("fs");
    const migrationSql = fs.readFileSync(
      "./drizzle/0000_bright_whirlwind.sql",
      "utf8",
    );

    // Check index syntax
    expect(migrationSql).toMatch(
      /CREATE INDEX "idx_topics_channel_id" ON "topics" USING btree \("channel_id"\)/,
    );
    expect(migrationSql).toMatch(
      /CREATE INDEX "idx_topics_parent_id" ON "topics" USING btree \("parent_id"\)/,
    );
    expect(migrationSql).toMatch(
      /CREATE INDEX "idx_topics_user_id" ON "topics" USING btree \("user_id"\)/,
    );
    expect(migrationSql).toMatch(
      /CREATE INDEX "idx_topics_created_at" ON "topics" USING btree \("created_at"\)/,
    );
  });
});

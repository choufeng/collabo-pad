import type { Config } from "drizzle-kit";

/**
 * 统一的数据库连接字符串解析逻辑
 * 优先级顺序：
 * 1. DATABASE_URL (最高优先级)
 * 2. POSTGRES_URL (备选项)
 * 3. POSTGRES_URL_NON_POOLING (最后备选)
 */
function getDatabaseConnectionString(): string {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "Database connection string not found. Please set one of: DATABASE_URL, POSTGRES_URL, or POSTGRES_URL_NON_POOLING",
    );
  }

  // Remove schema parameter if present (not supported by postgres-js)
  let cleanConnectionString = connectionString;
  if (cleanConnectionString.includes("schema=")) {
    cleanConnectionString = cleanConnectionString
      .replace(/\?schema=[^&]*&?/, "?")
      .replace(/\?$/, "");
  }

  return cleanConnectionString;
}

export default {
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseConnectionString(),
  },
  verbose: true,
  strict: true,
} satisfies Config;

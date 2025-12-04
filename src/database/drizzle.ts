import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

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

  // Log the connection string (with sensitive data masked)
  const maskedConnectionString = cleanConnectionString.replace(
    /:\/\/([^:]+):([^@]+)@/,
    "://$1:***@",
  );
  console.log(`Database connecting to: ${maskedConnectionString}`);

  return cleanConnectionString;
}

const connectionString = getDatabaseConnectionString();

// Create postgres client with connection pooling
const client = postgres(connectionString, {
  max: 10, // maximum connections in the pool
  idle_timeout: 20, // idle timeout in seconds
  connect_timeout: 10, // connect timeout in seconds
});

// Create drizzle instance
export const db = drizzle(client);

// Export the client for direct queries if needed
export { client };

// Helper function to close the database connection
export async function closeDatabase(): Promise<void> {
  await client.end();
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

/**
 * 启动时异步验证数据库连接
 * 不会阻塞应用启动，但会记录连接状态
 */
export async function validateDatabaseConnectionOnStartup(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log("Validating database connection on startup...");

    // 执行简单查询测试连接
    await client`SELECT 1`;

    const responseTime = Date.now() - startTime;
    console.log(
      `✅ Database connection validated successfully in ${responseTime}ms`,
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(
      `❌ Database connection validation failed after ${responseTime}ms:`,
      errorMessage,
    );
    console.error("🔧 Troubleshooting steps:");
    console.error("   1. Check if PostgreSQL is running");
    console.error(
      "   2. Verify DATABASE_URL, POSTGRES_URL, or POSTGRES_URL_NON_POOLING environment variables",
    );
    console.error("   3. Ensure database exists and credentials are correct");
    console.error("   4. Check network connectivity and firewall settings");

    // 应用继续启动，但数据库状态在健康检查中会显示为错误
  }
}

/**
 * 获取详细的数据库连接诊断信息
 */
export function getDatabaseConnectionDiagnostics(): {
  configuredVariables: string[];
  connectionStringFound: boolean;
  connectionStringSource: string | null;
} {
  const diagnostics = {
    configuredVariables: [] as string[],
    connectionStringFound: false,
    connectionStringSource: null as string | null,
  };

  if (process.env.DATABASE_URL) {
    diagnostics.configuredVariables.push("DATABASE_URL");
    diagnostics.connectionStringFound = true;
    diagnostics.connectionStringSource = "DATABASE_URL";
  }

  if (process.env.POSTGRES_URL) {
    diagnostics.configuredVariables.push("POSTGRES_URL");
    if (!diagnostics.connectionStringFound) {
      diagnostics.connectionStringFound = true;
      diagnostics.connectionStringSource = "POSTGRES_URL";
    }
  }

  if (process.env.POSTGRES_URL_NON_POOLING) {
    diagnostics.configuredVariables.push("POSTGRES_URL_NON_POOLING");
    if (!diagnostics.connectionStringFound) {
      diagnostics.connectionStringFound = true;
      diagnostics.connectionStringSource = "POSTGRES_URL_NON_POOLING";
    }
  }

  return diagnostics;
}

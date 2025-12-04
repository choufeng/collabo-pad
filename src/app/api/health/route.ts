import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { topicService } from "@/services/TopicService";

/**
 * 统一的数据库连接字符串解析逻辑
 * 优先级顺序：
 * 1. DATABASE_URL (最高优先级)
 * 2. POSTGRES_URL (备选项)
 * 3. POSTGRES_URL_NON_POOLING (最后备选)
 */
function getDatabaseConnectionString(): string | null {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    return null;
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

// Health check response interface
interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  services: {
    app: "ok" | "error";
    database?: "ok" | "error" | "not_configured";
    topics_api?: "ok" | "error";
  };
  details?: {
    database_error?: string;
    topics_api_error?: string;
  };
  version: string;
  uptime: number;
}

// Get application uptime
const getUptime = (): number => {
  return process.uptime();
};

// Get application version
const getVersion = (): string => {
  return process.env.npm_package_version || "1.0.0";
};

// Check PostgreSQL database connection
async function checkDatabaseConnection(): Promise<
  "ok" | "error" | "not_configured"
> {
  const startTime = Date.now();

  try {
    const databaseUrl = getDatabaseConnectionString();

    if (!databaseUrl) {
      console.warn(
        "Database not configured - no DATABASE_URL, POSTGRES_URL, or POSTGRES_URL_NON_POOLING found",
      );
      return "not_configured";
    }

    // Log which environment variable is being used (masked)
    const sourceVar = process.env.DATABASE_URL
      ? "DATABASE_URL"
      : process.env.POSTGRES_URL
        ? "POSTGRES_URL"
        : "POSTGRES_URL_NON_POOLING";
    console.log(`Health check using ${sourceVar} for database connection`);

    // Create connection for health check
    const client = postgres(databaseUrl, {
      connect_timeout: 5, // 5 seconds timeout for health check
    });
    const db = drizzle(client);

    // Simple connection test
    await client`SELECT 1`;
    await client.end();

    const responseTime = Date.now() - startTime;
    console.log(`Database health check passed in ${responseTime}ms`);

    return "ok";
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Database health check failed after ${responseTime}ms:`,
      errorMessage,
    );
    return "error";
  }
}

// Check topics API functionality
async function checkTopicsAPI(): Promise<"ok" | "error"> {
  try {
    // Test topicService.findByChannelId with a common channel ID
    await topicService.findByChannelId("1");
    return "ok";
  } catch (error) {
    console.error("Topics API health check failed:", error);
    return "error";
  }
}

// Main health check handler
export async function GET(
  request: NextRequest,
): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();

  try {
    // Check all services in parallel for better performance
    const [dbStatus, topicsStatus] = await Promise.allSettled([
      checkDatabaseConnection(),
      checkTopicsAPI(),
    ]);

    const database = dbStatus.status === "fulfilled" ? dbStatus.value : "error";
    const topics_api =
      topicsStatus.status === "fulfilled" ? topicsStatus.value : "error";

    // Determine overall health
    const services = {
      app: "ok" as const,
      database,
      topics_api,
    };

    const allServicesHealthy = Object.values(services).every(
      (status) => status === "ok" || status === "not_configured",
    );

    // Add error details for debugging
    const details: HealthStatus["details"] = {};
    if (dbStatus.status === "rejected") {
      details.database_error =
        dbStatus.reason?.message || "Unknown database error";
    }
    if (topicsStatus.status === "rejected") {
      details.topics_api_error =
        topicsStatus.reason?.message || "Unknown topics API error";
    }

    const healthStatus: HealthStatus = {
      status: allServicesHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services,
      details: Object.keys(details).length > 0 ? details : undefined,
      version: getVersion(),
      uptime: getUptime(),
    };

    // Return appropriate HTTP status based on health
    const httpStatus = healthStatus.status === "healthy" ? 200 : 503;

    const responseTime = Date.now() - startTime;
    console.log(
      `Health check completed in ${responseTime}ms: ${healthStatus.status}`,
    );

    return NextResponse.json(healthStatus, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Response-Time": `${responseTime}ms`,
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    const errorStatus: HealthStatus = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        app: "error",
      },
      version: getVersion(),
      uptime: getUptime(),
    };

    return NextResponse.json(errorStatus, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}

// Handle other HTTP methods
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Health check response interface
interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  services: {
    app: "ok" | "error";
    database?: "ok" | "error" | "not_configured";
    redis?: "ok" | "error" | "not_configured";
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
  try {
    const databaseUrl = process.env.POSTGRES_URL;

    if (!databaseUrl) {
      console.warn("Database not configured");
      return "not_configured";
    }

    // Create connection for health check
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    // Simple connection test
    await client`SELECT 1`;
    await client.end();

    return "ok";
  } catch (error) {
    console.error("Database health check failed:", error);
    return "error";
  }
}

// Check Redis connection
async function checkRedisConnection(): Promise<
  "ok" | "error" | "not_configured"
> {
  try {
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT || "6379";

    if (!redisHost) {
      console.warn("Redis not configured");
      return "not_configured";
    }

    const redis = new Redis({
      host: redisHost,
      port: parseInt(redisPort),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      connectTimeout: 5000, // 5 seconds timeout
      lazyConnect: true,
    });

    // Test connection
    await redis.ping();
    await redis.quit();

    return "ok";
  } catch (error) {
    console.error("Redis health check failed:", error);
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
    const [dbStatus, redisStatus] = await Promise.allSettled([
      checkDatabaseConnection(),
      checkRedisConnection(),
    ]);

    const database = dbStatus.status === "fulfilled" ? dbStatus.value : "error";
    const redis =
      redisStatus.status === "fulfilled" ? redisStatus.value : "error";

    // Determine overall health
    const services = {
      app: "ok" as const,
      database,
      redis,
    };

    const allServicesHealthy = Object.values(services).every(
      (status) => status === "ok" || status === "not_configured",
    );

    const healthStatus: HealthStatus = {
      status: allServicesHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services,
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

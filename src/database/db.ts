import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrl } from "../lib/validation";

let databaseInstance: ReturnType<typeof drizzle> | null = null;

export function getDatabaseConnection() {
  // Always validate and create new connection if URL is invalid
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  // Basic validation for PostgreSQL URL format
  try {
    const url = new URL(databaseUrl);
    if (!url.protocol.includes("postgres")) {
      throw new Error(
        "DATABASE_URL must be a valid PostgreSQL connection string",
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "DATABASE_URL must be a valid PostgreSQL connection string",
      );
    }
    throw error;
  }

  if (databaseInstance) {
    return databaseInstance;
  }

  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
    // Add connection pool configuration for better performance
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
  });

  // Create Drizzle instance with the connection pool
  databaseInstance = drizzle(pool);

  return databaseInstance;
}

// Export a function to close the database connection (useful for testing)
export async function closeDatabaseConnection() {
  if (databaseInstance) {
    const client = databaseInstance as any; // Type assertion to access underlying pool
    if (client.client && client.client.pool) {
      await client.client.pool.end();
    }
    databaseInstance = null;
  }
}

// Export a function to reset the database instance (useful for testing)
export function resetDatabaseConnection() {
  databaseInstance = null;
}

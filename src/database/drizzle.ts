import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create a singleton postgres client
let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Remove schema parameter if present (not supported by postgres-js)
if (connectionString?.includes("schema=")) {
  connectionString = connectionString
    .replace(/\?schema=[^&]*&?/, "?")
    .replace(/\?$/, "");
}

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL environment variable is required",
  );
}

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

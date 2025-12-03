// Database environment validation functions

interface DatabaseConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  config?: DatabaseConfig;
}

function parsePostgresUrl(url: string): DatabaseConfig | null {
  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== "postgresql:" && urlObj.protocol !== "postgres:") {
      return null;
    }

    return {
      host: urlObj.hostname || "",
      port: urlObj.port || "5432",
      database: urlObj.pathname.substring(1) || "", // Remove leading slash
      user: urlObj.username || "",
      password: urlObj.password || "",
    };
  } catch {
    return null;
  }
}

export function validateDatabaseEnv(): ValidationResult {
  const errors: string[] = [];

  // Check for DATABASE_URL or fallback to POSTGRES_URL
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    errors.push("DATABASE_URL is required");
    return { isValid: false, errors };
  }

  // Validate PostgreSQL connection string format
  const config = parsePostgresUrl(databaseUrl);
  if (!config) {
    errors.push("DATABASE_URL must be a valid PostgreSQL connection string");
    return { isValid: false, errors };
  }

  // Note: For flexibility, we allow empty values for host/database/user
  // since different PostgreSQL connection strings might have different requirements
  // The actual validation will happen when trying to connect

  return {
    isValid: errors.length === 0,
    errors,
    config,
  };
}

export function getDatabaseUrl(): string {
  const result = validateDatabaseEnv();

  if (!result.isValid) {
    throw new Error(
      `Database configuration invalid: ${result.errors.join(", ")}`,
    );
  }

  return process.env.DATABASE_URL || process.env.POSTGRES_URL!;
}

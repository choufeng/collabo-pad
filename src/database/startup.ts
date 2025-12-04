import {
  validateDatabaseConnectionOnStartup,
  getDatabaseConnectionDiagnostics,
} from "./drizzle";

/**
 * 应用启动时执行初始化任务
 */
export async function initializeApp(): Promise<void> {
  console.log("🚀 Initializing application...");

  // 记录数据库连接诊断信息
  const diagnostics = getDatabaseConnectionDiagnostics();
  console.log("📊 Database connection diagnostics:", {
    configuredVariables: diagnostics.configuredVariables,
    connectionStringFound: diagnostics.connectionStringFound,
    connectionStringSource: diagnostics.connectionStringSource,
  });

  if (!diagnostics.connectionStringFound) {
    console.warn(
      "⚠️  No database connection string found in environment variables",
    );
    console.warn(
      "   Expected one of: DATABASE_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING",
    );
  }

  // 异步验证数据库连接
  validateDatabaseConnectionOnStartup().catch((error) => {
    console.error("Failed to start database validation:", error);
  });

  console.log("✅ Application initialization completed");
}

/**
 * 优雅关闭应用
 */
export async function shutdownApp(): Promise<void> {
  console.log("🛑 Shutting down application...");

  // 这里可以添加其他清理逻辑，比如关闭数据库连接等
  // 注意：不需要在这里关闭数据库连接，因为它是 singleton

  console.log("✅ Application shutdown completed");
}

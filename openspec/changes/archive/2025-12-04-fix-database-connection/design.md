# 数据库连接配置设计文档

## 架构分析

### 当前架构问题

1. **环境变量冲突**

   ```
   .env:        POSTGRES_URL=postgresql://postgres:postgres_dev@localhost:9198/collabo_pad_db
   .env.local:  DATABASE_URL="prisma+postgres://localhost:51213/..."
   drizzle.ts:  DATABASE_URL || POSTGRES_URL
   health.ts:   只检查 POSTGRES_URL
   ```

2. **连接初始化不一致**
   - `src/database/drizzle.ts` 使用 singleton 模式
   - `src/app/api/health/route.ts` 每次创建新连接
   - 没有统一的错误处理机制

### 目标架构

```mermaid
graph TD
    A[环境变量加载] --> B[数据库配置验证]
    B --> C[连接池初始化]
    C --> D[健康检查集成]
    D --> E[服务层使用]

    F[DATABASE_URL] --> A
    G[POSTGRES_URL] --> A
    H[其他配置] --> A
```

## 设计决策

### 1. 环境变量优先级

```typescript
// 优先级顺序
const connectionString =
  process.env.DATABASE_URL || // 主要配置
  process.env.POSTGRES_URL || // 备选配置
  process.env.POSTGRES_URL_NON_POOLING; // 最后备选
```

**理由**：

- `DATABASE_URL` 是社区标准
- `POSTGRES_URL` 用于向后兼容
- 支持多种部署环境（Vercel、Railway 等）

### 2. 连接池策略

```typescript
// 使用 postgres-js 连接池
const client = postgres(connectionString, {
  max: 10, // 最大连接数
  idle_timeout: 20, // 空闲超时
  connect_timeout: 10, // 连接超时
  retry_count: 3, // 重试次数
});
```

**理由**：

- 适合 Serverless 环境
- 自动连接管理
- 内置重试机制

### 3. 健康检查策略

```typescript
async function checkDatabaseHealth(): Promise<HealthResult> {
  try {
    // 使用现有连接池进行快速检查
    await db.execute(sql`SELECT 1`);
    return { status: "ok", latency: responseTime };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
      // 不暴露敏感信息
    };
  }
}
```

**理由**：

- 重用现有连接，避免资源浪费
- 提供性能指标（延迟）
- 安全的错误信息处理

## 实现策略

### 阶段 1: 配置统一

1. 更新 `src/database/drizzle.ts` 环境变量逻辑
2. 修复 `src/app/api/health/route.ts` 健康检查
3. 统一环境变量文件

### 阶段 2: 错误处理增强

1. 添加启动时连接验证
2. 实现连接重试逻辑
3. 改进错误日志格式

### 阶段 3: 监控和可观测性

1. 添加连接池指标
2. 实现健康检查性能监控
3. 增强调试信息

## 兼容性考虑

- **向后兼容**：保留对 `POSTGRES_URL` 的支持
- **部署兼容**：支持主流部署平台的环境变量
- **开发兼容**：本地开发环境配置保持简单

## 安全考虑

- 不在日志中暴露数据库连接字符串
- 健康检查错误信息过滤敏感数据
- 连接池大小限制防止资源耗尽

# Redis 移除设计文档

## 当前架构分析

### Redis 使用现状

通过代码分析发现，Redis 相关功能主要包括：

1. **RedisService** (`src/lib/redis.ts`)
   - 完整的 Redis 客户端封装
   - Stream 操作功能 (SSE)
   - 基础 CRUD 操作
   - 连接管理和错误处理

2. **SSE 功能** (`src/hooks/use-sse-topics.ts`)
   - 基于 Redis Stream 的服务器推送
   - 实时主题更新功能

3. **健康检查** (`src/app/api/health/route.ts`)
   - Redis 连接状态检查
   - 服务健康状态报告

4. **类型定义** (`src/types/redis-stream.ts`)
   - Redis Stream 相关类型
   - SSE 消息类型

## 移除策略

### 1. 依赖清理

**移除的包依赖:**

- `ioredis`: Redis 客户端库

**移除的类型定义:**

- `src/types/redis-stream.ts`
- Redis 相关的 TypeScript 类型

### 2. 代码移除

**完全删除的文件:**

- `src/lib/redis.ts`
- `src/lib/__tests__/redis*.test.ts`
- `src/hooks/use-sse-topics.ts`
- `__tests__/hooks/use-sse-topics.test.ts`

**需要修改的文件:**

- `src/app/api/health/route.ts`: 移除 Redis 检查逻辑
- `package.json`: 移除 ioredis 依赖
- `docker-compose.yml`: 移除 Redis 服务配置

### 3. 配置清理

**环境变量:**

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `REDIS_CONNECT_TIMEOUT`
- `REDIS_RETRY_DELAY`

### 4. 文档更新

**需要更新的文档:**

- README.md
- DOCKER_README.md
- docs/REDIS_EXAMPLES.md (删除)
- 任何包含 Redis 配置的文档

## 实现细节

### 健康检查修改

```typescript
// 移除 redis 检查相关的导入和函数
// 修改 HealthStatus 接口，移除 redis 字段
// 更新并行检查，只保留数据库和主题 API 检查
```

### 类型依赖处理

需要检查并更新所有使用了 `Topic` 或 `SSEMessage` 类型的文件，这些类型目前在 `redis-stream.ts` 中定义。

### 测试清理

移除所有 Redis 相关的测试文件和测试用例，确保测试覆盖率不受影响。

## 迁移指南

### 对于依赖 SSE 功能的组件

1. 识别所有使用 `use-sse-topics` hook 的组件
2. 考虑替换为轮询机制或其他实时通信方案
3. 更新相关的状态管理逻辑

### 对于实时协作功能

如果未来需要重新实现实时功能，建议考虑：

- WebSocket 连接
- PostgreSQL LISTEN/NOTIFY
- 第三方实时服务 (Pusher, Ably)

## 验证标准

1. **构建成功**: 项目能够成功构建，没有 TypeScript 错误
2. **测试通过**: 所有测试通过，测试覆盖率保持现有水平
3. **功能完整**: 核心功能不受影响
4. **部署正常**: 应用能够正常部署和运行
5. **文档更新**: 所有相关文档已更新

## 回滚计划

如果需要回滚，可以通过以下步骤恢复 Redis 功能：

1. 恢复被删除的文件
2. 重新添加 ioredis 依赖
3. 恢复相关配置
4. 重新部署 Redis 服务

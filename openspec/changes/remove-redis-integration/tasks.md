# Redis 移除任务列表

## 阶段 1: 准备和分析

- [x] 分析当前 Redis 使用情况
- [x] 识别所有 Redis 相关文件和依赖
- [ ] 创建备份分支（如果需要）
- [ ] 通知团队成员即将进行的变更

## 阶段 2: 代码清理

- [ ] 移除 Redis 服务文件 (`src/lib/redis.ts`)
- [ ] 移除 Redis 类型定义 (`src/types/redis-stream.ts`)
- [ ] 移除 SSE 相关 hooks (`src/hooks/use-sse-topics.ts`)
- [ ] 移除所有 Redis 相关测试文件
- [ ] 更新导入语句，移除 Redis 相关引用

## 阶段 3: 依赖管理

- [ ] 从 package.json 移除 ioredis 依赖
- [ ] 运行 npm/pnpm install 清理 node_modules
- [ ] 验证构建无错误

## 阶段 4: API 和配置修改

- [ ] 修改健康检查 API，移除 Redis 检查 (`src/app/api/health/route.ts`)
- [ ] 更新健康检查响应接口，移除 redis 字段
- [ ] 检查并移除环境变量中的 Redis 配置
- [ ] 更新 docker-compose.yml，移除 Redis 相关配置

## 阶段 5: 文档更新

- [ ] 更新 README.md，移除 Redis 相关说明
- [ ] 更新 DOCKER_README.md
- [ ] 删除 docs/REDIS_EXAMPLES.md
- [ ] 更新部署文档
- [ ] 检查并更新所有包含 Redis 配置的文档

## 阶段 6: 测试和验证

- [ ] 运行完整测试套件
- [ ] 验证测试覆盖率
- [ ] 测试健康检查 API 功能
- [ ] 验证应用启动和运行正常
- [ ] 测试构建过程

## 阶段 7: 清理和收尾

- [ ] 检查是否有遗漏的 Redis 引用
- [ ] 清理无用的配置文件
- [ ] 更新变更日志
- [ ] 提交所有变更
- [ ] 创建 Pull Request 进行代码审查

## 验收标准

1. **构建成功**: `npm run build` 无错误
2. **测试通过**: `npm test` 所有测试通过
3. **类型检查**: TypeScript 编译无错误
4. **启动正常**: `npm run dev` 应用正常启动
5. **健康检查**: `/api/health` 返回正常状态（不包含 Redis）
6. **文档准确**: 所有文档已更新且准确

## 风险点

1. **隐藏依赖**: 可能有未发现的 Redis 使用点
2. **类型引用**: 某些类型可能被意外引用
3. **测试覆盖**: 移除测试可能影响整体覆盖率
4. **部署环境**: 确保部署环境不需要 Redis

## 注意事项

- 在删除文件前，使用 `git grep` 确保没有遗漏的引用
- 逐个验证每个删除的影响
- 保持测试驱动开发原则，先更新测试再修改代码
- 如果发现意外的 Redis 使用，需要重新评估移除策略

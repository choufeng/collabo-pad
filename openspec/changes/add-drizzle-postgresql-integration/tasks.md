# Drizzle ORM + PostgreSQL 集成任务清单

**开发范式**: TDD (测试驱动开发) - 所有功能必须先编写测试，然后实现功能
**包管理器**: pnpm

## 阶段1: 基础设置 (TDD驱动)

### 1.1 安装依赖

- [ ] 使用 `pnpm add drizzle-orm pg` 安装 Drizzle ORM 和 PostgreSQL 驱动
- [ ] 使用 `pnpm add -D drizzle-kit @types/pg` 安装开发依赖
- [ ] 验证安装成功并编写安装验证测试

### 1.2 环境配置

- [ ] 在 `.env.local` 中添加 Drizzle 数据库连接参数
- [ ] 先编写环境变量验证函数的单元测试
- [ ] 实现环境变量验证函数
- [ ] 编写数据库连接测试脚本（带测试用例）

### 1.3 Drizzle 初始化 (TDD方式)

- [ ] 编写 Drizzle 初始化功能的测试用例
- [ ] 创建 `src/database/schema.ts` 定义数据库 schema
- [ ] 创建 `src/database/db.ts` 数据库连接实例
- [ ] 创建 `drizzle.config.ts` 配置文件
- [ ] 验证所有初始化测试通过

## 阶段2: 核心Topics数据建模 (TDD驱动)

### 2.1 Topics Schema 设计与测试

- [ ] 先编写 Topics 模型验证的测试用例
- [ ] 创建 Topics 核心表结构（包含id, channel_id, parent_id, user_id, username, content, x, y, w, h, metadata, tags）
- [ ] 定义自引用层级关系（parent_id -> id）
- [ ] 运行测试验证 Topics Schema 正确性

### 2.2 数据库迁移 (TDD方式)

- [ ] 编写数据库迁移过程的集成测试
- [ ] 使用 `pnpm drizzle-kit generate` 生成迁移文件
- [ ] 使用 `pnpm drizzle-kit migrate` 执行数据库迁移
- [ ] 编写测试验证数据库表结构正确创建
- [ ] 验证所有迁移测试通过

### 2.3 种子数据与测试

- [ ] 先编写种子数据功能的测试用例
- [ ] 创建种子数据脚本 `src/database/seed.ts`
- [ ] 添加测试 Topics 数据（包含x,y,w,h坐标和尺寸）
- [ ] 在 `package.json` 中配置种子脚本使用pnpm
- [ ] 验证种子数据测试通过

### 2.4 PostgreSQL触发器设置 (TDD方式)

- [ ] 编写 Topics 变更通知触发器的测试用例
- [ ] 创建 Topics 表变更触发器函数（LISTEN/NOTIFY）
- [ ] 设置 INSERT/UPDATE/DELETE 触发器调用 pg_notify
- [ ] 验证触发器通知功能正常

## 阶段3: Topics数据服务层 (TDD驱动)

### 3.1 基础服务 (先测试后实现)

- [ ] 编写 Drizzle 数据库客户端的单元测试
- [ ] 创建 `src/database/db.ts` Drizzle 客户端实例并实现测试
- [ ] 编写 Topics 数据服务的完整测试用例
- [ ] 创建 `src/database/services/topic-service.ts` 并通过测试
- [ ] 实现层级查询方法（包含父子关系）
- [ ] 实现批量更新方法（支持x,y,w,h,content等）

### 3.2 错误处理 (TDD方式)

- [ ] 编写错误处理场景的测试用例
- [ ] 创建统一的数据库错误处理并满足测试
- [ ] 添加连接重试机制并编写重试逻辑测试
- [ ] 实现优雅的数据库连接关闭并编写测试

### 3.3 测试设置与工具

- [ ] 配置测试数据库环境
- [ ] 创建数据库测试工具函数（先用后写）
- [ ] 编写测试数据库清理钩子的测试
- [ ] 实现清理钩子功能
- [ ] 验证所有测试工具正常工作

## 阶段4: Topics API集成 (TDD驱动)

### 4.1 Topics CRUD API (先测试后实现)

- [ ] 编写主题创建 API 的完整测试套件
- [ ] 创建 `src/app/api/topics/create/route.ts` 并通过测试
- [ ] 编写主题统一更新 API 的测试用例（支持x,y,w,h,content等）
- [ ] 创建 `src/app/api/topics/update/route.ts` 并通过测试
- [ ] 编写主题删除 API 的测试用例（级联删除子主题）
- [ ] 创建 `src/app/api/topics/delete/route.ts` 并通过测试
- [ ] 验证所有 Topics CRUD API 测试通过

### 4.2 PostgreSQL 原生 SSE API (TDD方式)

- [ ] 编写 PostgreSQL SSE 监听的集成测试
- [ ] 创建 `src/app/api/sse/channel/[channelId]/route.ts` 使用 PostgreSQL LISTEN/NOTIFY
- [ ] 编写 SSE 连接管理的测试用例
- [ ] 实现 SSE 连接池和清理机制
- [ ] 验证 SSE 实时通知功能

### 4.3 Topics 查询 API (TDD方式)

- [ ] 编写按频道查询 Topics 的测试用例
- [ ] 创建 `src/app/api/topics/channel/[channelId]/route.ts`
- [ ] 编写层级 Topics 查询的测试用例
- [ ] 创建 `src/app/api/topics/hierarchy/[channelId]/route.ts`
- [ ] 实现分页和过滤功能
- [ ] 验证所有查询 API 测试通过

## 阶段5: 前端集成 (TDD驱动 + 函数式编程)

### 5.1 Topics 数据获取模块 (先测试后实现)

- [ ] 编写 Topics API 客户端的单元测试
- [ ] 创建 `src/lib/topics-api.ts` 并通过测试
- [ ] 更新 `src/types/index.ts` 添加 Topics 类型（包含x,y,w,h）
- [ ] 编写 `src/hooks/use-topics.ts` 的测试用例
- [ ] 创建 React hooks 用于 Topics 数据获取并通过测试

### 5.2 Zustand Store 模块化设计 (TDD方式)

- [ ] 编写 Topics Store 的测试用例
- [ ] 创建 `src/stores/topics-store.ts` 并通过测试
- [ ] 编写 UI 状态管理 Store 的测试用例
- [ ] 创建 `src/stores/ui-store.ts` 并通过测试
- [ ] 编写 SSE 连接管理 Store 的测试用例
- [ ] 创建 `src/stores/sse-store.ts` 并通过测试
- [ ] 实现模块间状态同步机制

### 5.3 函数式组件更新 (TDD方式)

- [ ] 为 Topics 数据更新编写组件测试
- [ ] 更新现有组件为函数式组件支持 Topics x,y,w,h 属性
- [ ] 实现 Topics 节点的统一尺寸管理（纯函数）
- [ ] 更新节点拖拽功能支持宽高调整
- [ ] 编写 SSE 连接状态的组件测试
- [ ] 实现 SSE 连接状态指示器（函数式组件）
- [ ] 避免使用 useState，优先使用 Zustand stores

## 阶段6: 全面测试和验证 (TDD已完成，此阶段为验证)

### 6.1 单元测试验证

- [ ] 运行所有 Drizzle 服务层单元测试并确保100%通过
- [ ] 运行所有 API 路由集成测试并确保100%通过
- [ ] 验证 TypeScript 类型安全性（通过编译器测试）
- [ ] 检查测试覆盖率目标达到80%以上

### 6.2 集成测试验证

- [ ] 测试 PostgreSQL 原生 SSE 实时通知功能
- [ ] 验证所有 Topics API 响应正确性
- [ ] 测试 Topics 层级关系和级联删除功能
- [ ] 测试所有错误处理和边界情况
- [ ] 运行端到端测试套件

### 6.3 性能和负载测试

- [ ] 测试数据库查询性能并设置基准
- [ ] 验证连接池配置在高负载下的表现
- [ ] 测试并发请求处理能力
- [ ] 运行性能回归测试

## 阶段7: 生产部署和监控 (TDD验证)

### 7.1 生产配置 (已测试验证)

- [ ] 使用 pnpm 配置生产环境数据库连接
- [ ] 设置生产级数据库连接池配置
- [ ] 配置 SSL 连接（如果需要）并编写连接测试
- [ ] 验证生产环境配置的所有测试通过

### 7.2 监控和告警 (带测试覆盖)

- [ ] 实现数据库连接监控并编写监控测试
- [ ] 配置慢查询日志和告警机制
- [ ] 设置性能指标收集和验证测试
- [ ] 实现健康检查 API 并编写测试

### 7.3 文档和部署脚本 (自动化)

- [ ] 更新项目 README 包含 PostgreSQL 和 Drizzle 设置说明
- [ ] 添加使用 pnpm 的数据库迁移指南
- [ ] 创建开发环境设置文档（TDD版本）
- [ ] 编写自动化部署脚本和验证测试

## 开发流程要求

### TDD 执行原则

1. **红-绿-重构**: 先写失败的测试，再实现功能，最后重构代码
2. **测试覆盖率**: 每个功能必须先有测试，才能实现功能
3. **pnpm 优先**: 所有包管理操作使用 pnpm
4. **持续集成**: 每次提交都运行完整测试套件

### 前端开发规范

1. **Zustand 优先**: 优先使用 Zustand 替代 useState，除非是极小的局部状态
2. **函数式编程**: 使用函数式组件和 hooks，避免类组件
3. **纯函数优先**: 数据处理逻辑使用纯函数，避免副作用
4. **模块化设计**: 按功能拆分文件和模块，避免单一大文件
5. **职责分离**: 每个模块有明确的单一职责
6. **类型安全**: 充分利用 TypeScript 类型系统

### 包管理器使用规范

```bash
# 安装依赖
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg

# 数据库操作
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm drizzle-kit studio

# 测试和构建
pnpm test
pnpm build
```

## 优先级说明

**高优先级 (P0)**: 阶段1-3 - 基础设置和数据建模（TDD基础）
**中优先级 (P1)**: 阶段4-5 - API集成和前端支持（TDD实现）
**低优先级 (P2)**: 阶段6-7 - 测试验证和生产优化（TDD验证）

## TDD 验收标准

每个阶段完成后，需要满足：

1. ✅ 所有测试通过（100%通过率）
2. ✅ 新功能先有测试后有实现
3. ✅ TypeScript 编译无错误
4. ✅ 应用可以正常启动和运行
5. ✅ 数据库操作无内存泄漏
6. ✅ 使用 pnpm 进行所有包管理操作
7. ✅ 测试覆盖率达到80%以上

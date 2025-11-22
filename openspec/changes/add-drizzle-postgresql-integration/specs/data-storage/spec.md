## ADDED Requirements

### Requirement: PostgreSQL 作为主要数据存储

系统 SHALL 使用 PostgreSQL 作为主要数据存储，完全替换 Redis 存储功能，提供 ACID 事务保证和持久化存储能力。

#### Scenario: 数据持久化验证

- **WHEN** 系统重启或崩溃后
- **THEN** 所有用户创建的主题、频道和关系数据 SHALL 完整保留并可访问

#### Scenario: 事务一致性保证

- **WHEN** 执行复杂的主题层级操作（如移动主题到新的父主题）
- **THEN** 所有相关数据更新 SHALL 在单个事务中完成，要么全部成功，要么全部回滚

#### Scenario: 并发写入处理

- **WHEN** 多个用户同时编辑同一频道的不同主题
- **THEN** 系统 SHALL 正确处理并发写入，无数据丢失或冲突

### Requirement: Drizzle ORM 集成

系统 SHALL 集成 Drizzle ORM 提供类型安全的数据访问层，支持完整的 TypeScript 类型推断和编译时错误检测。

#### Scenario: 类型安全的数据操作

- **WHEN** 开发者编写数据访问代码
- **THEN** Drizzle ORM SHALL 提供完整的 TypeScript 类型支持，编译时检测类型错误

#### Scenario: Schema 自动验证

- **WHEN** 应用启动时连接数据库
- **THEN** 系统 SHALL 验证数据库 schema 与 Drizzle schema 定义的一致性

#### Scenario: 查询构建器使用

- **WHEN** 执行复杂的数据查询（如层级主题查询）
- **THEN** 开发者 SHALL 能使用 Drizzle Query Builder 构建类型安全的 SQL 查询

### Requirement: PostgreSQL 原生实时通信

系统 SHALL 使用 PostgreSQL 的 LISTEN/NOTIFY 功能实现 Server-Sent Events (SSE)，无需 Redis 中转直接提供实时数据推送。

#### Scenario: 主题变更实时通知

- **WHEN** 用户创建、更新或删除主题
- **THEN** 系统 SHALL 通过 PostgreSQL LISTEN/NOTIFY 立即向相关频道推送变更通知

#### Scenario: 大量并发 SSE 连接

- **WHEN** 多个用户同时监听同一频道的实时更新
- **THEN** 系统 SHALL 支持至少 100 个并发 SSE 连接，保持稳定的实时通信

#### Scenario: 连接断开处理

- **WHEN** 客户端 SSE 连接意外断开
- **THEN** 系统 SHALL 检测连接状态并支持客户端自动重连，无数据丢失

## MODIFIED Requirements

### Requirement: Topics 数据模型

系统 SHALL 支持完整的主题数据模型，包含层级关系、空间位置信息和元数据，支持复杂的协作场景。

#### Scenario: 主题层级关系管理

- **WHEN** 用户创建子主题或移动主题层级
- **THEN** 系统 SHALL 正确维护父子关系，支持无限层级嵌套和级联操作

#### Scenario: 主题空间位置管理

- **WHEN** 用户在画布上拖拽或调整主题位置
- **THEN** 系统 SHALL 准确存储和更新主题的 x、y 坐标以及 w、h 尺寸信息

#### Scenario: 主题元数据和标签

- **WHEN** 用户为主题添加自定义元数据或标签
- **THEN** 系统 SHALL 支持结构化元数据存储和标签数组的查询功能

### Requirement: API 接口兼容性

系统 SHALL 保持与现有 API 接口的完全兼容性，确保前端应用无需修改即可正常工作。

#### Scenario: 现有 API 调用兼容

- **WHEN** 前端应用调用现有的主题 CRUD API
- **THEN** 所有 API 接口 SHALL 保持原有的请求/响应格式和行为

#### Scenario: 错误处理兼容

- **WHEN** API 调用遇到错误或异常情况
- **THEN** 系统 SHALL 返回与现有系统一致的错误格式和 HTTP 状态码

#### Scenario: 性能基准保持

- **WHEN** 执行标准的主题查询和操作
- **THEN** API 响应时间 SHALL 不超过现有 Redis 实现的 150%

## REMOVED Requirements

### Requirement: Redis Stream 管理

**Reason**: PostgreSQL 原生 LISTEN/NOTIFY 功能提供了更直接、高效的实时通信方案，无需额外的 Redis Stream 层。
**Migration**: 所有实时通信功能迁移到 PostgreSQL 触发器和通知机制。

#### Scenario: Redis Stream 生产者移除

- **WHEN** 系统完全迁移到 PostgreSQL 架构
- **THEN** 所有 Redis Stream 生产者代码 SHALL 被移除，替换为 PostgreSQL 触发器

#### Scenario: Redis Stream 消费者移除

- **WHEN** 客户端连接 SSE 端点
- **THEN** 系统 SHALL 使用 PostgreSQL LISTEN 而非 Redis Stream 消费者

### Requirement: Redis 数据缓存

**Reason**: PostgreSQL 的性能足够支撑当前负载，无需额外的缓存层增加系统复杂性。
**Migration**: 所有数据查询直接访问 PostgreSQL，通过数据库索引优化性能。

#### Scenario: 直接数据库查询

- **WHEN** 应用需要读取主题或频道数据
- **THEN** 系统 SHALL 直接查询 PostgreSQL，无需 Redis 缓存层

#### Scenario: 缓存失效逻辑移除

- **WHEN** 数据发生变更
- **THEN** 系统 SHALL 移除所有 Redis 缓存失效相关的代码和逻辑

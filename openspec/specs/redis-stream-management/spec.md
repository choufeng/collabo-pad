## Purpose

**[REMOVED]** 此规范已被完全移除。Redis Stream 管理功能已从系统中完全移除，改用 PostgreSQL 数据存储替代。

## Requirements

### Requirement: Redis Stream 管理 (已移除)

系统 SHALL 完全移除 Redis Stream 管理功能，包括所有相关的 API、类型定义、测试组件和文档。

#### Scenario: 移除 Redis 依赖和配置

- **WHEN** 系统启动时
- **THEN** 系统 SHALL 不尝试连接到 Redis 服务器
- **AND** 应用 SHALL 正常启动和运行，无 Redis 相关错误
- **AND** 构建过程 SHALL 成功完成，无缺失依赖错误

#### Scenario: 移除相关代码和组件

- **WHEN** 开发者查看代码库
- **THEN** 系统 SHALL 不包含 RedisService 类和相关功能
- **AND** SHALL 不包含 Redis 类型定义
- **AND** SHALL 不包含 Redis API 路由
- **AND** SHALL 不包含 Redis 测试组件

#### Scenario: 更新健康检查

- **WHEN** 客户端调用健康检查 API
- **THEN** 响应 SHALL 不包含 Redis 状态字段
- **AND** 整体健康状态计算 SHALL 不依赖 Redis 状态

#### Scenario: 更新文档和配置

- **WHEN** 开发者阅读项目文档
- **THEN** 文档 SHALL 不包含 Redis 安装、配置或使用说明
- **AND** Docker 配置 SHALL 不包含 Redis 服务
- **AND** 部署文档 SHALL 不涉及 Redis 设置

### Requirement: 数据迁移 (已移除)

系统 SHALL 使用 PostgreSQL 替代 Redis 作为数据存储解决方案。

#### Scenario: 使用 PostgreSQL 数据存储

- **WHEN** 应用需要存储和检索主题数据
- **THEN** 系统 SHALL 使用 PostgreSQL 数据库
- **AND** SHALL 通过 TopicService 访问数据
- **AND** SHALL 支持完整的 CRUD 操作
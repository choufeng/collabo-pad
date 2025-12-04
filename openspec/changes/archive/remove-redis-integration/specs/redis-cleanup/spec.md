## REMOVED Requirements

### Requirement: Redis 依赖包

系统 SHALL 完全移除 ioredis 包及相关依赖，确保项目构建和运行时不再依赖 Redis 客户端库。

#### Scenario: 移除 ioredis 依赖包

- **WHEN** 开发者运行 `npm install` 或 `pnpm install`
- **THEN** 系统必须不尝试安装 ioredis 包及其依赖
- **AND** package.json 中必须不包含 ioredis 依赖项
- **AND** 构建过程必须成功完成，无缺失依赖错误

### Requirement: Redis 服务代码

系统 SHALL 完全移除 RedisService 类和相关功能，确保应用启动时不尝试建立 Redis 连接。

#### Scenario: 移除 Redis 服务文件

- **WHEN** 应用启动并初始化服务
- **THEN** 系统必须不尝试连接到 Redis 服务器
- **AND** 控制台必须不显示 Redis 连接相关日志
- **AND** 应用必须正常启动和运行，无 Redis 相关错误

### Requirement: Redis 类型定义

系统 SHALL 移除所有 Redis 相关的 TypeScript 类型定义，确保类型系统不包含 Redis 相关类型。

#### Scenario: 移除 Redis Stream 类型

- **WHEN** 运行 TypeScript 编译器
- **THEN** 必须不存在与 Redis 类型相关的编译错误
- **AND** 所有使用的类型都必须正确定义或替换
- **AND** 类型检查必须通过，无缺失类型错误

### Requirement: SSE 功能

系统 SHALL 移除基于 Redis Stream 的服务器推送事件功能，确保实时功能不再依赖 Redis。

#### Scenario: 移除 SSE hooks 和组件

- **WHEN** 用户与应用交互时
- **THEN** 应用必须不尝试使用 Redis Stream 进行服务器推送
- **AND** use-sse-topics hooks 必须被移除
- **AND** 相关的组件和状态管理必须更新或移除

## MODIFIED Requirements

### Requirement: 健康检查 API

系统 SHALL 修改健康检查 API，移除 Redis 状态检查，同时保持其他服务的健康检查功能。

#### Scenario: 更新健康检查响应

- **WHEN** 客户端调用 `GET /api/health`
- **THEN** 响应中必须不包含 `redis` 字段
- **AND** 整体健康状态计算必须不依赖 Redis 状态
- **AND** API 响应格式必须保持向后兼容（除了移除的字段）
- **AND** 健康检查必须仍然检查数据库和其他核心服务

### Requirement: 部署配置

系统 SHALL 更新部署配置，移除 Redis 相关的配置和服务定义。

#### Scenario: 移除 Docker 配置

- **WHEN** 应用在容器环境中部署
- **THEN** Docker 配置必须不包含 Redis 服务
- **AND** 应用启动必须不依赖 Redis 环境变量
- **AND** 部署脚本必须不尝试启动或配置 Redis

#### Scenario: 移除环境变量配置

- **WHEN** 应用在开发、测试或生产环境部署
- **THEN** 必须不需要设置 REDIS_HOST、REDIS_PORT 等环境变量
- **AND** 应用启动必须不检查这些环境变量
- **AND** 配置验证必须不包含 Redis 相关检查

### Requirement: 测试套件

系统 SHALL 更新测试套件，移除所有 Redis 相关的测试用例和测试文件。

#### Scenario: 移除 Redis 测试

- **WHEN** 运行 `npm test` 或相关测试命令
- **THEN** 必须没有失败的 Redis 相关测试
- **AND** 测试覆盖率必须保持现有水平
- **AND** 所有核心功能测试必须仍然通过
- **AND** 测试文件中必须不包含 Redis 相关的导入或引用

### Requirement: 文档

系统 SHALL 更新所有相关文档，移除 Redis 相关的配置、使用说明和架构描述。

#### Scenario: 更新项目文档

- **WHEN** 开发者阅读 README.md、部署文档或 API 文档
- **THEN** 文档必须不包含 Redis 安装、配置或使用说明
- **AND** 系统架构图必须不显示 Redis 组件
- **AND** 快速开始指南必须不涉及 Redis 设置
- **AND** API 文档必须不包含 Redis 相关的端点或说明

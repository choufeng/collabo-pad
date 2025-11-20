# topic-management Specification

## Purpose
TBD - created by archiving change add-topic-api-with-sse. Update Purpose after archive.
## Requirements
### Requirement: 主题创建和管理API

系统 MUST 提供主题创建和管理功能，支持用户创建包含层级关系和频道归属的主题内容。

#### Scenario: 创建新主题

- **WHEN** 用户提交创建主题请求，包含父主题ID、频道ID、内容、用户ID和用户名
- **THEN** 系统必须验证所有必需参数的存在性和有效性
- **AND** 必须将主题数据存储到以频道ID区分的Redis Stream中
- **AND** 必须返回新创建主题的唯一标识符
- **AND** 必须通过SSE推送新主题创建通知给订阅该频道的用户

#### Scenario: 主题数据结构验证

- **WHEN** 接收到主题创建请求时
- **THEN** 系统必须验证父主题ID的格式（可选）
- **AND** 必须验证频道ID的有效性（必需）
- **AND** 必须验证内容不为空且长度在合理范围内
- **AND** 必须验证用户ID和用户名的有效性
- **AND** 必须提供清晰的错误信息给客户端

### Requirement: 基于频道的实时SSE推送

系统 MUST 提供基于频道ID的服务器推送事件接口，支持实时数据推送和历史数据获取。

#### Scenario: 建立SSE连接获取历史数据

- **WHEN** 客户端请求 `/api/sse/channel/[channelId]` 建立SSE连接
- **THEN** 系统必须立即发送该频道Stream中的所有历史消息
- **AND** 必须按时间倒序排列历史消息
- **AND** 必须在连接建立时发送连接确认消息
- **AND** 必须设置适当的SSE响应头

#### Scenario: 实时推送新主题消息

- **WHEN** 有新主题被创建到指定频道
- **THEN** 系统必须立即通过SSE推送新主题数据给所有订阅该频道的客户端
- **AND** 必须包含完整的主题信息和时间戳
- **AND** 必须保持推送的实时性和可靠性
- **AND** 必须处理消息去重和顺序保证

#### Scenario: SSE连接管理和心跳

- **WHEN** SSE连接建立后
- **THEN** 系统必须定期发送心跳消息保持连接活跃
- **AND** 必须监控连接状态并处理断线重连
- **AND** 必须在连接关闭时清理相关资源
- **AND** 必须提供连接状态指示

### Requirement: Redis Stream主题数据管理

系统 MUST 提供基于Redis Stream的主题数据存储和查询功能。

#### Scenario: 主题数据存储到Stream

- **WHEN** 创建新主题时
- **THEN** 系统必须将主题数据结构化存储到以频道ID命名的Redis Stream中
- **AND** 必须使用统一的字段名：parent_id, channel_id, content, user_id, user_name, timestamp
- **AND** 必须自动生成消息ID作为主题的唯一标识符
- **AND** 必须保持数据的完整性和一致性

#### Scenario: 频道Stream查询和过滤

- **WHEN** 请求特定频道的主题数据时
- **THEN** 系统必须使用XRANGE命令获取指定范围内的消息
- **AND** 必须支持按时间戳和消息ID进行过滤
- **AND** 必须提供分页功能处理大量数据
- **AND** 必须优化查询性能避免阻塞

### Requirement: 主题数据类型和安全

系统 MUST 提供完整的类型定义和数据安全保障。

#### Scenario: 主题数据类型定义

- **WHEN** 定义主题数据结构时
- **THEN** 必须包含所有必需字段：id, parent_id, channel_id, content, user_id, user_name, timestamp
- **AND** 必须支持可选字段：metadata, tags, status
- **AND** 必须提供TypeScript类型接口
- **AND** 必须支持数据序列化和反序列化

#### Scenario: API安全和输入验证

- **WHEN** 处理主题API请求时
- **THEN** 系统必须实施输入长度限制防止注入攻击
- **AND** 必须过滤HTML和JavaScript标签防止XSS
- **AND** 必须验证用户权限和身份
- **AND** 必须记录操作日志用于审计


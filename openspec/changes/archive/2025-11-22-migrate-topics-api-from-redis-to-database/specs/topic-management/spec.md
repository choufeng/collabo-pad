## MODIFIED Requirements

### Requirement: 主题创建和管理API

系统 MUST 提供主题创建和管理功能，支持用户通过PostgreSQL数据库创建包含层级关系和频道归属的主题内容。系统 SHALL 使用PostgreSQL替代Redis Stream作为主要数据存储，提供完整的CRUD操作和复杂查询功能。

#### Scenario: 通过API创建新主题存储到PostgreSQL

- **WHEN** 用户通过API创建新主题
- **THEN** 系统必须调用TopicService将数据存储到PostgreSQL数据库
- **AND** 必须返回包含数据库生成UUID的响应
- **AND** 必须支持字符串和UUID格式的channelId和userId
- **AND** 必须触发PostgreSQL NOTIFY/SSE通知

#### Scenario: 通过API更新主题

- **WHEN** 用户修改现有主题的内容或位置
- **THEN** 系统必须调用TopicService更新PostgreSQL中的数据
- **AND** 必须更新updatedAt时间戳
- **AND** 必须触发SSE通知变更

#### Scenario: 通过API删除主题处理级联关系

- **WHEN** 用户删除一个有子主题的父主题
- **THEN** 系统必须调用TopicService删除父主题及其所有子主题
- **AND** 操作必须在事务中执行保证数据一致性
- **AND** 必须触发SSE通知删除事件

#### Scenario: 获取主题层级结构

- **WHEN** 请求频道的主题层级结构
- **THEN** 系统必须调用TopicService构建树形结构
- **AND** 必须正确反映父子关系
- **AND** 必须支持多层嵌套结构

### Requirement: 基于频道的实时SSE推送

系统 MUST 提供基于频道ID的PostgreSQL原生SSE推送接口，支持实时数据推送和历史数据获取，无需Redis依赖。

#### Scenario: 建立SSE连接获取PostgreSQL历史数据

- **WHEN** 客户端请求 `/api/sse/channel/[channelId]` 建立SSE连接
- **THEN** 系统必须从PostgreSQL查询该频道所有历史主题数据
- **AND** 必须按时间倒序排列历史消息
- **AND** 必须在连接建立时发送连接确认消息
- **AND** 必须使用PostgreSQL LISTEN/NOTIFY机制

#### Scenario: 实时推送新主题消息通过PostgreSQL

- **WHEN** 有新主题被创建到PostgreSQL指定频道
- **THEN** 系统必须通过PostgreSQL NOTIFY触发SSE推送
- **AND** 必须包含完整的主题信息和时间戳
- **AND** 必须保持推送的实时性和可靠性
- **AND** 必须处理消息去重和顺序保证

### Requirement: PostgreSQL主题数据管理

系统 MUST 提供基于PostgreSQL数据库的主题数据存储和查询功能，支持复杂查询、关系操作和数据分析。

#### Scenario: 主题数据存储到PostgreSQL

- **WHEN** 创建新主题时
- **THEN** 系统必须将主题数据结构化存储到PostgreSQL topics表中
- **AND** 必须使用统一的字段名：id (UUID), channel_id (text), parent_id (UUID), content, user_id, user_name
- **AND** 必须自动生成UUID作为主题的唯一标识符
- **AND** 必须支持坐标和尺寸的decimal类型存储

#### Scenario: 复杂查询和关系操作

- **WHEN** 请求特定条件的主题数据时
- **THEN** 系统必须使用SQL查询支持复杂过滤和关系操作
- **AND** 必须支持按频道、用户、时间等多维度过滤
- **AND** 必须支持排序和分页
- **AND** 必须支持层级关系查询

## REMOVED Requirements

### Requirement: Redis Stream主题数据管理

**Reason**: 系统已完全迁移到PostgreSQL，不再需要Redis Stream作为主题数据存储。

**Migration**: 所有主题数据管理功能已迁移到PostgreSQL，使用TopicService和原生SQL查询。

#### Scenario: 主题数据存储到Stream

- **WHEN** 创建新主题时
- **THEN** 系统不再使用Redis Stream存储
- **AND** 所有数据操作都通过PostgreSQL完成
- **AND** Redis相关代码已清理

#### Scenario: 频道Stream查询和过滤

- **WHEN** 请求特定频道的主题数据时
- **THEN** 系统不再使用XRANGE命令
- **AND** 使用PostgreSQL查询替代Redis Stream操作
- **AND** 提供更强大的查询和过滤能力

### Requirement: Redis-Database数据同步

**Reason**: 数据存储统一到PostgreSQL后，消除了数据同步的复杂性和风险。

**Migration**: 移除所有Redis和数据库之间的同步逻辑，简化系统架构。

#### Scenario: 消除数据同步复杂性

- **WHEN** 系统运行时
- **THEN** 无需维护Redis和数据库之间的数据同步
- **AND** 消除数据不一致的风险
- **AND** 减少系统维护复杂度
- **AND** 提高数据可靠性
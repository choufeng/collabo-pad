## MANDATED REQUIREMENTS

### Requirement: IndexedDB 数据库架构

系统 SHALL 基于 dexie.js 建立标准化的 IndexedDB 数据库架构。

#### Scenario: 数据库初始化

- **WHEN** 应用首次启动时
- **THEN** 必须创建名为 `collaboPadDB` 的 IndexedDB 数据库
- **AND** 数据库版本必须设置为 1
- **AND** 必须建立 User、Channel 和 UserSession 三个主要表
- **AND** 必须配置正确的索引和主键约束
- **AND** 数据库初始化失败必须提供详细的错误信息

#### Scenario: User 表结构

- **WHEN** 定义用户数据结构时
- **THEN** User 表必须包含以下字段：
  - `id`: 主键，字符串类型，自动生成的唯一标识
  - `username`: 字符串类型，用户名，最大长度100字符
  - `createdAt`: Date 类型，创建时间，自动生成
  - `updatedAt`: Date 类型，更新时间，自动更新
- **AND** 必须在 username 字段上建立唯一索引
- **AND** 必须支持按 username 和 id 的快速查询

#### Scenario: Channel 表结构

- **WHEN** 定义频道数据结构时
- **THEN** Channel 表必须包含以下字段：
  - `id`: 主键，字符串类型，用户输入的频道ID
  - `name`: 可选字符串类型，频道显示名称
  - `userId`: 字符串类型，所属用户ID，外键关联
  - `createdAt`: Date 类型，创建时间，自动生成
  - `updatedAt`: Date 类型，更新时间，自动更新
- **AND** 必须在 userId 字段上建立索引
- **AND** 必须支持按 userId 和 id 的组合查询

#### Scenario: UserSession 表结构

- **WHEN** 定义会话数据结构时
- **THEN** UserSession 表必须包含以下字段：
  - `id`: 主键，固定值为 'current_session'
  - `currentUserId`: 可选字符串类型，当前登录用户ID
  - `currentChannelId`: 可选字符串类型，当前活动频道ID
  - `lastActiveAt`: Date 类型，最后活动时间，自动更新
- **AND** 必须始终只包含一条记录
- **AND** 必须支持快速读写操作

### Requirement: 数据库操作接口

系统 SHALL 提供完整的数据库操作接口，支持所有 CRUD 操作。

#### Scenario: 用户数据操作

- **WHEN** 操作用户数据时
- **THEN** 必须提供 `createUser` 方法创建新用户
- **AND** 必须提供 `getUser` 方法按 ID 查询用户
- **AND** 必须提供 `getUserByUsername` 方法按用户名查询用户
- **AND** 必须提供 `updateUser` 方法更新用户信息
- **AND** 必须提供 `deleteUser` 方法删除用户记录
- **AND** 所有操作必须返回 Promise 并支持异步处理

#### Scenario: 频道数据操作

- **WHEN** 操作频道数据时
- **THEN** 必须提供 `createChannel` 方法创建新频道
- **AND** 必须提供 `getChannel` 方法按 ID 查询频道
- **AND** 必须提供 `getChannelsByUser` 方法查询用户的所有频道
- **AND** 必须提供 `updateChannel` 方法更新频道信息
- **AND** 必须提供 `deleteChannel` 方法删除频道记录
- **AND** 必须提供 `channelExists` 方法检查频道是否已存在

#### Scenario: 会话数据操作

- **WHEN** 操作会话数据时
- **THEN** 必须提供 `getUserSession` 方法获取当前会话
- **AND** 必须提供 `updateUserSession` 方法更新会话信息
- **AND** 必须提供 `clearUserSession` 方法清除会话数据
- **AND** 必须提供 `refreshSession` 方法刷新最后活动时间
- **AND** 会话操作必须是原子性的

### Requirement: 数据完整性和约束

系统 SHALL 确保数据的完整性和一致性。

#### Scenario: 唯一性约束

- **WHEN** 插入用户数据时
- **THEN** 用户名必须保持唯一性
- **AND** 重复的用户名必须抛出特定的错误
- **AND** 必须提供按用户名查找现有用户的便捷方法
- **AND** 用户ID必须自动生成且保证唯一

- **WHEN** 插入频道数据时
- **THEN** 同一用户下的频道ID必须保持唯一性
- **AND** 频道ID与用户的组合必须是唯一的
- **AND** 重复的频道必须返回现有记录而不是创建新记录

#### Scenario: 外键约束

- **WHEN** 创建频道时
- **THEN** userId 必须引用有效的用户记录
- **AND** 引用不存在的用户必须抛出错误
- **AND** 删除用户时必须级联删除相关频道
- **AND** 必须支持数据完整性检查

#### Scenario: 数据验证

- **WHEN** 存储数据时
- **THEN** 用户名不能为空且长度不超过100字符
- **AND** 频道ID不能为空且符合格式要求
- **AND** 必须验证字符串字段的最大长度
- **AND** 时间戳字段必须自动管理
- **AND** 无效数据必须被拒绝并记录错误

## MODIFIED Requirements

### Requirement: 性能优化

数据存储层 MUST 提供高效的数据访问性能。

#### Scenario: 查询优化

- **WHEN** 执行数据查询时
- **THEN** 必须充分利用索引优化查询性能
- **AND** 必须支持分页查询避免一次性加载大量数据
- **AND** 必须提供批量操作接口减少数据库调用
- **AND** 常用查询路径必须建立复合索引
- **AND** 查询结果必须支持缓存机制

#### Scenario: 事务管理

- **WHEN** 执行多个相关操作时
- **THEN** 必须支持数据库事务确保数据一致性
- **AND** 事务失败必须能够完整回滚
- **AND** 必须提供事务重试机制
- **AND** 长时间事务必须支持超时处理
- **AND** 事务隔离级别必须符合业务需求

### Requirement: 错误处理和恢复

系统 MUST 提供完善的错误处理和数据恢复机制。

#### Scenario: 数据库错误处理

- **WHEN** 数据库操作失败时
- **THEN** 必须区分不同类型的数据库错误
- **AND** 必须提供用户友好的错误信息
- **AND** 必须支持自动重试机制
- **AND** 必须记录详细的错误日志
- **AND** 必须提供数据恢复建议

#### Scenario: 数据迁移和升级

- **WHEN** 数据库结构发生变化时
- **THEN** 必须支持数据库版本升级
- **AND** 必须提供数据迁移脚本
- **AND** 升级失败必须能够回滚到原版本
- **AND** 必须备份重要数据防止丢失
- **AND** 必须测试迁移过程的完整性

# 数据存储 - UserSession键路径修复

## Purpose

修复用户会话管理中的IndexedDB键路径错误，确保会话数据能够正确存储和检索。

## MODIFIED Requirements

### Requirement: 会话管理键路径修复

系统 SHALL 修复userSessions表的键路径配置，解决IndexedDB操作错误。

#### Scenario: 修正数据库键路径

- **WHEN** 用户会话数据需要存储时
- **THEN** userSessions表必须使用自增主键"++id"作为主键
- **AND** 必须为currentUserId和lastActiveAt字段创建索引
- **AND** 必须确保数据库操作不再抛出键路径错误

#### Scenario: 更新UserSession接口

- **WHEN** 定义UserSession类型时
- **THEN** 必须添加可选的id字段作为主键
- **AND** currentUserId字段必须保持string | null类型
- **AND** 接口必须与新的数据库模式匹配

#### Scenario: 修复数据库操作逻辑

- **WHEN** 更新用户会话时
- **THEN** 必须使用正确的IndexedDB操作方法
- **AND** 必须处理新增和更新的不同场景
- **AND** 必须确保数据完整性不受影响

### Requirement: 数据操作错误处理增强

系统 SHALL 增强数据库操作的错误处理机制，提供更好的调试信息。

#### Scenario: 数据库操作包装

- **WHEN** 执行任何IndexedDB操作时
- **THEN** 必须使用try-catch包装操作
- **AND** 必须记录详细的错误信息到控制台
- **AND** 必须提供用户友好的错误提示（如适用）

#### Scenario: 数据验证

- **WHEN** 准备存储用户会话数据时
- **THEN** 必须验证currentUserId字段的有效性
- **AND** 必须验证lastActiveAt字段为有效Date对象
- **AND** 无效数据必须被拒绝或修复

#### Scenario: 会话数据清理

- **WHEN** 应用启动时
- **THEN** 必须检查并清理无效的会话数据
- **AND** 必须处理数据库版本兼容性问题
- **AND** 必须确保数据结构的一致性

## ADDED Requirements

### Requirement: 会话数据迁移支持

系统 SHALL 提供安全的会话数据迁移机制，确保从旧模式到新模式的平滑过渡。

#### Scenario: 数据库版本检查

- **WHEN** 应用初始化数据库时
- **THEN** 必须检查当前数据库版本
- **AND** 必须检测模式变更需求
- **AND** 必须执行必要的迁移操作

#### Scenario: 向后兼容性

- **WHEN** 处理现有会话数据时
- **THEN** 必须支持从旧键路径格式迁移数据
- **AND** 必须保留用户登录状态
- **AND** 必须避免数据丢失

### Requirement: 会话管理API优化

系统 SHALL 优化会话管理API，提高可靠性和易用性。

#### Scenario: 会话创建API

- **WHEN** 创建新用户会话时
- **THEN** 必须自动生成唯一的会话记录
- **AND** 必须设置正确的创建时间
- **AND** 必须返回操作结果状态

#### Scenario: 会话更新API

- **WHEN** 更新现有会话时
- **THEN** 必须通过主键定位记录
- **AND** 必须更新lastActiveAt字段
- **AND** 必须处理并发更新冲突

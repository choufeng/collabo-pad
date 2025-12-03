## MODIFIED Requirements

### Requirement: 简化的数据存储架构

数据存储层 SHALL 进一步简化，移除频道相关的所有存储操作，专注于用户数据管理。

#### Scenario: 移除频道数据表

- **WHEN** 重构数据库模式时
- **THEN** 必须从数据库中移除 channels 表
- **AND** 必须移除频道相关的索引和约束
- **AND** 必须保持用户表和会话表不变
- **AND** 必须确保数据库结构的简洁性

#### Scenario: 简化的数据操作接口

- **WHEN** 重构数据服务时
- **THEN** 必须移除 ChannelDataService 接口和实现
- **AND** 必须移除所有频道相关的CRUD操作
- **AND** 必须移除 createChannel、getChannel、clearChannels 方法
- **AND** 必须保持用户数据服务的完整性

#### Scenario: 简化的类型定义

- **WHEN** 更新类型系统时
- **THEN** 必须移除 Channel 接口定义
- **AND** 必须移除频道相关的类型引用
- **AND** 必须保持 User 和 UserSession 接口不变
- **AND** 必须确保类型系统的简洁性

## REMOVED Requirements

### Requirement: 频道数据持久化

系统必须完全移除频道数据的持久化功能，实现无存储的频道管理模式。

#### Scenario: 移除频道创建操作

- **WHEN** 重构首页面逻辑时
- **THEN** 必须移除 createChannel 操作
- **AND** 必须移除频道数据验证
- **AND** 必须移除频道相关的错误处理
- **AND** 必须直接使用URL中的频道ID

#### Scenario: 移除频道查询操作

- **WHEN** 重构画板页面时
- **THEN** 必须移除从数据库查询频道的操作
- **AND** 必须移除频道存在性检查
- **AND** 必须移除频道数据验证
- **AND** 必须简化页面初始化逻辑

#### Scenario: 移除频道状态管理

- **WHEN** 重构状态管理时
- **THEN** 必须移除 useChannelStore hook
- **AND** 必须移除频道相关的状态定义
- **AND** 必须移除频道相关的异步操作
- **AND** 必须简化应用状态结构

#### Scenario: 移除频道测试

- **WHEN** 重构测试套件时
- **THEN** 必须移除所有频道相关的单元测试
- **AND** 必须移除频道数据服务的集成测试
- **AND** 必须移除频道状态管理的测试
- **AND** 必须保持测试套件的简洁性

#### Scenario: 移除频道数据库操作

- **WHEN** 清理数据库代码时
- **THEN** 必须移除频道表的数据库操作
- **AND** 必须移除频道相关的查询方法
- **AND** 必须移除频道相关的索引操作
- **AND** 必须确保数据库代码的整洁性

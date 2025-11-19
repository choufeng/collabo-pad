## Purpose

定义应用的数据存储策略和架构，包括用户数据、频道数据和会话管理的完整持久化方案，确保数据的一致性、可靠性和性能。

## Requirements

### Requirement: 数据持久化基础

系统 MUST 提供可靠的数据持久化机制，确保用户数据在浏览器会话之间保持一致。

#### Scenario: 基础存储能力

- **WHEN** 应用需要存储数据时
- **THEN** 系统必须使用 IndexedDB 作为主要存储机制
- **AND** 必须提供数据备份和恢复机制
- **AND** 必须处理存储容量限制和错误情况

### Requirement: 数据存储架构

数据存储层 MUST 简化为只包含必要的操作，移除过度设计的功能。

#### Scenario: 简化的数据库结构

- **WHEN** 设计数据库表结构时
- **THEN** 用户表必须只包含 id、username、createdAt 字段
- **AND** 必须移除 updatedAt 字段（不需要更新操作）
- **AND** 必须保持与现有频道管理的兼容性
- **AND** 必须确保数据的原子性操作

#### Scenario: 简化的数据操作接口

- **WHEN** 定义数据服务接口时
- **THEN** 必须只提供 createOrGetUser 和 getCurrentUser 方法
- **AND** 必须移除 getUser、getUserByUsername、updateUser、deleteUser 方法
- **AND** 必须保持接口的简洁性和易用性
- **AND** 必须提供清晰的类型定义

#### Scenario: 简化的会话管理

- **WHEN** 管理用户会话时
- **THEN** 会话表必须只包含 currentUserId 和 lastActiveAt 字段
- **AND** 必须移除 currentChannelId 字段（移至频道管理）
- **AND** 必须确保会话数据的自动更新
- **AND** 必须支持会话的快速恢复

### Requirement: 测试用例简化

测试规范 MUST 移除不必要的测试用例，专注于核心功能验证。

#### Scenario: 核心功能测试

- **WHEN** 编写数据库服务测试时
- **THEN** 必须测试用户创建功能
- **AND** 必须测试用户获取功能
- **AND** 必须测试重复创建的处理
- **AND** 必须移除所有 CRUD 操作的过度测试

#### Scenario: Mock 简化

- **WHEN** 创建测试 Mock 对象时
- **THEN** 必须简化 Mock 实现，只模拟必要的方法
- **AND** 必须移除复杂的 Dexie Mock 逻辑
- **AND** 必须使用简单的内存数据结构
- **AND** 必须确保 Mock 的性能和可靠性

### Requirement: 简化的用户数据服务

系统 SHALL 提供简化的用户数据管理服务，专注于实际使用场景。

#### Scenario: 自动用户创建

- **WHEN** 用户首次输入用户名时
- **THEN** 系统必须自动创建用户记录
- **AND** 必须为用户生成唯一的 UUID 标识符
- **AND** 必须存储用户名和创建时间
- **AND** 用户创建操作必须是幂等的

#### Scenario: 用户数据获取

- **WHEN** 应用启动或需要获取当前用户时
- **THEN** 系统必须提供获取当前用户的方法
- **AND** 必须从 IndexedDB 中恢复用户数据
- **AND** 如果没有用户数据必须返回 null
- **AND** 获取操作必须是快速和高效的

#### Scenario: 用户数据持久化

- **WHEN** 用户数据发生变化时
- **THEN** 系统必须自动将数据持久化到 IndexedDB
- **AND** 必须确保数据的完整性和一致性
- **AND** 必须支持应用重启后的数据恢复
- **AND** 必须提供简单的错误处理机制

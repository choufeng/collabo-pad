## MANDATED REQUIREMENTS

### Requirement: Zustand 状态架构

系统 SHALL 基于 Zustand 建立分层的状态管理架构。

#### Scenario: 状态结构设计

- **WHEN** 设计状态管理时
- **THEN** 必须分离用户状态和频道状态为独立的 Store
- **AND** 每个状态必须包含状态数据、操作方法和异步操作
- **AND** 必须定义清晰的 TypeScript 接口
- **AND** 状态结构必须支持序列化和持久化
- **AND** 必须避免状态的循环依赖

#### Scenario: 用户状态 Store

- **WHEN** 定义用户状态时
- **THEN** UserStore 必须包含以下状态：
  - `currentUser`: User | null，当前登录用户
  - `isLoading`: boolean，加载状态标识
  - `error`: string | null，错误信息
- **AND** 必须包含以下操作方法：
  - `setCurrentUser`: 设置当前用户
  - `setLoading`: 设置加载状态
  - `setError`: 设置错误信息
- **AND** 必须包含以下异步操作：
  - `createOrUpdateUser`: 创建或更新用户
  - `loadCurrentUser`: 从 IndexedDB 加载用户
  - `clearCurrentUser`: 清除当前用户

#### Scenario: 频道状态 Store

- **WHEN** 定义频道状态时
- **THEN** ChannelStore 必须包含以下状态：
  - `currentChannel`: Channel | null，当前活动频道
  - `userChannels`: Channel[]，用户的所有频道
  - `isLoading`: boolean，加载状态标识
  - `error`: string | null，错误信息
- **AND** 必须包含以下操作方法：
  - `setCurrentChannel`: 设置当前频道
  - `setUserChannels`: 设置用户频道列表
  - `addChannel`: 添加新频道到列表
  - `removeChannel`: 从列表移除频道
  - `setLoading`: 设置加载状态
  - `setError`: 设置错误信息
- **AND** 必须包含以下异步操作：
  - `createChannel`: 创建新频道
  - `loadUserChannels`: 加载用户的所有频道
  - `switchChannel`: 切换到指定频道
  - `updateChannel`: 更新频道信息

### Requirement: 持久化同步机制

系统 SHALL 实现 Zustand 状态与 IndexedDB 的双向同步。

#### Scenario: 状态持久化

- **WHEN** Zustand 状态发生变化时
- **THEN** 用户状态变化必须自动同步到 IndexedDB
- **AND** 频道状态变化必须自动同步到 IndexedDB
- **AND** 必须使用防抖机制避免频繁写入
- **AND** 同步失败必须保持状态一致性
- **AND** 必须提供同步状态指示器

#### Scenario: 状态恢复

- **WHEN** 应用启动时
- **THEN** 必须从 IndexedDB 恢复用户状态
- **AND** 必须从 IndexedDB 恢复频道状态
- **AND** 恢复失败必须提供默认状态
- **AND** 必须验证恢复数据的完整性
- **AND** 必须支持选择性状态恢复

#### Scenario: 会话状态管理

- **WHEN** 管理用户会话时
- **THEN** 必须创建独立的会话状态管理
- **AND** 必须跟踪用户的最后活动时间
- **AND** 必须支持会话过期检测
- **AND** 会话状态必须与其他状态解耦
- **AND** 必须支持会话的创建、更新和清理

### Requirement: 状态访问和订阅

系统 SHALL 提供便捷的状态访问和订阅机制。

#### Scenario: 状态访问接口

- **WHEN** 组件需要访问状态时
- **THEN** 必须提供类型安全的状态选择器
- **AND** 必须支持计算属性和派生状态
- **AND** 必须提供状态只读访问保护
- **AND** 必须支持状态的批量操作
- **AND** 必须提供状态调试工具

#### Scenario: 状态订阅机制

- **WHEN** 组件订阅状态变化时
- **THEN** 必须支持细粒度的状态订阅
- **AND** 必须避免不必要的组件重渲染
- **AND** 必须支持状态变化的条件订阅
- **AND** 订阅清理必须自动处理
- **AND** 必须提供订阅生命周期管理

## MODIFIED Requirements

### Requirement: 性能优化

状态管理 MUST 提供高性能的状态更新和访问。

#### Scenario: 状态更新优化

- **WHEN** 更新状态时
- **THEN** 必须使用不可变更新模式
- **AND** 必须支持状态的部分更新
- **AND** 必须优化状态比较算法
- **AND** 必须避免不必要的状态计算
- **AND** 必须提供状态更新批处理

#### Scenario: 内存管理

- **WHEN** 管理状态内存时
- **THEN** 必及时清理未使用的状态数据
- **AND** 必须避免内存泄漏
- **AND** 必须监控状态内存使用情况
- **AND** 必须支持状态数据的懒加载
- **AND** 必须优化大型状态数据的存储

### Requirement: 错误处理和调试

系统 MUST 提供完善的错误处理和状态调试功能。

#### Scenario: 错误边界处理

- **WHEN** 状态操作发生错误时
- **THEN** 必须捕获并处理状态错误
- **AND** 必须提供错误恢复机制
- **AND** 必须记录详细的错误上下文
- **AND** 必须支持状态回滚操作
- **AND** 必须提供用户友好的错误提示

#### Scenario: 状态调试工具

- **WHEN** 开发和调试时
- **THEN** 必须提供状态变化的完整日志
- **AND** 必须支持状态时间旅行调试
- **AND** 必须提供状态结构的可视化
- **AND** 必须支持状态变化的条件断点
- **AND** 必须集成浏览器开发者工具

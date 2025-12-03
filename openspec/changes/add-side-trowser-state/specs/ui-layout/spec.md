## ADDED Requirements

### Requirement: SideTrowser状态管理

系统 SHALL 提供基于zustand的SideTrowser状态管理功能。

#### Scenario: 侧边栏初始状态

- **WHEN** 应用程序初始化时
- **THEN** SideTrowser默认状态为关闭
- **AND** 状态必须通过zustand store进行管理
- **AND** 状态变更必须支持开发者工具调试

#### Scenario: 侧边栏状态切换

- **WHEN** 用户触发侧边栏开关操作时
- **THEN** 必须通过store提供的操作方法进行状态变更
- **AND** 状态变更必须响应式更新所有订阅组件
- **AND** 必须支持open、close、toggle三种操作方式
- **AND** 状态变更必须记录调试信息

#### Scenario: 跨组件状态共享

- **WHEN** 多个组件需要访问SideTrowser状态时
- **THEN** 所有组件必须通过统一的store hook获取状态
- **AND** 状态变更必须在所有订阅组件中同步
- **AND** 必须支持选择性订阅状态或操作方法

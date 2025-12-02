# touch-interaction Specification

## Purpose

为触摸设备用户提供与桌面端一致的右键菜单体验，通过长按手势触发上下文菜单，同时避免与其他触摸手势冲突。

## ADDED Requirements

### Requirement: 长按手势检测

系统 SHALL 能够检测用户在画布上的长按手势并触发上下文菜单。

#### Scenario: iPad用户长按打开右键菜单

- **WHEN** 用户在iPad上访问画板应用并在画布空白区域长按超过500ms
- **THEN** 系统应该在长按位置显示右键菜单
- **AND** 菜单应该包含"Add Topic"选项
- **AND** 菜单位置应该根据视口边界自动调整

#### Scenario: 长按节点区域

- **GIVEN** 用户在iPad上访问画板应用且画布上存在节点
- **WHEN** 用户在节点区域长按超过500ms
- **THEN** 系统应该显示节点相关的右键菜单
- **AND** 菜单应该包含针对节点的操作选项

### Requirement: 触觉反馈支持

系统 SHALL 在检测到长按手势时提供触觉反馈，增强用户体验。

#### Scenario: 长按触觉反馈

- **GIVEN** 用户在支持的设备上使用应用
- **WHEN** 用户长按超过500ms阈值
- **THEN** 系统应该触发轻度的触觉反馈振动
- **AND** 反馈应该在菜单显示之前发生

### Requirement: 手势冲突避免

长按手势检测 SHALL 与现有的滚动、缩放和拖拽操作兼容，不产生冲突。

#### Scenario: 滚动不触发长按

- **GIVEN** 用户在iPad上访问画板应用
- **WHEN** 用户快速滑动滚动画布（持续时间<300ms）
- **THEN** 系统应该执行滚动操作
- **AND** 不应该触发右键菜单

#### Scenario: 节点拖拽不触发长按

- **GIVEN** 用户在iPad上访问画板应用且画布上存在可拖拽的节点
- **WHEN** 用户开始拖拽节点在300ms内移动超过10px
- **THEN** 系统应该执行节点拖拽操作
- **AND** 不应该触发右键菜单

### Requirement: 设备兼容性检测

系统 SHALL 自动检测设备类型并为触摸设备启用长按手势支持。

#### Scenario: 桌面端保持原有行为

- **GIVEN** 用户在桌面设备上使用鼠标
- **WHEN** 用户右键点击画布
- **THEN** 系统应该使用原有的右键菜单处理逻辑
- **AND** 不应该启用触摸长按检测

#### Scenario: 移动设备自动适配

- **GIVEN** 用户在触摸设备上访问应用
- **WHEN** 应用初始化时检测到触摸支持
- **THEN** 系统应该自动启用长按手势检测
- **AND** 同时保持右键菜单支持（如果设备支持）

### Requirement: 性能优化

长按手势检测 SHALL 不影响应用的性能表现。

#### Scenario: 高频触摸操作

- **GIVEN** 用户在触摸设备上快速连续触摸
- **WHEN** 用户执行多次短时触摸操作
- **THEN** 系统应该保持流畅的性能
- **AND** 不应该出现内存泄漏或事件堆积

### Requirement: 可配置的长按时间

长按阈值 SHALL 可以根据用户需求或设备特性进行配置。

#### Scenario: 可调整长按时间

- **GIVEN** 系统管理员需要调整长按敏感度
- **WHEN** 修改长按时间配置为400ms
- **THEN** 系统应该使用新的400ms阈值
- **AND** 用户界面行为应该相应更新

## MODIFIED Requirements

### Requirement: Board组件事件处理集成

现有的Board组件右键菜单处理函数 SHALL 扩展以支持触摸事件。

#### Scenario: 统一的事件处理

- **GIVEN** Board组件处理用户交互
- **WHEN** 用户触发右键菜单（鼠标右键或长按）
- **THEN** handleContextMenu函数应该能够处理两种事件类型
- **AND** 应该生成相同的菜单内容和行为

#### Scenario: 坐标转换兼容性

- **GIVEN** 用户通过触摸触发右键菜单
- **WHEN** 系统调用screenToFlowPosition转换坐标
- **THEN** 转换结果应该与鼠标事件保持一致
- **AND** 菜单应该在正确的位置显示

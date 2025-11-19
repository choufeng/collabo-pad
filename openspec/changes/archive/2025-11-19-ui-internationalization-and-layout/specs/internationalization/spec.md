# Internationalization Specification

## Purpose

定义协作画板应用国际化的技术规范，包括文本资源管理、组件i18n支持和多语言扩展性。

## ADDED Requirements

### Requirement: 文本内容英文化

系统 SHALL 将所有用户界面的中文文本内容直接替换为对应的英文文本。

#### Scenario: 文本内容直接替换

- **WHEN** 用户访问应用时
- **THEN** 所有用户可见的文本必须为英文
- **AND** 必须直接硬编码英文文本到组件中
- **AND** 必须不使用任何国际化框架或库
- **AND** 必须保持文本的一致性和准确性

#### Scenario: 文本内容一致性

- **WHEN** 替换文本内容时
- **THEN** 所有"节点"相关术语必须使用"Topic"
- **AND** 所有按钮和标签必须使用一致的英文表述
- **AND** 错误消息必须清晰易懂
- **AND** 用户指导文本必须准确

#### Scenario: 文本替换完整性

- **WHEN** 进行文本替换时
- **THEN** 必须确保所有中文文本都被识别和替换
- **AND** 必须包括界面标签、按钮文字、错误消息
- **AND** 必须包括占位符文本和帮助信息
- **AND** 必须包括可访问性相关的文本属性

### Requirement: 组件国际化改造

系统 SHALL 将所有用户界面组件改造为支持国际化文本。

#### Scenario: Board组件国际化

- **WHEN** 用户查看画板主界面时
- **THEN** 创建节点按钮必须显示"Add Topic"
- **AND** 所有用户可见文本必须为英文
- **AND** 按钮的aria-label必须本地化
- **AND** 必须保持原有的功能逻辑不变

#### Scenario: RightSidebar组件国际化

- **WHEN** 用户打开节点编辑侧边栏时
- **THEN** 侧边栏标题必须显示对应的英文文本
- **AND** "创建新节点"必须改为"Create New Node"
- **AND** "编辑节点"必须改为"Edit Node"
- **AND** "创建连接节点"必须改为"Create Connected Node"
- **AND** 关闭按钮的aria-label必须为"Close sidebar"

#### Scenario: NodeEditor组件国际化

- **WHEN** 用户编辑节点内容时
- **THEN** "节点内容"标签必须改为"Node Content"
- **AND** 表单占位符必须为"Enter node content"
- **AND** 提交按钮文本必须根据模式显示：
  - 创建模式："Create Node"
  - 编辑模式："Save Changes"
  - 连接模式："Create and Connect"
- **AND** 验证错误消息必须本地化：
  - "节点内容不能为空" → "Node content cannot be empty"
  - "节点内容不能超过500个字符" → "Node content cannot exceed 500 characters"
- **AND** 提交状态文本必须为"Saving..."

#### Scenario: 错误和状态消息国际化

- **WHEN** 系统显示错误或状态消息时
- **THEN** 所有错误消息必须为英文
- **AND** 所有状态提示必须为英文
- **AND** 连接模式提示必须为"Will create a new node and connect to source node"
- **AND** 保存失败消息必须为"Save failed, please try again"

### Requirement: 表单和验证国际化

系统 SHALL 确保所有表单字段和验证消息的国际化支持。

#### Scenario: 表单字段标签

- **WHEN** 用户填写表单时
- **THEN** 所有字段标签必须为英文
- **AND** 必须提供清晰的字段描述
- **AND** 必填字段标记必须符合国际化习惯
- **AND** 字段帮助文本必须本地化

#### Scenario: 表单验证消息

- **WHEN** 表单验证失败时
- **THEN** 所有验证错误消息必须为英文
- **AND** 错误消息必须清晰易懂
- **AND** 必须提供具体的错误位置指示
- **AND** 错误消息的语气必须专业友好

#### Scenario: 表单操作按钮

- **WHEN** 用户与表单交互时
- **THEN** 所有按钮文本必须为英文
- **AND** 按钮的disabled状态文本必须明确
- **AND** 按钮的loading状态必须适当显示
- **AND** 取消操作必须明确标识

### Requirement: 可访问性国际化

系统 SHALL 确保国际化后的界面符合可访问性标准。

#### Scenario: 屏幕阅读器支持

- **WHEN** 屏幕阅读器用户访问界面时
- **THEN** 所有aria-label必须为英文
- **AND** 按钮和链接的描述必须准确
- **AND** 表单字段的描述必须完整
- **AND** 错误消息必须被正确识别

#### Scenario: 键盘导航

- **WHEN** 键盘用户操作界面时
- **THEN** 焦点指示器必须清晰
- **AND** 操作提示必须易于理解
- **AND** 快捷键说明必须本地化
- **AND** 导航顺序必须逻辑清晰

### Requirement: 测试国际化

系统 SHALL 为国际化功能提供全面的测试覆盖。

#### Scenario: 文本内容测试

- **WHEN** 运行国际化测试时
- **THEN** 必须验证所有文本内容为英文
- **AND** 必须测试文本的动态加载
- **AND** 必须验证文本缺失的回退机制
- **AND** 必须测试文本的显示效果

#### Scenario: 功能完整性测试

- **WHEN** 测试国际化后的功能时
- **THEN** 所有原有功能必须正常工作
- **AND** 用户操作流程必须保持不变
- **AND** 表单验证逻辑必须正确
- **AND** 错误处理必须正常

#### Scenario: 用户体验测试

- **WHEN** 验证国际化用户体验时
- **THEN** 界面文本必须易于理解
- **AND** 操作流程必须直观
- **AND** 错误消息必须有帮助性
- **AND** 整体体验必须流畅

### Requirement: 文本内容维护

系统 SHALL 提供清晰的英文文本内容维护方式。

#### Scenario: 文本内容一致性维护

- **WHEN** 维护英文文本内容时
- **THEN** 必须保持术语使用的一致性
- **AND** 必须确保语法和拼写的正确性
- **AND** 必须保持用户指导的清晰性
- **AND** 必须定期审查和更新文本内容

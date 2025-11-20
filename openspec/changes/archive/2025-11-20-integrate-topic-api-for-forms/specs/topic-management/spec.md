## MODIFIED Requirements

### Requirement: 主题创建和管理API

系统 MUST 提供主题创建和管理功能，支持用户通过表单界面创建包含层级关系和频道归属的主题内容。

#### Scenario: 通过表单提交创建新主题

- **WHEN** 用户在add topic表单中输入内容并提交
- **THEN** 系统必须调用 `/api/topic/create` API接口而不是本地创建节点
- **AND** 必须传递正确的参数：channel_id, content, user_id, user_name
- **AND** 必须在API调用成功时清除表单并显示成功反馈
- **AND** 必须通过SSE接收新主题创建通知并更新界面

#### Scenario: 通过表单提交创建子主题

- **WHEN** 用户在add child topic表单中输入内容并提交
- **THEN** 系统必须调用 `/api/topic/create` API接口而不是本地创建节点
- **AND** 必须传递正确的参数：parent_id, channel_id, content, user_id, user_name
- **AND** 必须在API调用成功时清除表单并显示成功反馈
- **AND** 必须通过SSE接收新主题创建通知并更新界面

#### Scenario: 表单API调用失败处理

- **WHEN** 主题创建API调用失败（网络错误或服务器错误）
- **THEN** 系统必须在表单中显示详细的错误信息
- **AND** 必须保持用户输入的内容不被清除
- **AND** 必须提供重试机制
- **AND** 必须记录错误日志用于调试

#### Scenario: API调用过程中的加载状态

- **WHEN** 用户提交表单且API调用正在进行中
- **THEN** 系统必须禁用提交按钮防止重复提交
- **AND** 必须显示加载指示器提供用户反馈
- **AND** 必须取消键盘中的事件监听避免干扰

## ADDED Requirements

### Requirement: TDD驱动的前端API集成

系统 MUST 采用测试驱动开发(TDD)方式实现前端表单与API的集成，确保代码质量和功能可靠性。

#### Scenario: 先写失败的API集成测试

- **WHEN** 开始实现API集成功能时
- **THEN** 开发者必须先编写API调用相关的测试用例
- **AND** 测试用例必须包含成功、失败、网络错误等各种场景
- **AND** 测试用例必须在初始状态下运行失败（红阶段）

#### Scenario: 实现功能使测试通过

- **WHEN** 失败的测试用例编写完成后
- **THEN** 开发者必须实现最少的代码使测试通过（绿阶段）
- **AND** 必须优先实现API调用逻辑而不是优化代码结构
- **AND** 必须确保测试覆盖率不低于项目要求的90%

#### Scenario: 重构优化保持测试通过

- **WHEN** 所有测试都通过后
- **THEN** 开发者必须重构代码提高可维护性和性能
- **AND** 必须保持所有测试继续通过
- **AND** 必须移除重复代码和不再使用的本地创建逻辑
- **AND** 必须确保API集成代码的单一职责原则

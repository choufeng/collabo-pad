# topic-management Specification

## Purpose

TBD - created by archiving change add-topic-api-with-sse. Update Purpose after archive.

## Requirements

### Requirement: 主题创建和管理API

系统 MUST 提供主题创建和管理功能，支持用户通过表单界面创建包含层级关系和频道归属的主题内容。在创建子主题时，系统 SHALL 正确处理 parent_id 的格式转换，确保提交给 API 的数据使用原始的 topic ID 而不是 ReactFlow 节点 ID。系统 MUST 支持任意数字坐标值（包括负数）以提供完整的画板布局自由度。

#### Scenario: 通过表单提交创建新主题

- **WHEN** 用户在add topic表单中输入内容并提交
- **THEN** 系统必须调用 `/api/topic/create` API接口而不是本地创建节点
- **AND** 必须传递正确的参数：channel_id, content（原始内容）, user_id, user_name
- **AND** 必须在API调用成功时清除表单并显示成功反馈
- **AND** 必须通过SSE接收新主题创建通知并更新界面
- **AND** API返回的主题数据必须包含 content（原始）和 translated_content（翻译后）两个字段

#### Scenario: 通过表单提交创建子主题

- **WHEN** 用户在add child topic表单中输入内容并提交
- **AND** 选择的父节点 ID 为 'topic-123' 格式（ReactFlow节点ID）
- **THEN** 系统必须调用 `/api/topic/create` API接口而不是本地创建节点
- **AND** 必须在提交给API前移除 'topic-' 前缀，使用原始 ID '123' 作为 parent_id
- **AND** 必须传递正确的参数：parent_id（已清理）, channel_id, content（原始内容）, user_id, user_name
- **AND** 必须在API调用成功时清除表单并显示成功反馈
- **AND** 必须通过SSE接收新主题创建通知并更新界面
- **AND** API返回的主题数据必须包含 content（原始）和 translated_content（翻译后）两个字段

#### Scenario: Parent ID without prefix

- **WHEN** 用户在add child topic表单中提交
- **AND** 选择的父节点 ID 不包含 'topic-' 前缀
- **THEN** 系统必须直接使用该 ID 作为 parent_id，不进行任何修改
- **AND** 必须继续执行正常的API调用流程
- **AND** API返回的主题数据必须包含 content（原始）和 translated_content（翻译后）两个字段

#### Scenario: 创建包含负数坐标的主题

- **WHEN** 用户在创建主题时提供负数坐标值（如 x: -100, y: -50）
- **THEN** 系统必须接受并存储负数坐标值
- **AND** 必须不拒绝负数坐标的请求
- **AND** 必须正确返回包含负数坐标的主题数据
- **AND** 前端界面必须能够正确渲染负数位置的节点

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

#### Scenario: 坐标参数验证

- **WHEN** 用户提供坐标参数时
- **THEN** 系统必须验证x坐标是有效数字且不是NaN
- **AND** 必须验证y坐标是有效数字且不是NaN
- **AND** 必须允许负数坐标值通过验证
- **AND** 只有当坐标不是有效数字时才拒绝请求

### Requirement: 基于频道的实时SSE推送

系统 MUST 提供基于频道ID的服务器推送事件接口，支持实时数据推送和历史数据获取。

#### Scenario: 建立SSE连接获取历史数据

- **WHEN** 客户端请求 `/api/sse/channel/[channelId]` 建立SSE连接
- **THEN** 系统必须立即发送该频道Stream中的所有历史消息
- **AND** 必须按时间倒序排列历史消息
- **AND** 必须在连接建立时发送连接确认消息
- **AND** 必须设置适当的SSE响应头

#### Scenario: 实时推送新主题消息

- **WHEN** 有新主题被创建到指定频道
- **THEN** 系统必须立即通过SSE推送新主题数据给所有订阅该频道的客户端
- **AND** 必须包含完整的主题信息和时间戳
- **AND** 必须保持推送的实时性和可靠性
- **AND** 必须处理消息去重和顺序保证

#### Scenario: SSE连接管理和心跳

- **WHEN** SSE连接建立后
- **THEN** 系统必须定期发送心跳消息保持连接活跃
- **AND** 必须监控连接状态并处理断线重连
- **AND** 必须在连接关闭时清理相关资源
- **AND** 必须提供连接状态指示

### Requirement: Redis Stream主题数据管理

系统 MUST 提供基于Redis Stream的主题数据存储和查询功能。

#### Scenario: 主题数据存储到Stream

- **WHEN** 创建新主题时
- **THEN** 系统必须将主题数据结构化存储到以频道ID命名的Redis Stream中
- **AND** 必须使用统一的字段名：parent_id, channel_id, content, user_id, user_name, timestamp
- **AND** 必须自动生成消息ID作为主题的唯一标识符
- **AND** 必须保持数据的完整性和一致性

#### Scenario: 频道Stream查询和过滤

- **WHEN** 请求特定频道的主题数据时
- **THEN** 系统必须使用XRANGE命令获取指定范围内的消息
- **AND** 必须支持按时间戳和消息ID进行过滤
- **AND** 必须提供分页功能处理大量数据
- **AND** 必须优化查询性能避免阻塞

### Requirement: 主题数据类型和安全

系统 MUST 提供完整的类型定义和数据安全保障。

#### Scenario: 主题数据类型定义

- **WHEN** 定义主题数据结构时
- **THEN** 必须包含所有必需字段：id, parent_id, channel_id, content（原始内容）, translated_content（翻译内容）, user_id, user_name, timestamp
- **AND** 必须支持可选字段：metadata, tags, status
- **AND** 必须提供TypeScript类型接口
- **AND** 必须支持数据序列化和反序列化

#### Scenario: API安全和输入验证

- **WHEN** 处理主题API请求时
- **THEN** 系统必须实施输入长度限制防止注入攻击
- **AND** 必须过滤HTML和JavaScript标签防止XSS
- **AND** 必须验证用户权限和身份
- **AND** 必须记录操作日志用于审计
- **AND** 必须对 content 和 translated_content 两个字段都应用相同的安全验证

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

### Requirement: 主题多语言内容存储

系统 MUST 支持同时存储原始用户输入内容和AI翻译后的内容，以提供多语言支持功能。

#### Scenario: 创建主题时保存原始和翻译内容

- **WHEN** 用户通过 `/api/topic/create` 创建新主题时
- **THEN** 系统必须将用户输入的原始内容存储在 `content` 字段中
- **AND** 必须将AI翻译后的内容存储在 `translated_content` 字段中
- **AND** 必须保持两个内容的完整性，不丢失任何信息
- **AND** 必须在响应中返回包含两个字段的完整主题数据

#### Scenario: 查询主题时返回多语言内容

- **WHEN** 客户端请求主题数据时
- **THEN** 系统必须同时返回 `content`（原始内容）和 `translated_content`（翻译内容）
- **AND** 必须确保两个字段都包含完整内容
- **AND** 必须支持根据客户端需求选择显示哪种语言的内容

#### Scenario: 更新主题时保持多语言一致性

- **WHEN** 用户更新主题内容时
- **THEN** 系统必须重新翻译新内容并更新 `translated_content` 字段
- **AND** 必须将用户编辑的内容作为新的 `content` 字段值
- **AND** 必须保持翻译功能的一致性

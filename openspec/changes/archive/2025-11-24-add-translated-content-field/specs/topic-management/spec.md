## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: 主题创建和管理API

系统 MUST 提供主题创建和管理功能，支持用户通过表单界面创建包含层级关系和频道归属的主题内容。在创建子主题时，系统 SHALL 正确处理 parent_id 的格式转换，确保提交给 API 的数据使用原始的 topic ID 而不是 ReactFlow 节点 ID。

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

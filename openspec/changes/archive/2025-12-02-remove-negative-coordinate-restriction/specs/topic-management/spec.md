## MODIFIED Requirements

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

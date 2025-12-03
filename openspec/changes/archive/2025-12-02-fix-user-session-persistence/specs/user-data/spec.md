## MODIFIED Requirements

### Requirement: 用户数据服务扩展

用户数据服务 MUST 扩展支持查询最新用户的功能，同时保持现有API的兼容性。

#### Scenario: 获取当前用户准确性

- **WHEN** 调用 `getCurrentUser()` 方法
- **THEN** 必须返回最后活跃的用户
- **AND** 必须基于 `lastActiveAt` 时间戳降序排序获取会话
- **AND** 必须验证会话数据的有效性和完整性
- **AND** 必须过滤掉损坏或不完整的会话记录

#### Scenario: 会话数据验证

- **WHEN** 读取用户会话数据时
- **THEN** 必须验证 `currentUserId` 和 `lastActiveAt` 字段存在
- **AND** 必须确保用户数据在数据库中存在
- **AND** 必须清理过期或无效的会话记录
- **AND** 必须优雅处理数据异常情况

#### Scenario: 用户身份持久化

- **WHEN** 用户在画板页面刷新浏览器
- **THEN** 系统必须恢复相同的用户身份
- **AND** 必须使用最后登录的用户信息
- **AND** 不能随机切换到其他用户
- **AND** 必须保持界面状态的一致性

### Requirement: 用户界面状态显示

The system SHALL display current user information in the main interface for better user context awareness.

#### Scenario: 页面刷新后用户状态恢复

- **WHEN** 页面初始化时检查用户身份
- **THEN** 必须优先使用最后活跃的用户会话
- **AND** 必须验证用户数据的有效性
- **AND** 必须在用户身份无效时重定向到登录页
- **AND** 必须显示适当的加载状态指示器

#### Scenario: 用户身份验证和恢复

- **WHEN** 会话数据损坏或不存在时
- **THEN** 必须优雅降级，不影响系统稳定性
- **AND** 必须记录详细的错误日志
- **AND** 必须重定向用户到登录页面重新认证
- **AND** 必须显示友好的错误提示信息

#### Scenario: 首页用户名默认填充

- **WHEN** 用户访问首页时
- **THEN** 必须使用最后活跃的用户名填充用户名输入框
- **AND** 必须基于 `getCurrentUser()` 方法获取用户信息
- **AND** 必须确保填充的用户名是最后登录的用户
- **AND** 必须保持输入框的可编辑状态

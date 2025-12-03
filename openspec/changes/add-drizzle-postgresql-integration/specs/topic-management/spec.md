## MODIFIED Requirements

### Requirement: 主题层级管理

系统 SHALL 支持完整的主题层级关系管理，包括创建子主题、移动主题层级、级联删除等操作，使用 PostgreSQL 的外键约束保证数据完整性。

#### Scenario: 子主题创建

- **WHEN** 用户在指定主题下创建子主题
- **THEN** 系统 SHALL 建立 parent_id 外键关系，确保子主题引用有效的父主题
- **AND** 系统 SHALL 验证层级深度，防止循环引用

#### Scenario: 主题层级移动

- **WHEN** 用户将主题移动到新的父主题下
- **THEN** 系统 SHALL 更新 parent_id 并维护整个子树的结构完整性
- **AND** 系统 SHALL 防止将主题移动到自己的子主题下（循环检测）

#### Scenario: 级联删除操作

- **WHEN** 用户删除一个包含子主题的主题
- **THEN** 系统 SHALL 使用数据库级联删除自动删除所有子主题
- **AND** 系统 SHALL 通知所有相关客户端完整的删除操作结果

### Requirement: 主题空间位置管理

系统 SHALL 精确管理主题在画布上的位置和尺寸信息，支持拖拽、缩放等操作，并提供高性能的空间查询能力。

#### Scenario: 主题位置更新

- **WHEN** 用户拖拽主题到新位置
- **THEN** 系统 SHALL 原子性更新主题的 x, y 坐标
- **AND** 系统 SHALL 立即通过 SSE 向所有相关客户端推送位置变更

#### Scenario: 主题尺寸调整

- **WHEN** 用户调整主题的宽度和高度
- **THEN** 系统 SHALL 更新主题的 w, h 尺寸信息
- **AND** 系统 SHALL 保持内容布局的相对位置关系

#### Scenario: 批量位置操作

- **WHEN** 系统执行批量主题位置优化或自动布局
- **THEN** 系统 SHALL 支持事务性的批量更新操作
- **AND** 系统 SHALL 提供操作回滚机制

### Requirement: 主题查询和过滤

系统 SHALL 提供灵活的主题查询能力，支持按频道、层级、时间范围等多种条件进行高效查询。

#### Scenario: 按频道查询主题

- **WHEN** 用户请求特定频道的所有主题
- **THEN** 系统 SHALL 返回该频道的扁平主题列表，包含基本信息
- **AND** 查询响应时间 SHALL 在 100ms 以内

#### Scenario: 层级主题查询

- **WHEN** 用户请求频道的层级主题结构
- **THEN** 系统 SHALL 返回嵌套的主题树结构，包含父子关系
- **AND** 系统 SHALL 支持懒加载，只请求可见的层级分支

#### Scenario: 主题搜索和过滤

- **WHEN** 用户按关键词、标签或创建者搜索主题
- **THEN** 系统 SHALL 支持全文搜索和标签过滤
- **AND** 系统 SHALL 提供搜索结果的相关性排序

### Requirement: 主题元数据和扩展属性

系统 SHALL 支持灵活的主题元数据存储，允许用户添加自定义属性、标签和结构化数据。

#### Scenario: 自定义元数据管理

- **WHEN** 用户为主题添加自定义属性（如颜色、优先级、截止日期）
- **THEN** 系统 SHALL 将元数据作为 JSONB 存储并支持结构化查询
- **AND** 系统 SHALL 验证元数据的 JSON 格式正确性

#### Scenario: 主题标签系统

- **WHEN** 用户为主题添加或删除标签
- **THEN** 系统 SHALL 维护标签数组并支持标签的模糊查询
- **AND** 系统 SHALL 提供热门标签统计和推荐功能

#### Scenario: 版本历史追踪

- **WHEN** 主题内容发生重要变更
- **THEN** 系统 SHALL 记录变更历史和版本信息
- **AND** 系统 SHALL 支持主题版本对比和回滚功能

## ADDED Requirements

### Requirement: 主题协作权限管理

系统 SHALL 实现细粒度的主题级权限管理，支持不同用户角色的访问控制。

#### Scenario: 主题访问权限

- **WHEN** 用户尝试访问特定主题
- **THEN** 系统 SHALL 验证用户的访问权限（只读、编辑、管理）
- **AND** 系统 SHALL 返回适当的错误信息当权限不足时

#### Scenario: 主题操作权限

- **WHEN** 用户执行主题修改或删除操作
- **THEN** 系统 SHALL 检查用户的操作权限和主题的所有权
- **AND** 系统 SHALL 记录所有敏感操作的审计日志

#### Scenario: 频道级别权限继承

- **WHEN** 用户加入频道或被分配频道角色
- **THEN** 系统 SHALL 自动继承相应的主题访问权限
- **AND** 系统 SHALL 支持权限的动态更新和同步

### Requirement: 主题性能优化

系统 SHALL 实现数据库级别的性能优化，确保大规模主题数据的查询和更新效率。

#### Scenario: 数据库索引优化

- **WHEN** 系统部署或更新时
- **THEN** 数据库 SHALL 包含针对常用查询的优化索引
- **AND** 系统 SHALL 定期分析查询性能并调整索引策略

#### Scenario: 连接池管理

- **WHEN** 应用处理大量并发请求
- **THEN** 系统 SHALL 使用数据库连接池优化连接管理
- **AND** 连接池 SHALL 支持动态扩缩容和连接健康检查

#### Scenario: 查询缓存策略

- **WHEN** 系统检测到重复的复杂查询
- **THEN** 系统 SHALL 实现应用层查询缓存
- **AND** 缓存 SHALL 在数据变更时自动失效

### Requirement: 主题数据完整性

系统 SHALL 确保主题数据的完整性和一致性，防止数据损坏和不一致状态。

#### Scenario: 事务边界保护

- **WHEN** 执行复杂的多表操作
- **THEN** 系统 SHALL 使用数据库事务保护操作原子性
- **AND** 系统 SHALL 在事务失败时完整回滚所有变更

#### Scenario: 数据约束验证

- **WHEN** 插入或更新主题数据
- **THEN** 数据库 SHALL 验证所有约束条件（外键、唯一性、非空）
- **AND** 系统 SHALL 提供清晰的约束违反错误信息

#### Scenario: 并发冲突检测

- **WHEN** 多个用户同时编辑同一主题
- **THEN** 系统 SHALL 实现乐观并发控制或悲观锁机制
- **AND** 系统 SHALL 向用户提供冲突解决选项

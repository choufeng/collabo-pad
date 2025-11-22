# 任务清单：迁移Topics API从Redis到PostgreSQL数据库

## 阶段1：API端点创建和基础迁移 (高优先级)

- [ ] **创建GET /api/topics/channel/[channelId]端点**
  - 实现获取频道所有主题功能
  - 使用TopicService.findByChannelId()
  - 确保响应格式与前端兼容
  - 编写单元测试

- [ ] **创建PUT /api/topics/update端点**
  - 实现主题更新功能（位置、内容、元数据等）
  - 使用TopicService.update()
  - 支持部分更新（只更新提供的字段）
  - 编写单元测试

- [ ] **创建DELETE /api/topics/delete端点**
  - 实现主题删除功能
  - 使用TopicService.deleteWithDescendants()
  - 处理级联删除（删除子主题）
  - 编写单元测试

- [ ] **创建GET /api/topics/hierarchy/[channelId]端点**
  - 实现获取主题层级结构功能
  - 使用TopicService.findHierarchy()
  - 返回树形结构的主题数据
  - 编写单元测试

## 阶段2：创建主题API迁移 (高优先级)

- [ ] **修改POST /api/topic/create端点**
  - 将Redis实现替换为PostgreSQL实现
  - 使用TopicService.create()替代redisService.createTopic()
  - 保持请求/响应格式完全兼容
  - 处理坐标数据类型转换（string到decimal）
  - 编写完整的单元测试

- [ ] **数据格式兼容性处理**
  - 确保时间戳格式兼容（timestamp vs Date）
  - 处理UUID vs Redis消息ID的差异
  - 验证坐标数据精度和格式
  - 测试前端集成，确保无破坏性变更

## 阶段3：Redis代码清理 (中优先级)

- [ ] **移除Redis Topics相关方法**
  - 从redis.ts中移除createTopic()方法
  - 移除getChannelTopics()、getNewTopics()等方法
  - 保留其他Redis功能（如果有的话）
  - 更新相关的类型定义

- [ ] **清理相关类型定义**
  - 更新redis-stream.ts类型定义
  - 移除不再使用的Topic相关类型
  - 确保类型系统的完整性

## 阶段4：测试和验证 (高优先级)

- [ ] **编写集成测试**
  - 测试完整的API调用流程
  - 验证数据正确写入数据库
  - 测试SSE通知是否正常工作
  - 验证父子关系和层级结构

- [ ] **性能测试**
  - 对比Redis和PostgreSQL实现的性能
  - 确保API响应时间在可接受范围内
  - 测试并发请求处理能力
  - 监控数据库查询性能

- [ ] **前端兼容性测试**
  - 验证所有前端功能正常工作
  - 测试主题创建、编辑、删除流程
  - 验证实时协作功能
  - 确保UI渲染和数据展示正确

## 阶段5：文档和监控 (低优先级)

- [ ] **更新API文档**
  - 更新所有API端点的文档
  - 说明数据存储变更
  - 提供迁移指南（如果需要）

- [ ] **添加监控和日志**
  - 添加API性能监控
  - 记录数据库查询日志
  - 设置错误告警机制

## 验收标准

### 功能验收

- [ ] 所有Topics相关API成功使用PostgreSQL
- [ ] 前端所有功能正常，无需修改代码
- [ ] 实时协作（SSE）功能正常工作
- [ ] 主题的创建、更新、删除、查询功能完整

### 性能验收

- [ ] API平均响应时间 < 200ms
- [ ] 并发处理能力不降低
- [ ] 数据库查询优化合理

### 质量验收

- [ ] 单元测试覆盖率 >= 90%
- [ ] 集成测试通过
- [ ] 代码审查通过
- [ ] 无安全漏洞

### 架构验收

- [ ] 成功移除Topics相关的Redis依赖
- [ ] 数据存储架构简化为单一PostgreSQL
- [ ] 代码结构清晰，可维护性良好

## 风险缓解任务

- [ ] **回滚计划准备**
  - 保留原Redis API实现作为备份
  - 准备快速切换回Redis实现的方法
  - 数据迁移和回滚脚本

- [ ] **渐进式部署策略**
  - 支持新旧API并存
  - 通过配置控制使用哪个实现
  - 逐步切换流量到新实现

- [ ] **数据一致性验证**
  - 对比Redis和数据库中的数据
  - 确保迁移过程中数据不丢失
  - 验证父子关系正确性

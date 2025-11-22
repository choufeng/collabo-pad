# 变更提案：迁移Topics API从Redis到PostgreSQL数据库

## Why

当前项目的Topics API使用Redis Stream作为数据存储，虽然提供了高性能的实时通信，但存在以下问题：

1. **数据持久性不足**：Redis的内存存储特性无法保证数据的长期保存和可靠性
2. **复杂查询能力有限**：Redis Stream对于复杂的主题层级关系查询支持有限
3. **维护复杂性**：需要同时维护Redis和PostgreSQL两套存储系统
4. **数据一致性风险**：Redis和数据库之间的数据同步可能出现不一致
5. **成本效益**：PostgreSQL已经提供了完整的存储和实时通信能力，重复维护Redis增加了系统复杂性

**关键发现**：项目已经完成了完整的PostgreSQL + Drizzle ORM集成，包括：

- 完整的数据库schema定义
- TopicService服务层
- PostgreSQL原生的SSE实现
- 数据库触发器和通知机制

## What Changes

### 核心变更

1. **API接口迁移** - 将所有Topics相关的API从Redis迁移到PostgreSQL
2. **数据存储统一** - 使用PostgreSQL作为Topics的唯一数据源
3. **保持接口兼容性** - 确保前端调用接口的兼容性
4. **移除Redis依赖** - 清理Topics相关的Redis代码

### 受影响的API端点

- `POST /api/topic/create` - 创建主题（当前使用Redis，需要迁移到数据库）
- `PUT /api/topic/update` - 更新主题（需要实现数据库版本）
- `DELETE /api/topic/delete` - 删除主题（需要实现数据库版本）
- `GET /api/topic/channel/[channelId]` - 获取频道主题（需要实现数据库版本）
- `GET /api/topic/hierarchy/[channelId]` - 获取主题层级（需要实现数据库版本）

### 数据模型映射

**当前Redis Stream数据结构**：

```typescript
{
  id: "Redis消息ID",
  parent_id: "父主题ID",
  channel_id: "频道ID",
  content: "主题内容",
  user_id: "用户ID",
  user_name: "用户名",
  timestamp: 1234567890,
  metadata: {...},
  tags: ["tag1", "tag2"],
  status: "active",
  position_x: 100,
  position_y: 200
}
```

**PostgreSQL数据库结构（已存在）**：

```typescript
// topics表结构已完整定义
{
  id: "UUID (主键)",
  channelId: "UUID (频道ID)",
  parentId: "UUID (父主题ID, 可空)",
  userId: "UUID (用户ID)",
  username: "text (用户名)",
  content: "text (内容)",
  x: "decimal (X坐标)",
  y: "decimal (Y坐标)",
  w: "decimal (宽度)",
  h: "decimal (高度)",
  metadata: "json",
  tags: "text[]",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 实施策略

1. **渐进式迁移**：创建新的API端点，逐步替换旧的Redis实现
2. **保持兼容性**：新API保持与前端相同的请求/响应格式
3. **数据验证**：确保数据库操作的正确性和完整性
4. **测试覆盖**：所有新功能必须有完整的单元测试和集成测试

## 技术实现细节

### API路由更新

**创建主题API (`/api/topic/create`)**：

```typescript
// 新实现使用TopicService替代Redis
export async function POST(request: NextRequest) {
  const createData = (await request.json()) as CreateTopicData;

  const topic = await topicService.create({
    channelId: createData.channel_id,
    userId: createData.user_id,
    username: createData.user_name,
    content: createData.content,
    parentId: createData.parent_id || null,
    x: createData.x?.toString(),
    y: createData.y?.toString(),
    metadata: createData.metadata,
    tags: createData.tags,
  });

  return NextResponse.json({
    success: true,
    topic: {
      id: topic.id,
      parent_id: topic.parentId,
      channel_id: topic.channelId,
      content: topic.content,
      user_id: topic.userId,
      user_name: topic.username,
      timestamp: topic.createdAt.getTime(),
      metadata: topic.metadata,
      tags: topic.tags,
      status: "active",
      position_x: Number(topic.x),
      position_y: Number(topic.y),
    },
    messageId: topic.id, // 使用UUID作为消息ID
    message: "主题创建成功",
  });
}
```

### 新增API端点

1. **`GET /api/topics/channel/[channelId]`** - 获取频道所有主题
2. **`PUT /api/topics/update`** - 更新主题（位置、内容等）
3. **`DELETE /api/topics/delete`** - 删除主题
4. **`GET /api/topics/hierarchy/[channelId]`** - 获取主题层级结构

### SSE通信保持

现有的SSE实现已经基于PostgreSQL的LISTEN/NOTIFY，无需额外修改：

```typescript
// src/app/api/sse/channel/[channelId]/route.ts 已存在
// 使用PostgreSQL原生SSE，不需要Redis
```

## Impact

### 受影响的代码文件

**需要修改的文件**：

- `src/app/api/topic/create/route.ts` - 主要迁移目标
- `src/lib/redis.ts` - 移除Topics相关方法
- `src/types/redis-stream.ts` - 可能需要类型定义更新

**需要新增的文件**：

- `src/app/api/topics/` 目录下的新API端点
- 对应的测试文件

**不受影响的文件**：

- `src/app/api/sse/` - SSE实现已基于PostgreSQL
- `src/services/TopicService.ts` - 已存在且功能完整
- `src/database/` - 数据库层已完整实现

### 前端影响

**最小影响**：

- API调用格式保持不变
- 响应数据结构保持兼容
- SSE连接无需修改

**可能的调整**：

- 错误处理逻辑可能需要微调
- 数据类型转换（如时间戳格式）

## 风险评估

### 低风险

- TopicService已完整实现并经过测试
- PostgreSQL数据库集成已稳定运行
- 渐进式迁移策略降低风险

### 中等风险

- 数据格式差异可能导致前端兼容性问题
- 性能特性可能发生变化（数据库vs内存存储）
- 需要充分测试确保功能正确性

### 缓解措施

- 保持API接口格式的向后兼容性
- 实施完整的测试覆盖（单元测试、集成测试）
- 可以同时运行新旧API进行对比验证
- 监控性能指标，确保不降低用户体验

## 成功指标

1. ✅ 所有Topics相关API成功迁移到PostgreSQL
2. ✅ 前端功能完全正常，无需修改
3. ✅ API响应时间保持在可接受范围内（<200ms）
4. ✅ 测试覆盖率达到90%以上
5. ✅ 移除Topics相关的Redis代码，简化架构
6. ✅ 数据一致性和完整性得到保证

## 后续优化

- 数据库查询性能优化
- 索引优化以提高查询速度
- 考虑实现数据库连接池优化
- 监控和告警机制完善

---

**开发原则**：

- 遵循TDD（测试驱动开发）
- 保持代码简洁和可维护性
- 确保向后兼容性
- 优先考虑数据一致性和可靠性

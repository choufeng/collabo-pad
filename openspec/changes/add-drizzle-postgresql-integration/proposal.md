## 为什么需要这个变更

当前项目完全依赖 Redis 作为数据存储，虽然提供了优秀的性能，但存在以下限制：

1. **数据持久性不足**：Redis 的内存存储特性无法保证数据的长期保存
2. **复杂查询支持有限**：主题的层级关系、复杂查询需求在 Redis 中难以高效实现
3. **事务支持局限**：缺乏 ACID 事务保证，关键业务操作存在一致性风险
4. **数据分析能力不足**：用户行为分析、内容统计需要结构化查询支持
5. **维护复杂性**：Redis 和客户端 IndexedDB 的数据同步增加了系统复杂性

**架构决策**：采用 **纯 PostgreSQL + Drizzle ORM + 原生 SSE** 架构

- **PostgreSQL**：单一数据源，提供 ACID 事务保证
- **Drizzle ORM**：类型安全、性能优异的轻量级 ORM
- **原生 SSE**：使用 PostgreSQL LISTEN/NOTIFY 实现实时通信，无需 Redis 中转

## 变更内容

### 核心变更

1. **纯 PostgreSQL 存储** - 替换 Redis 作为唯一数据存储
2. **集成 Drizzle ORM** - 提供类型安全、高性能的数据访问层
3. **原生 SSE 实现** - 使用 PostgreSQL LISTEN/NOTIFY 替代 Redis Stream
4. **架构简化** - 单一数据源，消除数据同步复杂性
5. **TDD 开发范式** - 所有功能采用测试驱动开发

### 技术选择：为什么是 Drizzle ORM

相比 Prisma，Drizzle ORM 具有以下优势：

| 特性                                    | Drizzle ORM              | Prisma                       |
| --------------------------------------- | ------------------------ | ---------------------------- |
| **性能**                                | 更快，接近原生 SQL       | 较慢，有查询生成开销         |
| **包体积**                              | 小而轻                   | 较大                         |
| **类型安全**                            | 完整的 TypeScript 支持   | 良好，但有抽象层限制         |
| **SQL 控制**                            | 高灵活性，接近原生 SQL   | 抽象层，有时限制复杂查询     |
| **学习曲线**：**中等（需要 SQL 基础）** | **平缓（抽象层更高）**   |
| **PostgreSQL 特性支持**                 | **完全支持**             | 部分支持                     |
| **查询性能**                            | **优秀（无额外抽象层）** | **良好（有时生成冗余查询）** |

### 核心数据模型：Topics

```typescript
// Drizzle Schema 定义
export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull(),
  parentId: uuid("parent_id"),
  userId: uuid("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  x: decimal("x", { precision: 10, scale: 2 }),
  y: decimal("y", { precision: 10, scale: 2 }),
  w: decimal("w", { precision: 10, scale: 2 }), // width - 新增
  h: decimal("h", { precision: 10, scale: 2 }), // height - 新增
  metadata: json("metadata").$type<Record<string, any>>(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 关系定义
export const topicsRelations = relations(topics, ({ one, many }) => ({
  parent: one(topics, {
    fields: [topics.parentId],
    references: [topics.id],
  }),
  children: many(topics),
}));
```

### API 接口设计

- **`GET /api/sse/channel/[channelId]`** - PostgreSQL 原生 SSE 监听
- **`POST /api/topics/create`** - 创建主题
- **`PUT /api/topics/update`** - 统一更新接口（位置、尺寸、内容）
- **`DELETE /api/topics/delete`** - 删除主题及子主题
- **`GET /api/topics/channel/[channelId]`** - 按频道查询主题
- **`GET /api/topics/hierarchy/[channelId]`** - 层级查询

### 前端开发规范

1. **状态管理优先使用 Zustand** - 与 React Flow 完美集成
2. **模块化设计** - 按功能拆分 store，避免单一大文件
3. **函数式编程** - 使用函数式组件和 hooks
4. **职责分离** - 独立功能模块独立管理和测试

### Zustand Store 模块设计

- `src/stores/topics-store.ts` - Topics 数据管理
- `src/stores/ui-store.ts` - UI 状态管理
- `src/stores/sse-store.ts` - SSE 连接管理
- `src/hooks/use-topics.ts` - Topics 相关 hooks
- `src/hooks/use-sse.ts` - SSE 相关 hooks

## 影响范围

### 受影响的规格

- `data-storage` - 从 Redis 迁移到 PostgreSQL
- `topic-management` - 增强为关系型数据模型
- `redis-stream-management` - 替换为 PostgreSQL 原生 SSE

### 受影响的代码

- **API 路由**：所有 `src/app/api/` 下的路由
- **数据层**：新增 `src/database/` 目录
- **前端状态管理**：更新 Zustand stores
- **类型定义**：更新 `src/types/index.ts`

### 环境配置

PostgreSQL 连接已配置，需要添加 Drizzle 相关配置：

```env
# PostgreSQL Configuration (已存在)
POSTGRES_URL=postgresql://postgres:postgres_dev@localhost:9198/collabo_pad_db?schema=public

# Drizzle Configuration (新增)
DATABASE_URL=postgresql://postgres:postgres_dev@localhost:9198/collabo_pad_db?schema=public
```

## 实施优势

1. **数据持久化**：PostgreSQL 提供 ACID 事务保证
2. **复杂查询支持**：支持复杂的 SQL 查询和关系数据
3. **原生 SSE**：PostgreSQL LISTEN/NOTIFY 提供高性能实时通信
4. **架构简化**：单一数据源，无同步复杂性
5. **开发效率**：Drizzle ORM 提供类型安全和开发体验
6. **维护性**：减少依赖，降低系统复杂性
7. **扩展性**：为未来功能（搜索、推荐、分析）提供基础

## PostgreSQL SSE 能力说明

**PostgreSQL 完全支持 SSE 流而无需 Redis 中转**：

```sql
-- 创建通知函数
CREATE OR REPLACE FUNCTION notify_topic_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'topic_channel_' || NEW.channel_id,
    json_build_object(
      'type', TG_OP,
      'topicId', NEW.id,
      'channelId', NEW.channel_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER topic_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON topics
FOR EACH ROW EXECUTE FUNCTION notify_topic_change();
```

这种方式的优势：

- **更低延迟**：直接在数据库内部触发，无网络中转
- **数据一致性**：事务内触发，保证通知与数据变更一致
- **简化架构**：减少 Redis 依赖，降低系统复杂性
- **资源效率**：无需维护额外的 Stream 数据结构

## 风险评估

### 低风险

- Drizzle ORM 文档完善，社区活跃
- 可以与现有 Redis 并存，渐进式迁移
- 环境变量已配置，不影响现有功能

### 中等风险

- 需要数据库维护和监控
- 团队需要学习 Drizzle ORM 使用模式
- 数据迁移需要仔细规划

### 缓解措施

- 采用 TDD 开发范式，确保代码质量
- 渐进式迁移，保持现有功能可用
- 充分的测试覆盖和文档支持

## 成功指标

1. ✅ 成功集成 Drizzle ORM 并连接 PostgreSQL
2. ✅ 实现完整的 Topics CRUD 操作
3. ✅ PostgreSQL 原生 SSE 功能正常工作
4. ✅ 保持现有 Redis 功能正常运行（迁移期间）
5. ✅ 测试覆盖率达到 80% 以上
6. ✅ 应用性能不低于现有实现

## 后续扩展

- 全文搜索功能（PostgreSQL 全文搜索）
- 数据分析和报告功能
- 备份和恢复机制
- 读写分离架构（如需要）
- 性能监控和优化

---

**开发范式**：采用 TDD（测试驱动开发），所有功能先编写测试，后实现功能
**包管理器**：使用 pnpm 进行所有依赖管理

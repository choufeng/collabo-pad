# Drizzle ORM + PostgreSQL 集成设计文档

## 背景和约束

### 当前架构

- **前端**: Next.js + React Flow + Zustand
- **后端**: Next.js API Routes
- **存储**: Redis (ioredis) + 客户端 IndexedDB (Dexie)
- **实时通信**: Redis Stream

### 技术约束

- 使用 pnpm 作为包管理器
- 采用 TDD 开发范式
- 保持现有 API 接口兼容性
- 支持 TypeScript 类型安全

## 目标和非目标

### 目标

1. **统一数据存储**: 迁移到纯 PostgreSQL 架构
2. **类型安全**: 集成 Drizzle ORM 提供完整类型支持
3. **实时通信**: 使用 PostgreSQL 原生 LISTEN/NOTIFY
4. **架构简化**: 单一数据源，消除同步复杂性
5. **性能优化**: 减少数据传输和转换开销
6. **开发体验**: 提供更好的开发工具和调试能力

### 非目标

1. **完全替换 Redis**: 初期保持 Redis 并存，渐进式迁移
2. **API 接口重构**: 保持现有 API 接口不变
3. **前端框架变更**: 继续使用 Next.js 和 React
4. **数据库集群**: 初期使用单实例 PostgreSQL

## 技术决策

### 1. ORM 选择：Drizzle vs Prisma

**决策**: 选择 Drizzle ORM

**理由**:

- **性能**: Drizzle 更接近原生 SQL，查询性能更好
- **类型安全**: 完整的 TypeScript 支持，编译时错误检测
- **包体积**: 更小的包体积，减少客户端加载时间
- **控制力**: 更细粒度的查询控制，支持复杂 SQL 操作

**权衡**: 需要更多 SQL 知识，但提供了更好的性能和控制力

### 2. 数据库架构：纯 PostgreSQL vs 混合模式

**决策**: 纯 PostgreSQL 模式

**理由**:

- **数据一致性**: 单一数据源，避免同步问题
- **事务支持**: 完整的 ACID 事务保证
- **查询能力**: 支持复杂的关系查询和聚合操作
- **维护简化**: 减少系统组件，降低维护复杂性

**权衡**: 失去了 Redis 的某些高性能特性，但 PostgreSQL 的性能已足够

### 3. 实时通信：PostgreSQL LISTEN/NOTIFY vs Redis Stream

**决策**: PostgreSQL LISTEN/NOTIFY

**理由**:

- **架构一致性**: 与主数据库使用同一系统
- **更低延迟**: 数据库内部触发，无网络中转
- **事务保证**: 通知与数据变更在同一事务中
- **资源效率**: 无需维护额外的 Stream 数据结构

**权衡**: 功能相对简单，但满足 SSE 需求且性能优秀

### 4. 开发范式：TDD 驱动

**决策**: 严格的测试驱动开发

**理由**:

- **代码质量**: 保证高测试覆盖率和代码质量
- **重构安全**: 安全的重构和优化
- **文档价值**: 测试作为功能文档
- **回归防护**: 防止功能回退

## 架构设计

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ React Flow      │◄──►│ API Routes      │◄──►│ + Drizzle ORM   │
│ Zustand Stores  │    │ + SSE           │    │ + LISTEN/NOTIFY │
│ TypeScript      │    │ + Validation    │    │ + Triggers      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 数据库设计

#### 核心表结构

```sql
-- Topics 表 (主题)
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  parent_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  x DECIMAL(10,2),
  y DECIMAL(10,2),
  w DECIMAL(10,2),  -- width
  h DECIMAL(10,2),  -- height
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_topics_channel_id ON topics(channel_id);
CREATE INDEX idx_topics_parent_id ON topics(parent_id);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_created_at ON topics(created_at);
```

#### SSE 触发器设计

```sql
-- 通知函数
CREATE OR REPLACE FUNCTION notify_topic_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'topic_channel_' || COALESCE(NEW.channel_id, OLD.channel_id),
    json_build_object(
      'type', TG_OP,
      'id', COALESCE(NEW.id, OLD.id),
      'channelId', COALESCE(NEW.channel_id, OLD.channel_id),
      'parentId', COALESCE(NEW.parent_id, OLD.parent_id),
      'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 触发器
CREATE TRIGGER topic_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON topics
FOR EACH ROW EXECUTE FUNCTION notify_topic_change();
```

### 代码架构

#### 目录结构

```
src/
├── app/api/
│   ├── topics/
│   │   ├── create/route.ts
│   │   ├── update/route.ts
│   │   ├── delete/route.ts
│   │   ├── channel/[channelId]/route.ts
│   │   └── hierarchy/[channelId]/route.ts
│   └── sse/
│       └── channel/[channelId]/route.ts
├── database/
│   ├── schema.ts          # Drizzle schema 定义
│   ├── db.ts              # 数据库连接
│   ├── services/
│   │   └── topic-service.ts
│   └── seed.ts
├── stores/
│   ├── topics-store.ts    # Topics 状态管理
│   ├── ui-store.ts        # UI 状态管理
│   └── sse-store.ts       # SSE 连接管理
├── hooks/
│   ├── use-topics.ts      # Topics 相关 hooks
│   └── use-sse.ts         # SSE 相关 hooks
├── lib/
│   ├── topics-api.ts      # API 客户端
│   └── validation.ts      # 数据验证
└── types/
    └── index.ts           # TypeScript 类型定义
```

#### 核心组件设计

**1. Schema 定义 (src/database/schema.ts)**

```typescript
import {
  pgTable,
  uuid,
  text,
  decimal,
  json,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id").notNull(),
    parentId: uuid("parent_id"),
    userId: uuid("user_id").notNull(),
    username: text("username").notNull(),
    content: text("content").notNull(),
    x: decimal("x", { precision: 10, scale: 2 }),
    y: decimal("y", { precision: 10, scale: 2 }),
    w: decimal("w", { precision: 10, scale: 2 }),
    h: decimal("h", { precision: 10, scale: 2 }),
    metadata: json("metadata").$type<Record<string, any>>(),
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    channelIdIdx: index("idx_channel_id").on(table.channelId),
    parentIdIdx: index("idx_parent_id").on(table.parentId),
    userIdIdx: index("idx_user_id").on(table.userId),
  }),
);
```

**2. 数据库服务 (src/database/services/topic-service.ts)**

```typescript
export class TopicService {
  constructor(private db: DrizzleDB) {}

  async createTopic(data: CreateTopicDto): Promise<Topic> {
    const [topic] = await this.db
      .insert(topics)
      .values({
        channelId: data.channelId,
        parentId: data.parentId,
        userId: data.userId,
        username: data.username,
        content: data.content,
        x: data.x,
        y: data.y,
        w: data.w,
        h: data.h,
        metadata: data.metadata,
        tags: data.tags,
      })
      .returning();
    return topic;
  }

  async getTopicsByChannel(channelId: string): Promise<Topic[]> {
    return this.db.select().from(topics).where(eq(topics.channelId, channelId));
  }

  async getTopicHierarchy(channelId: string): Promise<TopicWithChildren[]> {
    // 实现层级查询逻辑
  }
}
```

**3. Zustand Store (src/stores/topics-store.ts)**

```typescript
interface TopicsStore {
  topics: Map<string, Topic>;
  loading: boolean;
  error: string | null;

  // Actions
  setTopics: (topics: Topic[]) => void;
  addTopic: (topic: Topic) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  removeTopic: (id: string) => void;
  clearTopics: () => void;
}

export const useTopicsStore = create<TopicsStore>((set, get) => ({
  topics: new Map(),
  loading: false,
  error: null,

  setTopics: (topics) =>
    set({
      topics: new Map(topics.map((t) => [t.id, t])),
    }),

  addTopic: (topic) =>
    set((state) => ({
      topics: new Map(state.topics).set(topic.id, topic),
    })),

  updateTopic: (id, updates) =>
    set((state) => {
      const topic = state.topics.get(id);
      if (!topic) return state;

      const updated = { ...topic, ...updates };
      const newTopics = new Map(state.topics);
      newTopics.set(id, updated);
      return { topics: newTopics };
    }),

  removeTopic: (id) =>
    set((state) => {
      const newTopics = new Map(state.topics);
      newTopics.delete(id);
      return { topics: newTopics };
    }),

  clearTopics: () => set({ topics: new Map() }),
}));
```

## 风险评估和缓解策略

### 技术风险

**1. 数据迁移风险**

- **风险**: 数据丢失或损坏
- **缓解**:
  - 先在测试环境验证迁移脚本
  - 创建数据备份
  - 渐进式迁移，保持旧系统运行

**2. 性能风险**

- **风险**: PostgreSQL 性能不如 Redis
- **缓解**:
  - 合理的数据库索引设计
  - 连接池配置优化
  - 查询性能监控和优化

**3. SSE 连接风险**

- **风险**: 连接数过多导致数据库压力
- **缓解**:
  - 连接池管理和限制
  - 连接健康检查和自动重连
  - 负载均衡（如需要）

### 业务风险

**1. 功能回退风险**

- **风险**: 新系统功能不如旧系统
- **缓解**:
  - 完整的测试覆盖
  - 灰度发布策略
  - 快速回滚机制

**2. 用户体验风险**

- **风险**: 系统切换影响用户体验
- **缓解**:
  - 保持 API 接口兼容
  - 前端无感知切换
  - 充分的用户测试

## 迁移计划

### 阶段1: 准备阶段 (第1-2周)

- 环境设置和依赖安装
- 数据库 schema 设计
- 基础服务开发
- 测试框架搭建

### 阶段2: 开发阶段 (第3-6周)

- Topics CRUD API 开发
- SSE 功能实现
- 前端集成开发
- 单元测试和集成测试

### 阶段3: 测试阶段 (第7-8周)

- 功能测试和性能测试
- 用户验收测试
- 压力测试和稳定性测试
- 安全测试

### 阶段4: 部署阶段 (第9-10周)

- 生产环境部署
- 数据迁移执行
- 监控和告警设置
- 文档和培训

### 阶段5: 清理阶段 (第11-12周)

- Redis 依赖清理
- 代码优化和重构
- 性能调优
- 经验总结

## 监控和运维

### 关键指标

**数据库性能**

- 查询响应时间
- 连接池使用率
- 慢查询数量
- 数据库大小增长

**应用性能**

- API 响应时间
- SSE 连接数
- 错误率和异常
- 内存和 CPU 使用率

**业务指标**

- 用户活跃度
- 主题创建和更新频率
- 实时协作延迟
- 系统可用性

### 监控工具

- **数据库监控**: pg_stat_statements, pgBadger
- **应用监控**: 自定义健康检查 API
- **日志监控**: 结构化日志和日志聚合
- **告警机制**: 关键指标阈值告警

## 测试策略

### 测试金字塔

**单元测试 (70%)**

- 数据库服务测试
- API 路由测试
- 工具函数测试
- React 组件测试

**集成测试 (20%)**

- API 端到端测试
- 数据库集成测试
- SSE 功能测试

**端到端测试 (10%)**

- 用户场景测试
- 性能测试
- 压力测试

### 测试环境

- **开发环境**: 本地 PostgreSQL 实例
- **测试环境**: 独立的测试数据库
- **预生产环境**: 生产数据副本
- **生产环境**: 生产数据库

## 总结

本设计文档详细描述了从 Redis 架构迁移到 Drizzle ORM + PostgreSQL 架构的完整方案。通过严格的技术决策分析和风险评估，确保迁移过程的安全性和可控性。采用 TDD 开发范式和全面的测试策略，保证代码质量和系统稳定性。

核心优势包括：

- **架构简化**: 单一数据源，减少系统复杂性
- **性能优化**: 更好的查询性能和数据一致性
- **开发体验**: 类型安全和更好的调试能力
- **维护性**: 更易于维护和扩展的系统架构

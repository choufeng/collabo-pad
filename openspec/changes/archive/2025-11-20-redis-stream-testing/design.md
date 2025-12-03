# Redis Stream 测试功能设计文档

## 架构设计

### 系统概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RedisTest     │    │  Stream API     │    │  Redis Service  │
│   Component     │◄──►│   Routes        │◄──►│    Class        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Redis Stream   │
                    │   Storage       │
                    └─────────────────┘
```

### 数据流设计

1. **用户界面层** (`RedisTest.tsx`)
   - Stream 操作界面
   - 实时数据展示
   - 用户交互处理

2. **API 路由层** (`/api/redis/stream/*`)
   - HTTP 请求处理
   - 参数验证
   - 响应格式化

3. **服务层** (`redis.ts`)
   - Redis 连接管理
   - Stream 操作封装
   - 错误处理

4. **数据层** (Redis)
   - Stream 数据存储
   - 消息持久化
   - 实时推送

## 详细设计

### Redis Service 增强

#### 新增方法

```typescript
interface StreamMessage {
  id: string;
  data: Record<string, string>;
}

interface StreamInfo {
  length: number;
  radixTreeKeys: number;
  radixTreeNodes: number;
  lastGeneratedId: string;
  groups: number;
}

// 删除 Stream 消息
async deleteMessage(streamKey: string, messageId: string): Promise<number>

// 获取 Stream 详细信息
async getStreamInfo(streamKey: string): Promise<StreamInfo | null>

// 获取 Stream 消息范围
async getStreamRange(
  streamKey: string,
  start?: string,
  end?: string,
  count?: number
): Promise<StreamMessage[]>

// 修改消息 (删除后重新添加)
async updateMessage(
  streamKey: string,
  messageId: string,
  newData: Record<string, string>
): Promise<string | null>

// 清空 Stream
async clearStream(streamKey: string): Promise<string>
```

### API 接口设计

#### 1. Stream 管理 API

```
GET    /api/redis/stream/info?stream={streamKey}
POST   /api/redis/stream/messages
GET    /api/redis/stream/messages?stream={streamKey}&start={start}&end={end}&count={count}
DELETE /api/redis/stream/messages?stream={streamKey}&id={messageId}
PUT    /api/redis/stream/messages?stream={streamKey}&id={messageId}
DELETE /api/redis/stream/clear?stream={streamKey}
```

#### 2. 请求/响应格式

**获取 Stream 信息**

```typescript
// GET /api/redis/stream/info?stream=test_stream
Response: {
  success: true,
  data: {
    length: 10,
    radixTreeKeys: 10,
    radixTreeNodes: 8,
    lastGeneratedId: "1672531200000-0",
    groups: 0
  }
}
```

**添加消息**

```typescript
// POST /api/redis/stream/messages
Request: {
  stream: "test_stream",
  data: {
    message: "Hello World",
    type: "test",
    timestamp: "1672531200000"
  }
}
Response: {
  success: true,
  data: {
    messageId: "1672531200000-0"
  }
}
```

**获取消息列表**

```typescript
// GET /api/redis/stream/messages?stream=test_stream&count=10
Response: {
  success: true,
  data: {
    messages: [
      {
        id: "1672531200000-0",
        data: {
          message: "Hello World",
          type: "test",
          timestamp: "1672531200000"
        }
      }
    ],
    total: 1
  }
}
```

### 组件设计

#### RedisTest 组件重构

```typescript
interface StreamMessage {
  id: string;
  data: Record<string, string>;
  timestamp?: number;
}

interface StreamInfo {
  length: number;
  lastGeneratedId: string;
  groups: number;
}

interface RedisTestState {
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  streamKey: string;
  streamInfo: StreamInfo | null;
  messages: StreamMessage[];
  selectedMessage: StreamMessage | null;
  isSSEConnected: boolean;
  formData: Record<string, string>;
  editMode: boolean;
  loading: boolean;
}
```

#### 功能模块

1. **连接管理模块**
   - Redis 连接状态显示
   - 连接测试功能

2. **Stream 信息模块**
   - Stream 统计信息
   - 实时消息计数

3. **消息管理模块**
   - 消息列表展示
   - 添加/编辑/删除功能
   - 批量操作

4. **实时流模块**
   - SSE 连接管理
   - 实时消息推送
   - 消息历史

### 错误处理策略

1. **Redis 连接错误**
   - 自动重连机制
   - 用户友好的错误提示

2. **Stream 操作错误**
   - 参数验证
   - 具体错误消息

3. **网络错误**
   - 请求超时处理
   - 离线状态提示

### 性能优化

1. **消息分页**
   - 大数据量分页加载
   - 虚拟滚动

2. **缓存策略**
   - Stream 信息缓存
   - 消息列表缓存

3. **内存管理**
   - 消息历史限制
   - 定期清理

## 安全考虑

1. **输入验证**
   - Stream 键名格式验证
   - 消息数据大小限制

2. **访问控制**
   - 操作权限检查
   - 频率限制

3. **数据保护**
   - 敏感数据过滤
   - 日志脱敏

## 测试策略

### 单元测试

- Redis Service 方法测试
- API 路由测试
- 工具函数测试

### 集成测试

- 完整的 Stream 操作流程
- SSE 连接和消息推送
- 错误场景处理

### 端到端测试

- 用户界面交互
- 实时数据更新
- 浏览器兼容性

## 部署考虑

1. **环境配置**
   - Redis 连接参数
   - Stream 配置优化

2. **监控指标**
   - Stream 性能指标
   - API 响应时间
   - 错误率统计

3. **日志记录**
   - 操作审计
   - 性能分析
   - 故障排查

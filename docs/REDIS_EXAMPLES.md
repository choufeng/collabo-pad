# Redis集成使用示例

本文档提供了在Collabo Pad项目中使用Redis功能的详细示例和最佳实践。

## 目录

1. [基础配置](#基础配置)
2. [基础Redis操作](#基础redis操作)
3. [发布/订阅模式](#发布订阅模式)
4. [流数据处理](#流数据处理)
5. [实时SSE通信](#实时sse通信)
6. [错误处理](#错误处理)
7. [性能优化](#性能优化)

## 基础配置

### 1. 环境变量配置

在 `.env.local` 文件中配置Redis连接参数：

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Redis Connection Options
REDIS_CONNECT_TIMEOUT=10000
REDIS_RETRY_DELAY=1000
```

### 2. 初始化Redis客户端

```typescript
import redisService from '@/lib/redis';

// 在应用启动时建立连接
async function initializeRedis() {
  try {
    await redisService.connect();
    console.log('Redis连接成功');
  } catch (error) {
    console.error('Redis连接失败:', error);
  }
}
```

## 基础Redis操作

### 1. 数据存储和读取

```typescript
import redisService from '@/lib/redis';

// 存储简单键值对
await redisService.set('user:1001', JSON.stringify({
  id: '1001',
  name: '张三',
  email: 'zhangsan@example.com'
}));

// 读取数据
const userData = await redisService.get('user:1001');
if (userData) {
  const user = JSON.parse(userData);
  console.log('用户信息:', user);
}

// 带TTL的存储（3600秒后过期）
await redisService.set('session:abc123', 'user_data', 3600);

// 删除数据
await redisService.del('user:1001');

// 检查键是否存在
const exists = await redisService.exists('user:1001');
console.log('用户数据存在:', exists);
```

### 2. API端点示例

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import redisService from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await redisService.connect();

    const userData = await redisService.get(`user:${params.id}`);

    if (!userData) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const user = JSON.parse(userData);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await redisService.connect();

    const userData = await request.json();

    // 存储用户数据，设置24小时过期
    await redisService.set(
      `user:${params.id}`,
      JSON.stringify(userData),
      86400
    );

    return NextResponse.json({
      message: '用户数据保存成功',
      user: userData
    });
  } catch (error) {
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    );
  }
}
```

## 发布/订阅模式

### 1. 实时通知系统

```typescript
// 发送通知
async function sendNotification(userId: string, message: string) {
  const notification = {
    id: Date.now().toString(),
    userId,
    message,
    timestamp: new Date().toISOString(),
    type: 'info'
  };

  await redisService.publish(
    `notifications:${userId}`,
    JSON.stringify(notification)
  );
}

// 监听通知
async function setupNotificationListener(userId: string) {
  await redisService.subscribe(
    `notifications:${userId}`,
    (channel, message) => {
      const notification = JSON.parse(message);
      console.log('收到通知:', notification);

      // 在实际应用中，这里可以通过WebSocket或其他方式推送给客户端
      // 例如：通过WebSocket发送给特定用户
      webSocket.sendToUser(userId, notification);
    }
  );
}

// 使用示例
await sendNotification('user123', '您有新的协作邀请');
await setupNotificationListener('user123');
```

### 2. 协作状态同步

```typescript
// 节点更新事件
export async function broadcastNodeUpdate(
  channelId: string,
  nodeId: string,
  updateData: any
) {
  const update = {
    type: 'node_update',
    channelId,
    nodeId,
    data: updateData,
    timestamp: Date.now(),
    userId: getCurrentUserId() // 获取当前用户ID
  };

  await redisService.publish(
    `channel:${channelId}:updates`,
    JSON.stringify(update)
  );
}

// 监听频道更新
export async function setupChannelListener(channelId: string) {
  await redisService.subscribe(
    `channel:${channelId}:updates`,
    async (channel, message) => {
      const update = JSON.parse(message);

      // 忽略自己发送的更新
      if (update.userId === getCurrentUserId()) {
        return;
      }

      // 处理其他用户的更新
      switch (update.type) {
        case 'node_update':
          await handleNodeUpdate(update);
          break;
        case 'node_delete':
          await handleNodeDelete(update);
          break;
        case 'user_join':
          await handleUserJoin(update);
          break;
      }
    }
  );
}
```

## 流数据处理

### 1. 操作日志记录

```typescript
// 记录用户操作到流
export async function logUserAction(
  channelId: string,
  userId: string,
  action: string,
  data: any = {}
) {
  const logEntry = {
    timestamp: Date.now().toString(),
    userId,
    action,
    data: JSON.stringify(data),
    ip: getClientIP()
  };

  await redisService.addToStream(
    `channel:${channelId}:actions`,
    logEntry
  );
}

// 读取最近的操作日志
export async function getRecentActions(
  channelId: string,
  count: number = 50
) {
  const messages = await redisService.readStream(
    `channel:${channelId}:actions`,
    count
  );

  return messages.map(([streamName, fields]) => {
    const logEntry: any = {};
    for (let i = 0; i < fields.length; i += 2) {
      logEntry[fields[i]] = fields[i + 1];
    }
    return {
      ...logEntry,
      timestamp: parseInt(logEntry.timestamp),
      data: JSON.parse(logEntry.data || '{}')
    };
  });
}

// 使用示例
await logUserAction('channel123', 'user456', 'node_create', {
  nodeId: 'node789',
  nodeType: 'text',
  content: '新节点'
});

const recentActions = await getRecentActions('channel123', 20);
console.log('最近操作:', recentActions);
```

### 2. 实时统计

```typescript
// 记录统计数据
export async function recordChannelStats(channelId: string, stats: any) {
  const statEntry = {
    timestamp: Date.now().toString(),
    ...stats
  };

  await redisService.addToStream(
    `channel:${channelId}:stats`,
    statEntry
  );
}

// 分析统计数据
export async function analyzeChannelStats(channelId: string, timeRange: number) {
  const endTime = Date.now();
  const startTime = endTime - timeRange;

  const messages = await redisService.readStream(
    `channel:${channelId}:stats`,
    1000 // 读取最多1000条记录
  );

  // 过滤时间范围内的数据
  const relevantStats = messages
    .map(([, fields]) => {
      const stat: any = {};
      for (let i = 0; i < fields.length; i += 2) {
        stat[fields[i]] = fields[i + 1];
      }
      return stat;
    })
    .filter(stat => parseInt(stat.timestamp) >= startTime);

  // 计算统计指标
  const totalUsers = new Set(relevantStats.map(s => s.userId)).size;
  const totalActions = relevantStats.length;
  const avgActionsPerMinute = (totalActions / (timeRange / 60000)).toFixed(2);

  return {
    timeRange,
    totalUsers,
    totalActions,
    avgActionsPerMinute,
    details: relevantStats
  };
}
```

## 实时SSE通信

### 1. 设置SSE服务器

```typescript
// app/api/sse/[channelId]/route.ts
import { NextRequest } from 'next/server';
import redisService from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const channelId = params.channelId;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // 发送初始连接消息
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'connected',
        channelId,
        timestamp: Date.now()
      })}\n\n`));

      // 监听Redis频道
      await redisService.subscribe(
        `channel:${channelId}:updates`,
        (channel, message) => {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        }
      );

      // 心跳检测
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        })}\n\n`));
      }, 30000);

      // 清理连接
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 2. 客户端SSE连接

```typescript
// hooks/useSSE.ts
import { useEffect, useState, useRef } from 'react';

export function useSSE(channelId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const eventSource = new EventSource(`/api/sse/${channelId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('SSE连接已建立');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev.slice(-99), data]); // 保留最新100条消息
      } catch (error) {
        console.error('解析SSE消息失败:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.error('SSE连接错误');
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [channelId]);

  const sendMessage = async (message: any) => {
    try {
      const response = await fetch(`/api/channel/${channelId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error('发送消息失败');
      }
    } catch (error) {
      console.error('发送消息错误:', error);
    }
  };

  return {
    isConnected,
    messages,
    sendMessage,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };
}

// 在组件中使用
function CollaborationCanvas({ channelId }: { channelId: string }) {
  const { isConnected, messages, sendMessage } = useSSE(channelId);

  const handleNodeUpdate = (nodeId: string, updateData: any) => {
    sendMessage({
      type: 'node_update',
      nodeId,
      data: updateData
    });
  };

  useEffect(() => {
    // 处理接收到的消息
    messages.forEach(message => {
      switch (message.type) {
        case 'node_update':
          updateNodeInCanvas(message.nodeId, message.data);
          break;
        case 'user_join':
          showNotification(`${message.userName} 加入了协作`);
          break;
      }
    });
  }, [messages]);

  return (
    <div>
      <div>连接状态: {isConnected ? '已连接' : '未连接'}</div>
      {/* 画板组件 */}
    </div>
  );
}
```

## 错误处理

### 1. Redis连接错误处理

```typescript
import redisService from '@/lib/redis';

class RedisManager {
  private static instance: RedisManager;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async connectWithRetry(): Promise<boolean> {
    try {
      await redisService.connect();
      this.retryCount = 0;
      return true;
    } catch (error) {
      console.error(`Redis连接失败 (尝试 ${this.retryCount + 1}/${this.maxRetries}):`, error);

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connectWithRetry();
      }

      console.error('Redis连接最终失败，启用降级模式');
      return false;
    }
  }

  async safeOperation<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      if (!redisService.isConnectionActive()) {
        await this.connectWithRetry();
      }

      return await operation();
    } catch (error) {
      console.error('Redis操作失败，使用降级方案:', error);
      return fallback;
    }
  }
}

// 使用示例
const redisManager = RedisManager.getInstance();

async function getUserData(userId: string) {
  return await redisManager.safeOperation(
    async () => {
      const data = await redisService.get(`user:${userId}`);
      return data ? JSON.parse(data) : null;
    },
    null // 降级时返回null，可以从数据库获取
  );
}
```

### 2. API错误处理

```typescript
// utils/api-error-handler.ts
export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof Error) {
    // Redis连接错误
    if (error.message.includes('ECONNREFUSED')) {
      return new APIError('Redis服务不可用', 503, 'REDIS_UNAVAILABLE');
    }

    // Redis认证错误
    if (error.message.includes('NOAUTH')) {
      return new APIError('Redis认证失败', 401, 'REDIS_AUTH_ERROR');
    }

    // 其他Redis错误
    if (error.message.includes('Redis')) {
      return new APIError('Redis操作失败', 500, 'REDIS_OPERATION_ERROR');
    }
  }

  return new APIError('服务器内部错误', 500, 'INTERNAL_ERROR');
}

// 在API路由中使用
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await redisService.connect();

    // 执行Redis操作
    await redisService.set(body.key, body.value);

    return NextResponse.json({ success: true });
  } catch (error) {
    const apiError = handleAPIError(error);

    return NextResponse.json(
      {
        error: apiError.message,
        code: apiError.code
      },
      { status: apiError.statusCode }
    );
  }
}
```

## 性能优化

### 1. 连接池管理

```typescript
// lib/redis-pool.ts
import Redis from 'ioredis';

class RedisPool {
  private connections: Redis[] = [];
  private maxConnections = 10;
  private currentConnection = 0;

  getConnection(): Redis {
    if (this.connections.length < this.maxConnections) {
      const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
      });

      this.connections.push(redis);
      return redis;
    }

    // 轮询分配连接
    const connection = this.connections[this.currentConnection];
    this.currentConnection = (this.currentConnection + 1) % this.connections.length;
    return connection;
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.connections.map(conn => conn.quit()));
    this.connections = [];
  }
}

export const redisPool = new RedisPool();
```

### 2. 批量操作

```typescript
// 批量设置键值
async function batchSet(items: Array<{ key: string; value: string; ttl?: number }>) {
  const redis = redisService.getClient();
  if (!redis) return;

  const pipeline = redis.pipeline();

  items.forEach(item => {
    if (item.ttl) {
      pipeline.setex(item.key, item.ttl, item.value);
    } else {
      pipeline.set(item.key, item.value);
    }
  });

  await pipeline.exec();
}

// 批量获取键值
async function batchGet(keys: string[]): Promise<Record<string, string | null>> {
  const redis = redisService.getClient();
  if (!redis) return {};

  const values = await redis.mget(...keys);
  const result: Record<string, string | null> = {};

  keys.forEach((key, index) => {
    result[key] = values[index];
  });

  return result;
}

// 使用示例
const userData = [
  { key: 'user:1001', value: JSON.stringify({ name: '张三' }) },
  { key: 'user:1002', value: JSON.stringify({ name: '李四' }), ttl: 3600 },
  { key: 'user:1003', value: JSON.stringify({ name: '王五' }) }
];

await batchSet(userData);

const users = await batchGet(['user:1001', 'user:1002', 'user:1003']);
console.log('批量获取的用户数据:', users);
```

### 3. 缓存策略

```typescript
// 缓存装饰器
function Cacheable(ttl: number = 3600) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `cache:${propertyName}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // 执行原方法
      const result = await method.apply(this, args);

      // 存入缓存
      await redisService.set(cacheKey, JSON.stringify(result), ttl);

      return result;
    };
  };
}

// 使用示例
class UserService {
  @Cacheable(1800) // 缓存30分钟
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // 从数据库获取用户信息
    return await userRepository.findById(userId);
  }

  @Cacheable(600) // 缓存10分钟
  async getUserStats(userId: string): Promise<UserStats> {
    // 计算用户统计信息
    return await this.calculateStats(userId);
  }
}
```

这些示例展示了在Collabo Pad项目中使用Redis的各种场景和最佳实践。通过合理使用Redis功能，可以显著提升应用的性能和用户体验。
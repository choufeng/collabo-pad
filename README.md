# Collabo Pad - Redis集成版

这是一个基于Next.js的协作画板应用，集成了Redis缓存和实时数据流功能。

## 功能特性

- **实时协作画板**: 支持多用户实时协作的节点编辑功能
- **Redis集成**: 支持Redis缓存、发布/订阅和流数据处理
- **SSE实时通信**: 使用Server-Sent Events实现实时数据推送
- **节点层级管理**: 支持父子节点关系的创建和管理
- **类型安全**: 使用TypeScript确保类型安全
- **现代化UI**: 使用Tailwind CSS构建响应式界面

## 技术栈

- **前端**: React 19, Next.js 16, TypeScript, Tailwind CSS
- **状态管理**: Zustand
- **画板**: @xyflow/react
- **数据存储**: IndexedDB (Dexie), Redis
- **实时通信**: Server-Sent Events (SSE)
- **测试**: Jest, React Testing Library

## 快速开始

### 环境要求

- Node.js 18+
- Redis服务器 (用于Redis功能测试)

### 安装依赖

```bash
pnpm install
```

### 环境配置

1. 复制环境配置模板：

```bash
cp .env.local.example .env.local
```

2. 根据需要修改 `.env.local` 中的Redis配置：

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Redis Connection Options
REDIS_CONNECT_TIMEOUT=10000
REDIS_RETRY_DELAY=1000
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## Redis功能

### 测试页面

访问 [http://localhost:3000/redis-test](http://localhost:3000/redis-test) 测试Redis功能：

- **连接测试**: 测试Redis连接状态
- **数据操作**: 测试Redis数据读写功能
- **SSE流**: 测试实时数据流接收
- **测试结果**: 查看所有操作的测试结果

### API端点

#### Redis连接管理

- `POST /api/redis/connect` - 建立Redis连接
- `GET /api/redis/connect` - 检查连接状态

#### 数据操作

- `POST /api/redis/test-data` - 写入测试数据
- `GET /api/redis/test-data?key={key}` - 读取测试数据
- `DELETE /api/redis/test-data?key={key}` - 删除测试数据

#### 实时流

- `GET /api/redis/stream` - SSE实时数据流

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/redis/         # Redis API路由
│   ├── redis-test/        # Redis测试页面
│   └── [channel-id]/      # 画板页面
├── components/            # React组件
│   ├── Board.tsx         # 主画板组件
│   ├── RedisTest.tsx     # Redis测试组件
│   └── ...
├── lib/                   # 工具库
│   ├── redis.ts          # Redis客户端封装
│   └── ...
├── database/              # 数据库操作
├── stores/               # 状态管理
└── utils/                # 工具函数
```

## 开发指南

### 添加新的Redis功能

1. 在 `src/lib/redis.ts` 中添加新的Redis操作方法
2. 在 `src/app/api/redis/` 中创建对应的API端点
3. 在 `src/components/RedisTest.tsx` 中添加测试功能
4. 编写相应的单元测试

### Redis客户端使用

```typescript
import redisService from "@/lib/redis";

// 连接Redis
await redisService.connect();

// 基础操作
await redisService.set("key", "value");
const value = await redisService.get("key");
await redisService.del("key");

// 发布/订阅
await redisService.publish("channel", "message");
await redisService.subscribe("channel", (channel, message) => {
  console.log(`收到消息 ${channel}: ${message}`);
});

// 流操作
await redisService.addToStream("stream", { key1: "value1", key2: "value2" });
const messages = await redisService.readStream("stream");
```

## 测试

### 运行所有测试

```bash
npm test
```

### 运行特定测试

```bash
# Redis相关测试
npm test -- --testNamePattern="Redis"

# API测试
npm test -- --testPathPattern="api"

# 组件测试
npm test -- --testPathPattern="components"
```

### 测试覆盖率

```bash
npm run test:coverage
```

## 部署

### 构建项目

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 故障排除

### Redis连接问题

1. 确保Redis服务器正在运行
2. 检查 `.env.local` 中的Redis配置
3. 确认Redis端口可访问（默认6379）

### 构建问题

1. 确保所有依赖已正确安装
2. 检查TypeScript类型错误
3. 运行 `npm run lint` 检查代码规范

## 贡献

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License

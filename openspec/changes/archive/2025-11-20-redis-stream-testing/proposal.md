# Redis Stream 测试功能提案

## Why

当前的 Redis 测试功能主要基于传统的 key-value 操作模式，无法有效利用 Redis Stream 强大的实时数据处理能力。随着现代应用对实时数据流、事件溯源和消息队列需求的增长，我们需要一个更强大的 Redis Stream 测试和管理工具来支持：

- 实时数据流的监控和调试
- Stream 消息的生命周期管理
- 复杂实时应用的开发和测试
- Redis Stream 功能的全面验证

## What Changes

本次提案将实施以下关键变更：

### 1. 核心功能增强

- 扩展 RedisService 类，添加 Stream 完整 CRUD 操作
- 实现消息删除、修改、批量操作等高级功能
- 增强 Stream 统计信息查询和监控能力

### 2. API 层重构

- 创建专门的 Stream 管理 API 端点
- 实现 RESTful 风格的 Stream 操作接口
- 统一错误处理和响应格式

### 3. 用户界面升级

- 重构 RedisTest 组件，专注 Stream 操作
- 实现消息列表展示、添加、编辑、删除功能
- 添加实时 Stream 信息面板和统计数据

### 4. 测试和文档

- 编写完整的单元测试和集成测试
- 创建 Stream 操作示例和使用指南

## 概述

将现有的 Redis 测试接口和测试页面从基本的 key-value 操作模式升级为 Redis Stream 模式，提供完整的 Stream 数据管理功能，包括流数据展示、添加消息、删除消息和修改消息。

## 背景

当前项目已具备基础的 Redis 连接和 Stream 功能：

- `src/lib/redis.ts` 提供了基础的 Stream 操作方法 (`addToStream`, `readStream`)
- `src/app/api/redis/stream/route.ts` 实现了 SSE 流读取功能
- `src/components/RedisTest.tsx` 主要测试基本 key-value 操作

但缺少完整的 Stream 管理功能：

- 没有专门的 Stream 消息删除功能
- 没有Stream 消息修改功能
- 测试界面未针对 Stream 操作进行优化
- 缺少 Stream 数据的可视化展示

## 提案目标

1. **增强 Redis 服务类**：添加 Stream 消息的删除、修改和查询功能
2. **创建 Stream API 接口**：提供完整的 Stream CRUD 操作
3. **重构测试页面**：将测试重点从 key-value 转向 Stream 操作
4. **添加 Stream 数据可视化**：直观展示 Stream 消息列表和详细信息

## 技术范围

### 新增功能

- Stream 消息删除 (使用 `XDEL`)
- Stream 消息修改 (通过删除后重新添加实现)
- Stream 详细信息查询 (`XINFO`, `XRANGE`)
- Stream 消息数量和统计信息

### 修改功能

- 重构 `RedisTest.tsx` 组件，专注 Stream 操作
- 更新 API 路由，支持 Stream CRUD
- 增强错误处理和用户反馈

### 用户界面

- Stream 消息列表展示
- 消息添加表单
- 消息操作按钮 (删除、修改)
- Stream 统计信息面板

## 实施策略

1. **向后兼容**：保留现有功能，逐步迁移到 Stream 模式
2. **增量开发**：先实现核心 Stream 操作，再添加高级功能
3. **测试驱动**：为每个新功能编写单元测试和集成测试
4. **用户体验**：确保界面直观，错误信息清晰

## 成功标准

- [ ] 能够创建和管理 Stream 数据
- [ ] 提供 Stream 消息的增删改查操作
- [ ] 实时展示 Stream 数据变化
- [ ] 测试页面完全基于 Stream 操作
- [ ] 所有功能有完整的测试覆盖

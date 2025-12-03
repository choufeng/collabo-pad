## Why

需要实现一个主题管理系统，支持用户创建和订阅主题内容，并实时推送新消息。当前系统已有Redis Stream基础设施，需要扩展支持基于频道的主题管理和实时通信功能。

## What Changes

- 创建新的topic管理API接口，支持创建包含父主题ID、频道ID、内容和用户信息的主题
- 实现基于频道ID的Redis Stream消息存储
- 创建SSE接口提供实时主题数据推送和历史数据获取
- 添加前端测试页面验证API功能
- 扩展现有Redis Stream类型定义以支持主题数据结构

## Impact

- Affected specs: `redis-stream-management`, `data-storage`
- Affected code:
  - 新增: `src/app/api/topic/` 目录下的API路由
  - 新增: `src/app/api/sse/` 目录下的SSE接口
  - 扩展: `src/types/redis-stream.ts` 添加主题相关类型
  - 扩展: `src/lib/redis.ts` 添加主题管理方法
  - 新增: `src/app/topic-test/` 测试页面

**Breaking Changes**: 无，这是新增功能

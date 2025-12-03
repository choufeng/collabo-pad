# 将 SSE 主题数据流集成到 Board 页面

## 问题概述

目前 `src/app/[channel-id]/page.tsx` 页面仅做频道验证后直接渲染 `Board` 组件，而 `Board` 组件使用本地状态管理节点数据。我们需要将已有的 SSE 主题数据流 API 集成到 Board 页面中，取代当前的本地数据管理方式。

## 背景

- 已有 `/api/sse/channel/[channelId]` API 实现了完整的 SSE 推送功能
- `/topic-test` 页面已验证了 SSE API 的完整功能
- 需要将此功能集成到主要的 Board 页面中

## 解决方案概述

在 `src/app/[channel-id]/page.tsx` 中：

1. 创建 SSE 连接管理 Hook
2. 将 Topic 数据转换为 ReactFlow 节点数据
3. 将实时主题更新集成到 Board 组件中
4. 移除本地状态管理

## 影响范围

- 修改：`src/app/[channel-id]/page.tsx`
- 修改：`src/components/Board.tsx`
- 新增：自定义 Hook 用于 SSE 连接管理
- 类型定义：复用现有的 `Topic` 和 `SSEMessage` 类型

## 实施约束

- **范围限制**：仅做 SSE API 接入，不处理其他功能
- **保持兼容**：确保现有 UI 和交互不受影响
- **渐进式**：先实现基本集成，后续优化不在本次范围内
- **开发约束**: 遵循TDD原则，确保代码质量

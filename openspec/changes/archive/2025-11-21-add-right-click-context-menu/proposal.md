## Why

用户需要更直观的方式来在画布的特定位置创建主题节点，当前只能通过右上角的"Add Topic"按钮或拖拽连接线来创建主题，缺乏在指定位置快速创建主题的交互方式。

## What Changes

- **新增**: 画布右键菜单功能，在用户右键点击画布空白区域时显示上下文菜单
- **新增**: 右键菜单包含"Add Topic"选项，点击后在指定位置打开侧边栏表单
- **新增**: 捕获并传递右键点击的 x, y 坐标位置到侧边栏和 API
- **修改**: 扩展 CreateTopicRequest 类型，添加可选的 x, y 坐标字段
- **修改**: 主题创建 API 支持接收和存储坐标位置到 Redis Stream
- **修改**: 侧边栏组件支持接收和处理坐标位置信息

## Impact

- **Affected specs**: board, topic-management
- **Affected code**:
  - `src/components/Board.tsx` - 添加右键菜单处理
  - `src/components/RightSidebar.tsx` - 支持坐标位置参数
  - `src/types/redis-stream.ts` - 扩展类型定义
  - `src/app/api/topic/create/route.ts` - API 支持坐标参数
  - `src/lib/redis.ts` - 存储坐标位置到 Stream

## 约束

- **开发约束**: 遵循TDD原则，编写单元测试和集成测试覆盖新增功能，确保代码质量和稳定性。

## Why

当前侧边栏的节点创建流程包含不必要的标题字段和复杂的双按钮设计，同时遮罩层阻止了用户在侧边栏打开时操作画布。需要简化用户界面并提升工作流程效率。

## What Changes

- 简化节点创建表单：移除标题字段，只保留内容字段
- 优化按钮布局：移除取消按钮，只保留保存按钮
- 移除遮罩层：允许用户在侧边栏打开时继续操作画布
- 调整侧边栏关闭机制：仅通过关闭按钮或ESC键关闭

## Impact

- Affected specs: board（画板交互功能）
- Affected code: src/components/NodeEditor.tsx, src/components/RightSidebar.tsx
- 用户体验改进：更简洁的创建流程，更灵活的操作方式

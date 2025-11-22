## 为什么

SideTrowser组件目前只是一个简单的占位符组件，没有状态管理功能。为了实现侧边栏的显示/隐藏切换功能，需要引入基于zustand的状态管理，以提供统一、可预测的状态控制机制，并支持跨组件的状态共享。

## 变更内容

- 添加基于zustand的SideTrowser状态管理store
- 创建专用的UI状态管理能力，包括侧边栏的开关状态
- 为SideTrowser组件添加状态感知能力
- 提供统一的状态操作接口（open、close、toggle）

## 影响

- 受影响的规范: ui-layout
- 受影响的代码: src/components/SideTrowser.tsx, src/stores/
- 新增文件: src/stores/side-trowser-store.ts
- 遵循项目现有的zustand状态管理模式

## Why

当前Board组件虽然已经支持父子节点的数据结构和创建逻辑，但在展示父子关系时只通过节点颜色区分，缺少清晰的连接线可视化。用户无法直观地看到节点间的层级关系，影响了协作画板的信息传达效果。

## What Changes

- 修复 topic-to-node.ts 中连接线样式，使用层级相关的颜色和动画
- 实现真正的递归层级计算，支持多层嵌套结构
- 统一连接线创建逻辑，确保 SSE 数据和手动创建节点的一致性
- 优化连接线路径，避免重叠和混乱
- 为不同层级使用不同的连接线样式（颜色、粗细、动画）

## Impact

- Affected specs: `specs/board/spec.md`
- Affected code: `src/utils/topic-to-node.ts`, `src/components/Board.tsx`, `src/utils/node-hierarchy.ts` -用户体验：更清晰的父子关系可视化，提升协作效率

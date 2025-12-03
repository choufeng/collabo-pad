# 节点位置优化：保持已有坐标

## Why

虽然我们已经为 Topic 添加了 x,y 坐标支持，并且在 `calculateNodePosition` 函数中优先使用存储的坐标，但是 `optimizeNodePositions` 函数会覆盖所有节点的位置，包括已经有精确坐标的节点。这导致用户通过右键菜单精心创建的主题位置在界面初始化时丢失。

## What Changes

1. **修改 `topicToNode` 函数**：在 metadata 中添加坐标信息标记
2. **重写 `optimizeNodePositions` 函数**：分离有坐标和无坐标的节点，只对无坐标节点进行位置优化
3. **新增 `adjustOverlappingNodes` 函数**：处理有坐标节点之间的重叠问题
4. **添加完整测试覆盖**：验证混合坐标场景的正确处理

## 问题描述

虽然我们已经为 Topic 添加了 x,y 坐标支持，并且在 `calculateNodePosition` 函数中优先使用存储的坐标，但是 `optimizeNodePositions` 函数会覆盖所有节点的位置，包括已经有精确坐标的节点。这导致：

1. 右键菜单创建的带坐标主题在界面初始化时位置被重新计算
2. 用户精心安排的节点位置丢失
3. 坐标系统实际上没有生效

## 建议解决方案

修改 `optimizeNodePositions` 函数，使其：

1. 只对没有坐标的节点进行位置优化
2. 保持已有坐标节点的位置不变
3. 确保新创建的没有坐标的主题仍能正确布局

## 影响范围

- `src/utils/topic-to-node.ts` - `optimizeNodePositions` 函数
- Board 组件中的节点初始化逻辑
- SSE 数据更新时的节点位置处理

## 验证标准

1. 有坐标的主题在界面初始化时保持在指定位置
2. 没有坐标的主题仍能自动布局避免重叠
3. 右键菜单创建的主题位置精确且稳定
4. 多客户端同步时坐标信息保持一致

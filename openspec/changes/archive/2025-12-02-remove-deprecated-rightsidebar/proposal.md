# Remove Deprecated RightSidebar Component

## Overview

清理项目中不再使用的 `RightSidebar` 组件及其相关代码，因为功能已经被 `SideTrowser` 完全替代。

## Background

项目已经完成了从 RightSidebar 到 SideTrowser 的迁移：

- `SideTrowser` 组件和相关状态管理已完全实现
- `Board.tsx` 中只使用 `SideTrowser`，不再使用 `RightSidebar`
- 但 `RightSidebar` 的代码文件和相关导入仍然存在，造成技术债务

## Change ID

`remove-deprecated-rightsidebar`

## Scope

此变更将清理以下内容：

1. 删除 `src/components/RightSidebar.tsx` 文件
2. 删除相关的测试文件 `__tests__/components/RightSidebar.test.tsx`
3. 将 `RightSidebar` 导出的类型（`SidebarMode`, `NodeData`）迁移到合适的位置
4. 更新所有导入这些类型的文件

## Capabilities

### Code Cleanup

- 移除废弃组件文件
- 重新组织共享类型定义
- 更新导入语句

## Relationships

此变更依赖于：

- `add-side-trowser-state` - 已完成，SideTrowser 功能已就绪

## Risk Assessment

**低风险变更**：

- 删除的代码已确认不再被使用
- 类型定义将被迁移到新位置，保持向后兼容
- 影响范围有限，主要是代码清理

## Why

此变更是必要的，因为：

1. **技术债务清理**：RightSidebar 组件虽然已不再使用，但仍然存在于代码库中，造成维护负担
2. **代码整洁性**：移除废弃代码有助于提高代码库的可读性和可维护性
3. **构建优化**：减少不必要的代码文件可以略微提升构建速度
4. **避免混淆**：防止开发者误以为 RightSidebar 仍在使用，避免开发混乱

## What Changes

### 文件删除

- **组件文件**: 删除 `src/components/RightSidebar.tsx` (744 行)
- **组件文件**: 删除 `src/components/NodeEditor.tsx` (745 行) - 额外清理的废弃组件
- **测试文件**: 删除 `__tests__/components/RightSidebar.test.tsx`
- **测试文件**: 删除 `__tests__/components/NodeEditor.test.tsx`
- **测试文件**: 删除 `__tests__/components/NodeEditorAPI.test.tsx`
- **测试文件**: 删除 `__tests__/components/NodeEditorAPISimple.test.tsx`

### 文件新增

- **类型文件**: 创建 `src/types/node.ts` (26 行) - 集中管理节点相关类型

### 类型迁移

- 将 `SidebarMode` 和 `NodeData` 类型从组件迁移到专门的类型文件
- 更新 6 个文件的导入路径：
  - `src/components/Board.tsx`
  - `src/utils/node-hierarchy.ts`
  - `__tests__/utils/testUtils.tsx`
  - 以及其他测试文件

### 总计清理

- **删除**: 6 个文件，约 2000+ 行代码
- **新增**: 1 个文件，26 行代码
- **更新**: 6 个文件的导入语句

## Validation Criteria

1. 构建成功，无 TypeScript 错误
2. 所有测试通过
3. 功能回归测试通过（SideTrowser 正常工作）
4. 代码覆盖率保持不变

## Why

当前add topic和add child topic表单采用本地创建节点的方式，没有调用现有的create topic API接口，导致数据不一致和功能重复。需要将表单提交改为直接调用API接口，确保数据统一存储在Redis Stream中。

## What Changes

- **BREAKING**: 修改add topic表单提交逻辑，从本地节点创建改为调用 `/api/topic/create` API
- **BREAKING**: 修改add child topic表单提交逻辑，从本地节点创建改为调用 `/api/topic/create` API（带parent_id参数）
- 保持表单验证逻辑不变
- 保持UI交互体验不变
- 移除本地节点创建逻辑的重复代码
- 确保API调用失败时的错误处理和用户反馈

## Impact

- Affected specs: `topic-management` (表单提交方式变更)
- Affected code:
  - `src/components/NodeEditor.tsx` (表单提交逻辑)
  - `src/components/Board.tsx` (本地节点创建函数)
  - `src/components/TopicDetailsDisplay.tsx` (子节点创建表单)
  - `src/utils/node-hierarchy.ts` (本地创建工具函数)

此改动确保所有主题创建都通过统一的API接口，提高数据一致性和系统可靠性，为TDD开发提供明确的功能边界。

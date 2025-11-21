## Why

在 topicToNode 转换中为 id 添加了 'topic-'前缀用于 ReactFlow 节点标识，但在 add child topic 表单提交时直接使用了这个带前缀的 id 作为 parent_id，导致 API 接收到不一致的数据格式。

## What Changes

- 在 NodeEditor 的 API 提交前过滤掉 parent_id 中的 'topic-' 前缀
- 确保提交给后端 API 的 parent_id 使用原始的 topic ID 格式
- 保持 ReactFlow 节点 ID 和 API 数据的一致性

## Impact

- Affected specs: topic-management
- Affected code: src/components/NodeEditor.tsx

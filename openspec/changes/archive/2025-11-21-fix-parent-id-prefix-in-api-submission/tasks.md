## 1. Implementation

- [x] 1.1 在 NodeEditor.tsx 的 handleCreateChildNode 函数中添加 parent_id 前缀过滤逻辑
- [x] 1.2 测试创建子主题时 API 提交的数据格式正确性
- [x] 1.3 验证前端 ReactFlow 节点关系和后端数据一致性

## 2. Testing

- [x] 2.1 验证带 'topic-' 前缀的 parent_id 能正确过滤
- [x] 2.2 验证子主题创建后父子关系正确建立
- [x] 2.3 确保不影响其他功能

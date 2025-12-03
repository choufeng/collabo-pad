# SideTrowser Store 使用指南

## 概述

扩展后的SideTrowser Store现在包含三个主要功能模块：

1. **基础开关控制** - 控制侧边栏的显示/隐藏
2. **选中节点管理** - 存储和管理选中的节点信息
3. **表单状态管理** - 管理topic提交表单的状态和加载状态

## 状态结构

```typescript
interface SideTrowserState {
  // 基础状态
  isOpen: boolean;

  // 节点相关信息
  selectedNode: SelectedNode | null;

  // 表单相关信息
  form: TopicForm;
  formResponseLoading: boolean;
}

interface SelectedNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

interface TopicForm {
  // 必需字段 - 用户输入
  content: string;

  // 可选字段 - API可选
  parent_id?: string; // add child topic时有值，add topic时为空
  x?: number; // 画布x坐标
  y?: number; // 画布y坐标
  metadata?: Record<string, unknown>; // 元数据
  tags?: string[]; // 标签数组

  // 注意：channel_id, user_id, user_name 不存储在这里，
  // 在提交API时从路由参数和用户store动态获取
}
```

## 使用方法

### 1. 基础开关控制

```typescript
import { useSideTrowserStore } from "@/stores/side-trowser-store";

const { isOpen, open, close, toggle } = useSideTrowserStore();

// 打开侧边栏
open();

// 关闭侧边栏
close();

// 切换状态
toggle();

// 检查状态
if (isOpen) {
  console.log("侧边栏已打开");
}
```

### 2. 选中节点管理

```typescript
import { useSideTrowserStore } from "@/stores/side-trowser-store";

const { selectedNode, setSelectedNode, clearSelectedNode } =
  useSideTrowserStore();

// 设置选中节点（这个操作会在其他地方处理，这里只展示API）
const node = {
  id: "node-123",
  type: "topic",
  data: { title: "示例节点", content: "节点内容" },
  position: { x: 100, y: 200 },
};

setSelectedNode(node);

// 检查选中的节点
if (selectedNode) {
  console.log("选中的节点ID:", selectedNode.id);
  console.log("节点类型:", selectedNode.type);
  console.log("节点数据:", selectedNode.data);
}

// 清除选中的节点
clearSelectedNode();
```

### 3. 表单状态管理

```typescript
import { useSideTrowserStore } from "@/stores/side-trowser-store";

const {
  form,
  formResponseLoading,
  updateForm,
  setFormResponseLoading,
  resetForm,
} = useSideTrowserStore();

// 更新表单数据
updateForm({
  content: "这是新的主题内容",
});

// 为child topic设置父节点ID
updateForm({
  parent_id: "parent-node-123", // add child topic
});

// 设置坐标位置
updateForm({
  x: 100,
  y: 200,
});

// 添加标签
updateForm({
  tags: ["重要", "待办"],
});

// 检查表单状态
console.log("表单内容:", form.content);
console.log("父节点ID:", form.parent_id);
console.log("坐标位置:", form.x, form.y);

// 设置加载状态（提交时）
setFormResponseLoading(true);

// 提交完成后重置加载状态
setFormResponseLoading(false);

// 重置表单到初始状态
resetForm();
```

### 4. 完整使用示例

```typescript
const SideTrowserController = () => {
  const {
    // 基础状态
    isOpen,

    // 节点相关
    selectedNode,

    // 表单相关
    form,
    formResponseLoading,

    // 操作方法
    open, close, toggle,
    setSelectedNode, clearSelectedNode,
    updateForm, setFormResponseLoading, resetForm
  } = useSideTrowserStore();

  const handleSubmitTopic = async () => {
    if (!form.content.trim()) return;

    setFormResponseLoading(true);

    try {
      // 构建API请求数据
      const requestData = {
        content: form.content,
        parent_id: form.parent_id,
        x: form.x,
        y: form.y,
        metadata: form.metadata,
        tags: form.tags,
        // channel_id, user_id, user_name 需要从其他地方获取
        channel_id: "当前频道ID", // 从路由或状态中获取
        user_id: "当前用户ID", // 从用户store获取
        user_name: "当前用户名", // 从用户store获取
      };

      // 提交逻辑会在这里实现
      if (form.parent_id) {
        // add child topic
        await createTopic(requestData);
      } else {
        // add topic
        await createTopic(requestData);
      }

      // 成功后重置表单
      resetForm();
      close();
    } catch (error) {
      console.error("提交失败:", error);
    } finally {
      setFormResponseLoading(false);
    }
  };

  return (
    <div>
      <button onClick={open}>打开侧边栏</button>

      {isOpen && selectedNode && (
        <div>
          <h3>选中的节点: {selectedNode.id}</h3>
          <p>类型: {selectedNode.type}</p>
        </div>
      )}

      {isOpen && (
        <form onSubmit={handleSubmitTopic}>
          <textarea
            value={form.content}
            onChange={(e) => updateForm({ content: e.target.value })}
            placeholder="主题内容"
            required
          />
          <input
            type="number"
            value={form.x || ''}
            onChange={(e) => updateForm({ x: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="X坐标（可选）"
          />
          <input
            type="number"
            value={form.y || ''}
            onChange={(e) => updateForm({ y: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Y坐标（可选）"
          />
          <input
            value={form.parent_id || ''}
            onChange={(e) => updateForm({ parent_id: e.target.value || undefined })}
            placeholder="父节点ID（添加子主题时）"
          />
          <button type="submit" disabled={formResponseLoading || !form.content.trim()}>
            {formResponseLoading ? '提交中...' :
             form.parent_id ? '添加子主题' : '添加主题'}
          </button>
          <button type="button" onClick={close}>取消</button>
        </form>
      )}
    </div>
  );
};
```

## 状态持久化

所有状态都通过Zustand管理，并支持开发者工具调试：

1. **Redux DevTools集成** - 可以在浏览器开发者工具中查看状态变更历史
2. **状态追踪** - 每个状态变更都有对应的action标识
3. **跨组件共享** - 任何组件都可以通过`useSideTrowserStore` hook访问和修改状态

## 类型安全

所有状态和操作都有完整的TypeScript类型定义，确保：

- 编译时类型检查
- IDE智能提示
- 重构时的类型安全

## 注意事项

1. `selectedNode`的设置逻辑不在本次任务中处理，需要根据具体的节点点击逻辑来实现
2. 表单提交的具体API调用需要根据后端接口来实现
3. 状态重置时，`selectedNode`和`form`都会被重置到初始状态

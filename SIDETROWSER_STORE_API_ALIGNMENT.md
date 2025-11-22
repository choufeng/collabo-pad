# SideTrowser Store API 对齐说明

## 修正概述

基于对现有Topic API接口的详细分析，我们对SideTrowser Store中的表单结构进行了重要修正，以确保与后端API完全兼容。

## 原始设计问题

### 最初的设计（不准确）

```typescript
interface TopicForm {
  title: string;
  description?: string;
  parentId?: string;
}
```

### 实际API需求（准确）

```typescript
// 来自 /src/app/api/topic/create/route.ts 和 /src/types/redis-stream.ts
interface CreateTopicRequest {
  parent_id?: string; // 可选：父主题ID
  channel_id: string; // 必需：频道ID
  content: string; // 必需：主题内容（不是title）
  user_id: string; // 必需：用户ID
  user_name: string; // 必需：用户名
  metadata?: Record<string, any>; // 可选：元数据
  tags?: string[]; // 可选：标签
  x?: number; // 可选：画布X坐标
  y?: number; // 可选：画布Y坐标
}
```

## 修正后的Store结构

### 新的TopicForm接口

```typescript
export interface TopicForm {
  // 必需字段
  content: string;

  // 可选字段
  parent_id?: string; // add child topic时有值，add topic时为空
  x?: number; // 画布x坐标
  y?: number; // 画布y坐标
  metadata?: Record<string, unknown>; // 元数据
  tags?: string[]; // 标签数组

  // 注意：channel_id, user_id, user_name 通常从其他地方获取（如用户store、路由参数等）
}
```

## API字段对应关系

| Store字段   | API字段     | 说明                                               |
| ----------- | ----------- | -------------------------------------------------- |
| `content`   | `content`   | 必需，主题主要内容                                 |
| `parent_id` | `parent_id` | 可选，父主题ID（区分add topic vs add child topic） |
| `x`         | `x`         | 可选，画布X坐标                                    |
| `y`         | `y`         | 可选，画布Y坐标                                    |
| `metadata`  | `metadata`  | 可选，元数据对象                                   |
| `tags`      | `tags`      | 可选，标签数组                                     |

### 需要从其他地方获取的字段

| 字段         | 来源               | 说明           |
| ------------ | ------------------ | -------------- |
| `channel_id` | 路由参数或全局状态 | 当前频道标识   |
| `user_id`    | 用户Store          | 当前登录用户ID |
| `user_name`  | 用户Store          | 当前登录用户名 |

## 使用示例

### 添加普通Topic

```typescript
const { updateForm } = useSideTrowserStore();

updateForm({
  content: "这是一个新主题",
  x: 100,
  y: 200,
  // parent_id 留空表示add topic
});
```

### 添加子Topic

```typescript
const { updateForm } = useSideTrowserStore();

updateForm({
  content: "这是一个子主题",
  parent_id: "parent-node-123", // 设置父节点ID
  x: 150,
  y: 250,
});
```

### API调用示例

```typescript
const createTopicRequest = {
  content: form.content,
  parent_id: form.parent_id,
  x: form.x,
  y: form.y,
  metadata: form.metadata,
  tags: form.tags,
  channel_id: getCurrentChannelId(), // 从其他地方获取
  user_id: currentUser?.id, // 从用户store获取
  user_name: currentUser?.username, // 从用户store获取
};

await fetch("/api/topic/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(createTopicRequest),
});
```

## 关键差异说明

1. **内容字段**: 从`title`和`description`合并为单一的`content`字段
2. **坐标支持**: 新增`x`和`y`坐标字段支持画布定位
3. **元数据支持**: 新增`metadata`和`tags`字段支持扩展信息
4. **API对齐**: 所有字段名称与后端API完全一致

## 数据流

```
用户输入 → SideTrowser Store → 前端组件 → API请求 → 后端处理

表单数据流：
content → CreateTopicRequest.content
parent_id → CreateTopicRequest.parent_id
x, y → CreateTopicRequest.x, y
metadata → CreateTopicRequest.metadata
tags → CreateTopicRequest.tags

补充数据（外部获取）：
channel_id → CreateTopicRequest.channel_id
user_id → CreateTopicRequest.user_id
user_name → CreateTopicRequest.user_name
```

## 验证和约束

根据API分析，需要注意以下约束：

- `content` 最大长度1000字符
- `channel_id` 只能包含字母、数字、下划线和连字符
- `x`和`y`必须是非负数
- `user_id`和`user_name`是必需字段

这些修正确保了前端状态管理与后端API的完全兼容性。

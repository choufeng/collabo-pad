# 数据存储 - 空值标准化处理规格

## ADDED Requirements

### Requirement: 空值转换工具函数

**描述**: MUST 提供统一的空值转换工具函数，确保所有可选字段在存储前正确处理空值。

#### Scenario: Redis Stream 数据写入前转换

```typescript
// 当调用 redisService.addToStream() 时
// 给定的数据包含空字符串或 undefined 值
const data = {
  parent_id: "", // 空字符串
  width: undefined, // undefined 值
  metadata: null, // 已有的 null 值
  content: "有效内容", // 正常值
};
// 应该转换空字符串和 undefined 为 null，保持已有 null 值不变
```

#### Scenario: 数据库字段预处理

```typescript
// 当创建或更新 Topic 实体时
// 传入的数据包含空值字段
const createData = {
  channelId: "channel123",
  parentId: "", // 应该转换为 null
  content: "有效内容",
  x: undefined, // 应该转换为 null
  w: "", // 应该转换为 null
};
// 应该在调用数据库操作前自动转换空值
```

### Requirement: Redis 流参数标准化

**描述**: MUST 修改 Redis 流操作中的参数构建逻辑，确保空值不被写入 Redis 流。

#### Scenario: Redis 消息字段过滤

```typescript
// 当使用 Object.entries(data).flat() 构建 Redis XADD 参数时
// 遇到值为 null、undefined 或空字符串的字段
const streamData = {
  field1: "value1", // 保留
  field2: "", // 应该过滤或转换为 null
  field3: null, // 应该过滤
  field4: undefined, // 应该过滤
};
// 应该只保留有效字段，或确保空值正确处理
```

### Requirement: API 响应一致性

**描述**: SHALL 确保空值转换不影响 API 响应格式，客户端接收的数据保持一致。

#### Scenario: 创建主题 API 响应

```typescript
// 当调用 POST /api/topic/create 时
// 客户端发送包含空值的请求
// 服务端存储后返回的响应应该将 null 值正确映射为 undefined 或约定的格式
```

## MODIFIED Requirements

### Requirement: 主题数据验证增强

**描述**: SHALL 在现有主题创建和更新 API 的验证逻辑中增加空值转换步骤。

#### Scenario: 尺寸字段验证

```typescript
// 现有的 w, h 字段验证
// 应该增加空值转换为 null 的逻辑
if (w !== undefined && (typeof w !== "number" || isNaN(w) || w <= 0)) {
  // 现有验证逻辑不变
}
// 增加空值处理
const processedW = toNull(w);
```

#### Scenario: 坐标字段验证

```typescript
// 现有的 x, y 字段验证
// 应该增加空值转换为 null 的逻辑
const processedX = toNull(x);
const processedY = toNull(y);
```

## Implementation Notes

### 空值转换函数定义

```typescript
/**
 * 将空值转换为 null
 * @param value - 需要转换的值
 * @returns 转换后的值，空字符串、undefined 转为 null，其他值保持不变
 */
export const toNull = <T>(value: T | "" | undefined | null): T | null => {
  return value === "" || value === undefined ? null : value;
};
```

### Redis 流处理更新

- 修改 `addToStream` 方法，在调用 `Object.entries().flat()` 前过滤空值
- 确保消息数据不包含空字段，减少 Redis 存储空间

### 测试覆盖要求

- 空值转换函数的单元测试，覆盖所有边界情况
- Redis 流操作的集成测试，验证空值正确处理
- API 端到端测试，确保空值转换不影响业务逻辑

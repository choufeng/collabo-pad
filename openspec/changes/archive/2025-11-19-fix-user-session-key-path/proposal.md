# Fix UserSession IndexedDB Key Path Error

## 概述

本提案旨在修复用户会话管理中的IndexedDB键路径错误。当前实现中，UserSession表的键路径为`"currentUserId, lastActiveAt"`，但UserSession接口中的`currentUserId`字段允许为`null`，导致IndexedDB无法计算有效的键值，从而抛出"DataError: Failed to execute 'put' on 'IDBObjectStore': Evaluating the object store's key path did not yield a value"错误。

## Why

### 业务需求

1. **用户体验稳定性**：当前错误导致用户登录和会话管理功能失效，影响基本用户流程
2. **数据一致性保障**：需要确保会话数据能够正确存储和检索，维持应用状态的一致性
3. **错误修复**：修复关键的IndexedDB操作错误，恢复应用的核心功能

### 技术需求

1. **键路径修复**：修正IndexedDB表结构，确保键路径字段始终有有效值
2. **会话管理优化**：改进会话数据的管理策略，提高数据操作的可靠性
3. **错误处理增强**：添加更好的错误处理和回退机制

## What Changes

### 核心功能变更

- **数据库模式修改**：
  - 修改userSessions表的键路径，使用单一主键或确保复合键的每个部分都有值
  - 更新UserSession接口定义，确保与数据库模式匹配
  - 修改会话管理逻辑，避免空值键的问题

- **数据服务层更新**：
  - 修复updateSession方法中的数据库操作逻辑
  - 增强错误处理，提供更好的调试信息
  - 添加数据验证，确保会话数据的有效性

### 技术实现变更

- **IndexedDB模式**：
  - 方案A：将键路径改为`"++id"`自增主键
  - 方案B：确保`currentUserId`始终有值，使用特殊值表示"无用户"状态
  - 方案C：移除`lastActiveAt`从键路径，使用`"currentUserId"`作为单键

- **UserSession接口**：
  - 根据选择的方案调整字段定义
  - 添加必要的类型约束和验证
  - 保持向后兼容性

### 数据迁移策略

- **现有数据处理**：
  - 清理可能存在的无效会话数据
  - 提供数据迁移脚本（如果需要）
  - 确保现有用户数据的完整性

## 技术实现要点

### 推荐方案：使用自增主键

1. **数据库模式更新**：

```typescript
// 修改前
userSessions: "currentUserId, lastActiveAt";

// 修改后
userSessions: "++id, currentUserId, lastActiveAt";
```

2. **接口更新**：

```typescript
export interface UserSession {
  id?: number; // 自增主键
  currentUserId: string | null;
  lastActiveAt: Date;
}
```

3. **操作方法修复**：

- 使用`add()`方法而不是`put()`进行新增
- 使用`put()`时提供明确的键值
- 添加适当的数据验证逻辑

### 错误处理增强

- 添加try-catch包装所有数据库操作
- 提供清晰的错误日志信息
- 实现优雅降级机制
- 添加数据完整性检查

## 预期成果

### 功能性成果

- ✅ 修复IndexedDB键路径错误
- ✅ 恢复用户会话管理功能
- ✅ 确保数据的可靠存储和检索
- ✅ 提高应用的稳定性

### 技术性成果

- ✅ 更健壮的数据库操作
- ✅ 更好的错误处理机制
- ✅ 清晰的数据模型定义
- ✅ 向后兼容的API设计

## 风险与缓解

### 潜在风险

1. **数据迁移风险**：现有会话数据可能丢失
   - **缓解措施**：实现安全的数据清理和迁移逻辑

2. **性能影响**：修改键路径可能影响查询性能
   - **缓解措施**：选择最优的索引策略，进行性能测试

3. **兼容性风险**：API变更可能影响现有代码
   - **缓解措施**：保持接口向后兼容，渐进式迁移

## 实施范围

### 包含内容

- 修复user-data-service.ts中的数据库操作错误
- 更新数据库模式定义
- 增强错误处理和日志记录
- 添加相关的测试用例

### 不包含内容

- 大规模的数据重构
- 用户界面的变更
- 其他数据库表的修改

---

**提案ID**: `fix-user-session-key-path`
**创建日期**: 2025-11-19
**预估工作量**: 小
**优先级**: 高

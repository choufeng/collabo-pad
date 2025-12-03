## Context

当前项目在数据库字段命名上存在不一致：

- 数据库：使用 snake_case（如 channel_id, parent_id）
- Drizzle Schema：使用 camelCase（如 channelId, parentId）
- API响应：使用 snake_case（与数据库保持一致）
- 前端代码：混合使用 snake_case 和 camelCase

这种不一致导致了：

1. 复杂的数据转换逻辑
2. 代码维护困难
3. 新开发者学习成本高
4. 容易出现字段映射错误

## Goals / Non-Goals

- Goals: 统一前端字段命名为 snake_case 格式，减少数据转换层
- Goals: 提高代码可读性和维护性
- Goals: 确保类型安全，避免字段映射错误
- Non-Goals: 不修改数据库schema结构
- Non-Goals: 不改变API响应格式
- Non-Goals: 不修改Drizzle schema映射

## Decisions

- Decision: 采用 snake_case 作为统一的字段命名格式
  Reason: 数据库已使用 snake_case，API响应已标准化，前端修改成本最低
- Decision: 保持数据库schema和API响应不变
  Reason: 避免大规模迁移，降低风险
- Decision: 分批次重构前端代码
  Reason: 降低风险，确保系统稳定性

## Alternatives considered

1. **统一使用 camelCase**: 需要修改数据库schema，迁移成本高
2. **保持混合模式**: 无法解决根本问题，维护成本依然很高
3. **使用转换层**: 增加复杂度，无法提高代码质量

## Risks / Trade-offs

- **Risk**: 前端字段名变更可能影响现有组件
  **Mitigation**: 分批次重构，充分测试
- **Risk**: IDE自动补全可能受影响
  **Mitigation**: 更新TypeScript类型定义
- **Trade-off**: 开发习惯 vs 一致性
  **Decision**: 优先保证系统一致性

## Migration Plan

1. **Phase 1**: 更新TypeScript类型定义
2. **Phase 2**: 重构API转换逻辑
3. **Phase 3**: 更新前端组件
4. **Phase 4**: 更新工具函数
5. **Phase 5**: 清理临时转换代码

**Rollback**: Git分阶段回滚，保留原代码备份

## Open Questions

- 是否需要添加ESLint规则强制snake_case命名？
- 是否需要添加字段名验证中间件？

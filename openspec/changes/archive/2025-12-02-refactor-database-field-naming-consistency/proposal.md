## Why

项目中存在数据库字段命名格式不一致的问题，数据库使用snake_case而前端代码混合使用camelCase和snake_case，导致数据转换复杂、维护成本高、代码可读性差。

## What Changes

- 统一前端代码中的字段命名格式为snake_case，与数据库和API响应格式保持一致
- 重构前端类型定义，消除混合命名现象
- 标准化API转换逻辑，确保字段映射的一致性
- 更新相关组件和工具函数，统一字段访问方式
- **BREAKING**: 前端类型定义中的部分字段名将从camelCase改为snake_case

## Impact

- Affected specs: data-storage
- Affected code: src/types/, src/app/api/, src/components/, src/utils/
- Improves code maintainability and consistency
- Reduces data transformation complexity

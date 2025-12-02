## Why

当前topic创建API限制了x和y坐标不能为负数，但界面上允许用户使用负数坐标，这限制了用户在画板上的布局自由度，不应该由后端API限制坐标范围。

## What Changes

- 修改 `/api/topic/create` 的坐标验证逻辑，允许负数坐标值
- 移除对x坐标的非负数限制（`x < 0`检查）
- 移除对y坐标的非负数限制（`y < 0`检查）
- 保持对NaN和undefined的验证检查

## Impact

- Affected specs: topic-management
- Affected code: src/app/api/topic/create/route.ts:130, 143

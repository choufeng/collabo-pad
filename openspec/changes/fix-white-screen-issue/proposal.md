## Why
项目运行后出现白屏，没有任何显示，是因为 @xyflow/react 库的导入方式不正确，导致构建失败。

## What Changes
- 修复 Board.tsx 中 @xyflow/react 的导入语句
- 更新为正确的导入方式以匹配 v12.9.3 版本的 API
- 确保所有必要的组件和类型正确导入

## Impact
- Affected specs: 无（这是修复性变更）
- Affected code: src/components/Board.tsx:4-14
- 修复后用户可以正常访问 /board 页面并看到可用的画布界面
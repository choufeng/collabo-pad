# enhance-username-input-with-dropdown Proposal

## Summary

将首页的username填写框改为可填写下拉框，支持从已有用户中选择，也支持自定义输入创建新用户。

## Problem Statement

当前首页的username输入框仅支持手动输入，没有利用已有的用户数据存储。系统已经支持多用户信息存储，但用户界面没有提供选择已有用户的便捷方式，导致重复输入用户名，用户体验不佳。

## Proposed Solution

将现有的text input替换为可填写的dropdown组件（combobox），提供以下功能：

1. 显示已有用户列表供选择
2. 支持输入过滤用户列表
3. 支持自定义输入创建新用户
4. 保持现有的表单验证逻辑
5. 保持现有用户数据服务API不变

## Scope

### In Scope

- 替换首页username输入框为可填写下拉框
- 集成现有的用户数据服务获取用户列表
- 实现输入过滤和选择功能
- 添加适当的测试用例

### Out of Scope

- 修改用户数据存储结构
- 改变现有用户认证流程
- 修改channel ID输入逻辑

## Design Considerations

1. **用户体验**：下拉框应该直观易用，同时支持键盘导航
2. **性能**：用户列表查询应该高效，避免阻塞UI
3. **兼容性**：保持与现有表单验证和错误处理的兼容
4. **可访问性**：支持屏幕阅读器和键盘导航

## Why

需要改进用户体验，因为：

- 用户经常重复输入相同的用户名，造成不便
- 现有的用户数据存储没有被有效利用
- 缺乏快速选择已有用户的机制
- 传统的文本输入框在移动设备上体验不佳

通过实现可填写下拉框，我们可以显著提升用户效率和满意度，同时更好地利用现有的数据基础设施。

## What Changes

### 组件层面

- **新增ComboBox组件**：创建功能完整的可填写下拉框组件，支持选项选择、输入过滤、键盘导航等
- **修改HomePage组件**：将原有的username输入框替换为ComboBox组件
- **扩展用户数据服务**：添加searchUsers方法支持模糊搜索功能

### 数据层面

- **用户查询优化**：扩展getLatestUsers方法支持更多用户
- **搜索功能**：新增searchUsers方法支持用户名模糊搜索
- **API向后兼容**：保持所有现有API不变

### 界面层面

- **交互优化**：支持鼠标点击、键盘导航、实时过滤
- **状态反馈**：添加加载状态、错误状态、高亮效果
- **帮助信息更新**：更新使用说明以反映新功能

## Success Criteria

- [ ] 用户可以从已有用户列表中选择用户名
- [ ] 用户可以输入新用户名创建新用户
- [ ] 输入时能够实时过滤用户列表
- [ ] 保持所有现有的表单验证功能
- [ ] 所有新功能都有对应的测试用例
- [ ] 符合项目的TDD要求

## Dependencies

- 现有的用户数据服务 (`userDataService.getLatestUsers()`)
- 现有的表单验证逻辑
- 现有的状态管理 (user store)

## Risks and Mitigations

**Risk**: 下拉框组件可能与现有表单样式冲突
**Mitigation**: 使用Tailwind CSS保持样式一致性

**Risk**: 大量用户时影响性能
**Mitigation**: 限制显示的用户数量（如最新10个用户）

## Tasks

详见 `tasks.md`

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

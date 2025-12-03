# 移除频道存储的任务清单

## Phase 1: 数据层清理 (优先级: 高)

### 1.1 移除频道数据服务

- [x] 删除 `src/database/channel-data-service.ts` 文件
- [x] 从 `src/database/user-data-service.ts` 中移除频道相关代码
- [x] 从数据库模式中移除 `channels` 表定义
- [x] 验证数据库结构更新正确

### 1.2 更新类型定义

- [x] 从 `src/database/types.ts` 中移除 `Channel` 接口
- [x] 移除所有对 `Channel` 类型的引用
- [x] 验证类型系统编译通过

## Phase 2: 状态管理简化 (优先级: 高)

### 2.1 移除频道状态管理

- [x] 删除 `src/stores/channel-store.ts` 文件
- [x] 删除 `src/stores/__tests__/channel-store.test.ts` 文件
- [x] 从首页面移除 `useChannelStore` 的导入和使用
- [x] 从画板页面移除 `useChannelStore` 的导入和使用

### 2.2 简化首页面逻辑

- [x] 更新 `src/components/home-page.tsx` 的表单提交逻辑
- [x] 移除 `createChannel` 调用
- [x] 直接使用 `router.push(`/board/${channelId}`)`
- [x] 移除频道相关的错误处理

## Phase 3: 路由和页面简化 (优先级: 高)

### 3.1 简化画板页面

- [x] 更新 `src/app/[channel-id]/page.tsx`
- [x] 移除频道数据库查询逻辑
- [x] 移除频道权限验证
- [x] 保留用户登录验证和频道ID格式验证
- [x] 简化错误处理逻辑

### 3.2 清理路由验证

- [x] 移除 `loadUserChannels` 调用
- [x] 移除 `setCurrentChannel` 调用
- [x] 移除 `databaseService.updateUserSession` 调用
- [x] 保持用户登录状态验证

## Phase 4: 组件和集成更新 (优先级: 中)

### 4.1 更新首页面组件

- [x] 更新 `src/components/__tests__/home-page.test.tsx`
- [x] 移除频道创建相关的测试用例
- [x] 更新表单提交测试的mock设置
- [x] 验证直接跳转逻辑正确

### 4.2 清理相关文件

- [x] 检查并移除其他文件中的频道引用
- [x] 更新 `src/types/index.ts` 中的频道类型
- [x] 清理任何遗留的频道相关导入

## Phase 5: 测试套件重构 (优先级: 中)

### 5.1 删除频道测试

- [x] 删除 `src/database/__tests__/` 中的频道相关测试
- [x] 删除任何 `ChannelDataService` 的测试文件
- [x] 清理测试mock中的频道相关设置

### 5.2 更新集成测试

- [x] 更新端到端测试以适应新的流程
- [x] 验证首页到画板的直接跳转
- [x] 测试开放频道访问功能
- [x] 验证错误处理和重定向逻辑

## Phase 6: 验证和清理 (优先级: 低)

### 6.1 功能验证

- [x] 测试首页面填写用户名和频道ID的完整流程
- [x] 测试直接通过URL访问画板
- [x] 测试频道ID格式验证
- [x] 测试用户未登录时的重定向

### 6.2 性能验证

- [x] 测量首页到画板的跳转时间
- [x] 验证IndexedDB存储空间的减少
- [x] 测试页面加载性能改进
- [x] 验证数据库查询次数的减少

### 6.3 最终清理

- [x] 检查并移除所有无用的导入和引用
- [x] 运行代码格式化和lint检查
- [x] 验证所有测试通过
- [x] 检查构建过程无错误

## 验收标准检查

- [x] 首页面不再创建频道记录，直接跳转到 `/board/{channelId}`
- [x] 画板页面只验证用户登录状态和频道ID格式
- [x] 移除所有频道相关的IndexedDB存储
- [x] 删除 `ChannelDataService`、`useChannelStore` 和相关文件
- [x] 更新测试用例，移除频道存储相关的测试
- [x] 现有画板功能保持正常工作
- [x] 所有测试通过
- [x] 构建成功，无编译错误

## 依赖关系

- Phase 1 必须在 Phase 2 之前完成
- Phase 2 必须在 Phase 3 之前完成
- Phase 3 和 Phase 4 可以并行进行
- Phase 5 依赖于 Phase 1-4 的完成
- Phase 6 是最后的验证阶段

## 风险缓解

- 在删除文件前先创建备份分支
- 逐步进行，每完成一个phase就运行测试
- 保留核心功能的回归测试
- 确保用户体验不受影响

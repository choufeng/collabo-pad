## Why

当前项目缺乏测试框架和测试用例，无法确保代码质量和功能稳定性。需要引入 Jest 测试框架，为核心组件编写全面的单元测试，提高代码可维护性和开发信心。

## What Changes

- 配置 Jest 测试环境和相关依赖
- 为 Board 组件编写单元测试（状态管理、事件处理、交互逻辑）
- 为 RightSidebar 组件编写单元测试（展开/收起、数据传递、键盘事件）
- 为 NodeEditor 组件编写单元测试（表单验证、数据提交、错误处理）
- 添加测试脚本和 CI 配置
- 创建测试辅助工具和 mock 数据

## Impact

- Affected specs: board（画板功能）、testing（测试框架）
- Affected code: package.json、src/components/、新增测试文件
- 开发流程改进：添加测试驱动开发能力，提高代码质量

# Project Context

## Purpose

本项目是一个基于 ReactFlow 的协作画板应用，支持节点创建、编辑、连接和实时协作。项目采用 Next.js 框架，使用 TypeScript 进行类型安全开发，注重代码质量和用户体验。

## Tech Stack

- **前端框架**: Next.js 16.0.3
- **UI 框架**: React 19.2.0
- **类型系统**: TypeScript 5.x
- **样式框架**: Tailwind CSS 4.x
- **画布库**: @xyflow/react 12.9.3
- **测试框架**: Jest + React Testing Library
- **包管理器**: pnpm

## Project Conventions

### Code Style

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 组件使用 PascalCase 命名
- 文件使用 camelCase 命名
- 常量使用 UPPER_SNAKE_CASE 命名

### Architecture Patterns

- 组件化架构，关注点分离
- 使用自定义 hooks 管理状态
- 采用依赖注入模式
- 遵循单一职责原则

### Testing Strategy

**MANDATORY: 测试驱动开发 (TDD)**

- 所有新功能必须采用 TDD 开发模式
- 遵循红-绿-重构循环
- 新代码测试覆盖率必须达到 90% 以上
- 关键业务逻辑必须达到 100% 覆盖率

**测试标准:**

- 语句覆盖率: 90%
- 分支覆盖率: 85%
- 函数覆盖率: 90%
- 行覆盖率: 90%

**测试组织:**

- 测试文件命名: `*.test.tsx`
- 测试目录结构: `__tests__/components/`、`__tests__/utils/`
- 使用工厂函数生成测试数据
- 测试必须独立且可重复执行

### Git Workflow

- 主分支: `main`
- 功能分支: `feature/功能名称`
- 修复分支: `fix/问题描述`
- 提交格式: `type(scope): description`
- TDD 要求: PR 必须包含对应测试用例

## Domain Context

### 核心概念

- **节点 (Node)**: 画板中的可编辑元素，包含内容和位置信息
- **边 (Edge)**: 节点之间的连接线，表示关系或依赖
- **侧边栏 (Sidebar)**: 用于创建和编辑节点的交互界面
- **画布 (Canvas)**: 基于 ReactFlow 的主要交互区域

### 用户交互模式

- **创建模式**: 通过按钮或拖拽创建新节点
- **编辑模式**: 双击节点进行内容编辑
- **连接模式**: 拖拽连接线创建节点关系

## Important Constraints

### TDD 强制要求

- **禁止先写实现后写测试**: 所有新功能必须先写测试
- **覆盖率门槛**: 不达标的代码不得合并
- **代码审查**: 必须验证 TDD 合规性
- **自动化检查**: Git hooks 强制执行 TDD 规范

### 技术约束

- 必须使用 TypeScript 进行类型安全开发
- 组件必须支持 React 19 的并发特性
- 样式必须使用 Tailwind CSS，避免内联样式
- 必须通过 ESLint 和 Prettier 检查

### 业务约束

- 节点内容不能为空，最大长度 500 字符
- 侧边栏宽度固定为 500px
- 必须支持 ESC 键关闭侧边栏
- 必须提供良好的错误处理和用户反馈

## External Dependencies

- **ReactFlow**: 提供节点和边的可视化编辑功能
- **Jest**: 提供测试框架和断言库
- **React Testing Library**: 提供组件测试工具
- **Tailwind CSS**: 提供样式框架和工具类

## 开发工具配置

### IDE 配置推荐

- **VSCode 扩展**: TypeScript Hero, Jest, Tailwind CSS IntelliSense
- **快捷键配置**: 测试运行、覆盖率查看、快速修复
- **调试配置**: 支持断点调试和测试调试

### Git Hooks

- **pre-commit**: ESLint、Prettier、TDD 合规性检查
- **pre-push**: 测试覆盖率验证、类型检查
- **commit-msg**: 提交信息格式验证

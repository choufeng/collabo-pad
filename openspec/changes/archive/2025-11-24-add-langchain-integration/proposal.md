## Why

为了在后端中构建 AI Agent 功能，需要集成 LangChain 1.0 (TypeScript版本) 作为基础框架，为未来创建独立的 agent 方法提供准备。

## What Changes

- 安装 LangChain 1.0 TypeScript 核心依赖包
- 创建 LangChain 配置模块，支持 OpenAI 接口规范
- 在 .env 文件中添加 OpenAI API URL 和密钥配置
- 创建 AI 服务基础架构和测试验证页面
- 添加必要的类型定义和错误处理

## Impact

- Affected specs: `ai-integration` (新增能力)
- Affected code:
  - `package.json` - 添加新依赖
  - `src/lib/` - 新增 AI 配置服务
  - `src/app/api/ai/` - 新增测试 API
  - `.env` - 添加环境变量配置

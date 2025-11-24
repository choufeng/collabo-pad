# LangChain 集成说明

本项目已成功集成 LangChain 1.0 (TypeScript版本)，为未来创建 AI Agent 功能提供基础架构。

## 📁 新增文件

- `src/lib/langchain/config.ts` - LangChain 配置管理
- `src/lib/ai-service.ts` - AI 服务基础架构
- `src/types/env.ts` - 环境变量类型定义
- `src/app/api/ai/test/route.ts` - 测试 API 端点
- `.env` - 新增 OpenAI 配置项

## ⚙️ 环境配置

在 `.env` 文件中配置以下变量：

```env
# OpenAI Configuration for LangChain
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

## 🚀 使用方法

### 1. 测试 API 端点

#### 检查连接状态 (GET)

```bash
curl http://localhost:3000/api/ai/test
```

#### 发送测试消息 (POST)

```bash
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，请介绍一下你自己",
    "config": {
      "systemPrompt": "你是一个有用的助手"
    }
  }'
```

### 2. 在代码中使用 AI 服务

```typescript
import { aiService } from "@/lib/ai-service";

// 初始化服务
await aiService.initialize({
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
});

// 发送消息
const response = await aiService.sendMessage("你好", {
  systemPrompt: "你是一个专业的助手",
});

if (response.success) {
  console.log("AI 响应:", response.data?.response);
  console.log("Token 使用:", response.data?.usage);
}
```

## 🔧 核心功能

### LangChain 配置类 (LangChainConfig)

- 单例模式管理配置
- OpenAI 模型初始化和验证
- 错误处理和日志记录
- 配置重新加载功能

### AI 服务类 (AIService)

- 基础 AI 交互功能
- 连接状态检查
- 完整的错误处理
- 服务状态监控

## 🧪 测试

运行测试：

```bash
# AI 服务测试
npm test src/lib/__tests__/ai-service.test.ts

# API 端点测试
npm test src/app/api/ai/test/__tests__/route.test.ts

# 测试覆盖率
npm run test:coverage -- src/lib/__tests__/ai-service.test.ts
```

## 📈 测试覆盖率

- AI 服务模块：75% 语句覆盖率，62% 分支覆盖率，88.88% 函数覆盖率
- API 端点：100% 测试通过

## 🔮 未来扩展

这个基础架构为以下功能提供了准备：

1. **独立 Agent 方法** - 可以创建专门的 agent 类来处理特定任务
2. **工具集成** - 支持添加自定义工具和函数调用
3. **多模型支持** - 可以轻松切换不同的 AI 模型
4. **流式响应** - 支持实时流式 AI 响应
5. **会话管理** - 可以集成记忆和上下文管理

## 🛡️ 安全注意事项

- 确保 OpenAI API 密钥安全存储
- 在生产环境中使用环境变量管理敏感配置
- 定期轮换 API 密钥
- 监控 API 使用量和成本

## 🐛 故障排除

1. **API 连接失败**：检查 `.env` 文件中的配置是否正确
2. **模块未找到**：确保已安装所有必要的依赖包
3. **TypeScript 错误**：某些 LangChain 类型可能在开发环境中不完全兼容，运行时应该正常工作

## 📚 相关文档

- [LangChain.js 官方文档](https://js.langchain.com/)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)

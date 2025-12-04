# Collabo Pad

这是一个基于Next.js的协作画板应用。

## 功能特性

- **实时协作画板**: 支持多用户实时协作的节点编辑功能
- **节点层级管理**: 支持父子节点关系的创建和管理
- **类型安全**: 使用TypeScript确保类型安全
- **现代化UI**: 使用Tailwind CSS构建响应式界面
- **数据持久化**: 使用PostgreSQL数据库存储数据

## 技术栈

- **前端**: React 19, Next.js 16, TypeScript, Tailwind CSS
- **状态管理**: Zustand
- **画板**: @xyflow/react
- **数据存储**: IndexedDB (Dexie), PostgreSQL
- **测试**: Jest, React Testing Library

## 快速开始

### 环境要求

- Node.js 18+

### 安装依赖

```bash
pnpm install
```

### 环境配置

1. 复制环境配置模板：

```bash
cp .env.local.example .env.local
```

2. 根据需要修改 `.env.local` 中的数据库配置：

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/collabo_pad
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/              # API路由
│   └── [channel-id]/     # 画板页面
├── components/           # React组件
│   ├── Board.tsx        # 主画板组件
│   └── ...
├── database/             # 数据库操作
├── services/             # 业务服务层
├── stores/               # 状态管理
├── utils/                # 工具函数
└── types/                # 类型定义
```

## 开发指南

### 添加新功能

1. 在 `src/services/` 中创建业务逻辑服务
2. 在 `src/app/api/` 中创建对应的API端点
3. 在 `src/components/` 中创建UI组件
4. 编写相应的单元测试

## 测试

### 运行所有测试

```bash
npm test
```

### 运行特定测试

```bash
# API测试
npm test -- --testPathPattern="api"

# 组件测试
npm test -- --testPathPattern="components"
```

### 测试覆盖率

```bash
npm run test:coverage
```

## 部署

### 构建项目

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 故障排除

### 构建问题

1. 确保所有依赖已正确安装
2. 检查TypeScript类型错误
3. 运行 `npm run lint` 检查代码规范

## 贡献

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License

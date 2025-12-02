# Docker 部署指南

本文档介绍如何使用 Docker 和 Docker Compose 部署 Collabo Pad 协作画板应用。

## 📋 目录

- [先决条件](#先决条件)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [生产部署](#生产部署)
- [云平台部署](#云平台部署)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)

## 🔧 先决条件

### 必需软件

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **外部服务**：
  - PostgreSQL 数据库
  - Redis 缓存服务

### 系统要求

- **CPU**: 最少 1 核，推荐 2 核
- **内存**: 最少 512MB，推荐 1GB
- **存储**: 最少 1GB 可用空间
- **网络**: 需要访问外部 PostgreSQL 和 Redis 服务

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd collabo-pad
```

### 2. 配置环境变量

```bash
cp .env.production.example .env.production
```

编辑 `.env.production` 文件，配置您的数据库和 Redis 连接信息。

### 3. 构建和启动应用

```bash
docker-compose up -d
```

### 4. 验证部署

访问健康检查端点：

```bash
curl http://localhost:3000/api/health
```

## ⚙️ 环境配置

### 环境变量说明

在 `.env.production` 文件中配置以下变量：

#### 应用配置

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

#### PostgreSQL 数据库

```env
POSTGRES_URL=postgresql://username:password@hostname:5432/database_name?schema=public
POSTGRES_HOST=hostname
POSTGRES_PORT=5432
POSTGRES_USER=username
POSTGRES_PASSWORD=password
POSTGRES_DB=database_name
```

#### Redis 缓存

```env
REDIS_HOST=hostname
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_if_required
REDIS_DB=0
```

#### 可选配置

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret_here
OPENAI_API_KEY=your_openai_api_key
```

### 外部服务设置

#### PostgreSQL

如果您使用云数据库服务（如 AWS RDS、Google Cloud SQL）：

1. 创建 PostgreSQL 数据库实例
2. 创建专用用户和数据库
3. 配置网络安全组允许应用服务器访问
4. 使用生成的连接字符串

#### Redis

如果您使用云缓存服务（如 AWS ElastiCache、Redis Labs）：

1. 创建 Redis 实例
2. 配置认证和网络安全
3. 获取连接地址和端口
4. 配置密码（如果需要）

## 🏭 生产部署

### 本地生产部署

1. **准备环境**

   ```bash
   # 确保环境变量配置正确
   cp .env.production.example .env.production
   # 编辑 .env.production
   ```

2. **构建镜像**

   ```bash
   docker build -t collabo-pad:latest .
   ```

3. **启动服务**

   ```bash
   docker-compose up -d
   ```

4. **验证部署**

   ```bash
   # 检查容器状态
   docker-compose ps

   # 检查健康状态
   curl http://localhost:3000/api/health

   # 查看日志
   docker-compose logs -f
   ```

### 更新部署

1. **拉取最新代码**

   ```bash
   git pull origin main
   ```

2. **重新构建和部署**

   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **验证更新**
   ```bash
   curl http://localhost:3000/api/health
   ```

## ☁️ 云平台部署

### AWS ECS 部署

1. **创建 ECR 仓库**

   ```bash
   aws ecr create-repository --repository-name collabo-pad
   ```

2. **推送镜像**

   ```bash
   # 获取登录令牌
   aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

   # 标记和推送
   docker tag collabo-pad:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/collabo-pad:latest
   docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/collabo-pad:latest
   ```

3. **创建 ECS 任务定义**
   ```json
   {
     "family": "collabo-pad",
     "requiresCompatibilities": ["FARGATE"],
     "networkMode": "awsvpc",
     "cpu": "256",
     "memory": "512",
     "containerDefinitions": [
       {
         "name": "collabo-pad",
         "image": "<account-id>.dkr.ecr.us-west-2.amazonaws.com/collabo-pad:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/collabo-pad",
             "awslogs-region": "us-west-2",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

### Google Cloud Run 部署

1. **构建和推送镜像**

   ```bash
   # 配置 Docker 认证
   gcloud auth configure-docker

   # 构建镜像
   docker build -t gcr.io/your-project-id/collabo-pad .

   # 推送镜像
   docker push gcr.io/your-project-id/collabo-pad
   ```

2. **部署服务**
   ```bash
   gcloud run deploy collabo-pad \
     --image gcr.io/your-project-id/collabo-pad \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production \
     --set-secrets POSTGRES_URL=postgres-secret:latest \
     --set-secrets REDIS_HOST=redis-secret:latest
   ```

### Azure Container Instances

1. **推送镜像到 ACR**

   ```bash
   # 创建 ACR 仓库
   az acr create --resource-group myResourceGroup --name myRegistry --sku Basic

   # 推送镜像
   az acr build --registry myRegistry --image collabo-pad .
   ```

2. **部署容器实例**
   ```bash
   az container create \
     --resource-group myResourceGroup \
     --name collabo-pad \
     --image myregistry.azurecr.io/collabo-pad \
     --ports 3000 \
     --environment-variables NODE_ENV=production \
     --secure-environment-variables POSTGRES_URL=$POSTGRES_URL REDIS_HOST=$REDIS_HOST
   ```

## 📊 监控和日志

### 健康检查

应用提供 `/api/health` 端点用于健康检查：

```bash
curl http://localhost:3000/api/health
```

响应示例：

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "app": "ok",
    "database": "ok",
    "redis": "ok"
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

### 日志管理

Docker 容器日志通过标准输出管理：

```bash
# 查看实时日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app

# 查看最近的日志
docker-compose logs --tail=100 app
```

### 性能监控

容器自带资源限制和监控：

```bash
# 查看容器资源使用情况
docker stats collabo-pad-app

# 查看容器详细信息
docker inspect collabo-pad-app
```

## 🔧 故障排除

### 常见问题

#### 1. 容器启动失败

**症状**: 容器无法启动或立即退出

**解决方案**:

```bash
# 查看容器日志
docker-compose logs app

# 检查环境变量配置
docker-compose config

# 手动运行调试
docker run -it --rm collabo-pad:latest sh
```

#### 2. 数据库连接失败

**症状**: 健康检查显示数据库错误

**解决方案**:

```bash
# 检查数据库连接字符串
echo $POSTGRES_URL

# 从容器测试连接
docker exec -it collabo-pad-app node -e "
const postgres = require('postgres');
const client = postgres(process.env.POSTGRES_URL);
client\`SELECT 1\`.then(() => console.log('OK')).catch(console.error);
"
```

#### 3. Redis 连接失败

**症状**: 健康检查显示 Redis 错误

**解决方案**:

```bash
# 检查 Redis 连接
docker exec -it collabo-pad-app node -e "
const Redis = require('ioredis');
const redis = new Redis({ host: process.env.REDIS_HOST });
redis.ping().then(() => console.log('OK')).catch(console.error);
"
```

#### 4. 端口冲突

**症状**: 端口已被占用

**解决方案**:

```bash
# 查找占用端口的进程
lsof -i :3000

# 修改 docker-compose.yml 中的端口映射
# ports:
#   - "3001:3000"  # 使用其他主机端口
```

### 调试命令

```bash
# 进入容器调试
docker exec -it collabo-pad-app sh

# 查看容器环境变量
docker exec collabo-pad-app env

# 测试内部健康检查
docker exec collabo-pad-app curl http://localhost:3000/api/health

# 重启容器
docker-compose restart app

# 完全重建
docker-compose down
docker-compose up -d --force-recreate
```

### 性能优化

1. **镜像大小优化**:
   - 使用多阶段构建
   - 选择合适的基础镜像
   - 清理不必要的文件

2. **运行时优化**:
   - 配置适当的资源限制
   - 使用健康检查
   - 配置重启策略

3. **网络优化**:
   - 使用自定义网络
   - 配置适当的超时
   - 优化连接池

## 📞 支持

如果遇到问题，请：

1. 检查本文档的故障排除部分
2. 查看容器日志：`docker-compose logs -f`
3. 运行健康检查：`curl http://localhost:3000/api/health`
4. 联系技术支持并提供：
   - 容器日志
   - 环境变量配置（隐藏敏感信息）
   - 健康检查输出
   - 系统信息

---

**注意**: 定期检查和更新 Docker 镜像，确保安全性和性能优化。

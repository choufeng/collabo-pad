## Why

为了支持生产环境的容器化部署，需要为协作画板项目提供完整的 Docker Compose 配置，使应用能够轻松部署到任何支持 Docker 的云平台或服务器环境中。

## What Changes

- 创建 `Dockerfile` 用于构建应用容器镜像
- 创建 `docker-compose.yml` 用于生产环境部署配置
- 创建 `.dockerignore` 优化构建性能
- 添加生产环境环境变量配置示例

**关键限制：**

- 不包含 Redis 和 PostgreSQL 等外部服务（使用外部云服务）
- 针对生产环境进行优化配置
- 支持静态资源优化和性能调优

## Impact

- **影响的规格：** `deployment`
- **影响的代码：** 新增 Docker 相关配置文件，不影响现有应用代码
- **部署影响：** 使项目支持容器化部署到云平台（AWS ECS、Google Cloud Run、Azure Container Instances 等）

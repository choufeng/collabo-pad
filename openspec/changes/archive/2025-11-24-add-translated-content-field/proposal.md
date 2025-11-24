## Why

当前的 topic/create API 将 AI 翻译后的内容直接存储在 `content` 字段中，导致原始用户输入内容丢失，无法支持多语言显示和后续的内容处理需求。

## What Changes

- 添加 `translated_content` 字段到数据库 schema
- 修改 topic/create API 逻辑，将原始内容存储在 `content`，翻译后内容存储在 `translated_content`
- 更新 TopicService 以支持新字段
- 修改相关类型定义
- **BREAKING**: 数据库 schema 变更，需要迁移

## Impact

- Affected specs: topic-management, ai-integration
- Affected code: src/database/schema.ts, src/services/TopicService.ts, src/app/api/topic/create/route.ts, src/types/redis-stream.ts

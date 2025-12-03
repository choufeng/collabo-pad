## 1. 数据库 Schema 更新

- [x] 1.1 在 topics 表中添加 translated_content 字段
- [x] 1.2 更新 TypeScript 类型定义
- [x] 1.3 创建数据库迁移脚本

## 2. 服务层更新

- [x] 2.1 更新 TopicService.create 方法支持 translated_content
- [x] 2.2 更新 TopicService.update 方法支持 translated_content
- [x] 2.3 更新相关接口定义

## 3. API 层更新

- [x] 3.1 修改 topic/create API 存储逻辑
- [x] 3.2 更新 API 响应类型
- [x] 3.3 更新输入验证逻辑

## 4. 类型系统更新

- [x] 4.1 更新 CreateTopicRequest 接口
- [x] 4.2 更新 CreateTopicResponse 接口
- [x] 4.3 更新其他相关类型定义

## 5. 测试和验证

- [x] 5.1 更新单元测试
- [x] 5.2 验证 API 功能正常
- [x] 5.3 测试数据迁移

## 1. 更新TypeScript类型定义

- [x] 1.1 更新 src/types/redis-stream.ts 中的Topic接口，统一使用snake_case
- [x] 1.2 更新 src/types/index.ts 中的相关类型定义
- [x] 1.3 检查并更新其他类型定义文件中的字段命名

## 2. 重构数据转换逻辑

- [x] 2.1 优化 src/app/api/topics/channel/[channelId]/route.ts 中的字段转换逻辑
- [x] 2.2 更新 src/app/api/topics/hierarchy/[channelId]/route.ts 中的数据转换
- [x] 2.3 检查并更新其他API路由文件中的字段映射
- [x] 2.4 创建统一的字段转换工具函数（现有实现已足够）

## 3. 更新前端组件

- [x] 3.1 更新 src/utils/topic-to-node.ts 中的TopicNodeData接口
- [x] 3.2 修改 src/components/Board.tsx 中的字段访问逻辑
- [x] 3.3 更新 src/app/[channel-id]/page.tsx 中的数据使用
- [x] 3.4 检查并更新其他使用topic数据的组件（NodeContentView, test页面）

## 4. 更新服务层

- [x] 4.1 检查并更新 src/services/TopicService.ts 中的字段处理
- [x] 4.2 确保服务层与前端的字段命名保持一致

## 5. 测试和验证

- [x] 5.1 运行现有测试套件，确保没有破坏性变更
- [x] 5.2 手动测试核心功能：主题创建、更新、查询
- [x] 5.3 验证前端画板组件的数据渲染正确性
- [x] 5.4 检查API响应格式的一致性
- [x] 5.5 修复坐标字段的NaN值问题

## 6. 清理和文档

- [x] 6.1 移除不再需要的字段转换代码（已统一格式，无需额外转换）
- [x] 6.2 修复坐标字段验证逻辑，确保不会传递NaN值
- [x] 6.3 检查并更新相关文档（如果有）

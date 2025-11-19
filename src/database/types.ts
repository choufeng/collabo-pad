/**
 * 数据库类型定义
 * 基于 IndexedDB 的简化数据结构
 */

export interface User {
  id: string; // 自动生成的 UUID
  username: string; // 用户输入的用户名
  createdAt: Date; // 创建时间
}

export interface UserSession {
  currentUserId: string | null;
  lastActiveAt: Date;
}

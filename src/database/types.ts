/**
 * 数据库类型定义
 * 基于 IndexedDB 的数据结构
 */

export interface User {
  id: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  name?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  currentUserId: string | null;
  currentChannelId: string | null;
  lastActiveAt: Date;
}

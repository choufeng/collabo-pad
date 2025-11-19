/**
 * 简化的用户数据服务实现
 * 基于 Dexie.js 的用户数据管理
 */

import Dexie, { Table } from "dexie";
import { User, UserSession } from "./types";

// 简化的数据库类定义
export class CollaboPadDB extends Dexie {
  users!: Table<User>;
  userSessions!: Table<UserSession>;

  constructor() {
    super("collaboPadDB");
    this.version(1).stores({
      users: "id, username, createdAt",
      userSessions: "currentUserId, lastActiveAt",
    });
  }
}

// 简化的用户数据服务接口
export interface UserDataService {
  createOrGetUser(username: string): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  getLatestUsers(limit?: number): Promise<User[]>;
  clearUserData(): Promise<void>;
}

// 简化的用户数据服务实现
export class UserDataServiceImpl implements UserDataService {
  private db: CollaboPadDB;

  constructor() {
    this.db = new CollaboPadDB();
  }

  async createOrGetUser(username: string): Promise<User> {
    const trimmedUsername = username.trim();

    // 查找现有用户
    const existingUser = await this.db.users
      .where("username")
      .equals(trimmedUsername)
      .first();

    if (existingUser) {
      // 更新会话
      await this.updateSession(existingUser.id);
      return existingUser;
    }

    // 创建新用户
    const newUser: User = {
      id: this.generateUUID(),
      username: trimmedUsername,
      createdAt: new Date(),
    };

    await this.db.users.add(newUser);
    await this.updateSession(newUser.id);
    return newUser;
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.db.userSessions.toCollection().first();

    if (!session?.currentUserId) {
      return null;
    }

    return await this.db.users.get(session.currentUserId);
  }

  async getLatestUsers(limit: number = 5): Promise<User[]> {
    try {
      // 按创建时间降序排列，获取最新的用户
      return await this.db.users
        .orderBy("createdAt")
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error("获取最新用户失败:", error);
      return [];
    }
  }

  async clearUserData(): Promise<void> {
    await this.db.users.clear();
    await this.db.userSessions.clear();
  }

  private async updateSession(userId: string): Promise<void> {
    const existingSession = await this.db.userSessions.toCollection().first();

    const sessionData: UserSession = {
      currentUserId: userId,
      lastActiveAt: new Date(),
    };

    if (existingSession) {
      await this.db.userSessions.update(existingSession.id, sessionData);
    } else {
      await this.db.userSessions.add(sessionData);
    }
  }

  private generateUUID(): string {
    // 生成简单的 UUID
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

// 导出单例实例
export const userDataService = new UserDataServiceImpl();

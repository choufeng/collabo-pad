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
    super("collaboPadDBv2");

    // 修复后的schema：使用自增主键避免键路径错误
    this.version(1).stores({
      users: "id, username, createdAt",
      userSessions: "++id, currentUserId, lastActiveAt",
    });
  }
}

// 简化的用户数据服务接口
export interface UserDataService {
  createOrGetUser(username: string): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  getLatestUsers(limit?: number): Promise<User[]>;
  searchUsers(query: string, limit?: number): Promise<User[]>;
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
    try {
      // 按 lastActiveAt 降序获取最后活跃的会话
      const sessions = await this.db.userSessions
        .orderBy("lastActiveAt")
        .reverse()
        .toArray();

      if (sessions.length === 0) {
        return null;
      }

      // 找到第一个有效的会话（有 currentUserId 且对应的用户存在）
      for (const session of sessions) {
        if (!session?.currentUserId) {
          continue;
        }

        try {
          const user = await this.db.users.get(session.currentUserId);
          if (user) {
            return user;
          }
          // 如果用户不存在，清理这个无效的会话记录
          await this.cleanInvalidSession(session.id);
        } catch (error) {
          console.warn("获取用户失败，跳过会话:", error);
          continue;
        }
      }

      // 如果没有找到有效会话，清理所有无效会话
      await this.cleanAllInvalidSessions();
      return null;
    } catch (error) {
      console.error("获取当前用户失败:", error);
      return null;
    }
  }

  async getLatestUsers(limit: number = 10): Promise<User[]> {
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

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      if (!query.trim().length) {
        return [];
      }

      const searchTerm = query.trim().toLowerCase();

      // 搜索用户名包含搜索词的用户，按创建时间降序排列
      const allUsers = await this.db.users.toArray();
      return allUsers
        .filter((user) => user.username.toLowerCase().includes(searchTerm))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error("搜索用户失败:", error);
      return [];
    }
  }

  async clearUserData(): Promise<void> {
    await this.db.users.clear();
    await this.db.userSessions.clear();
  }

  private async updateSession(userId?: string): Promise<void> {
    try {
      const existingSession = await this.db.userSessions.toCollection().first();

      const sessionData: UserSession = {
        currentUserId: userId || null,
        lastActiveAt: new Date(),
      };

      if (existingSession && existingSession.id) {
        // 更新现有会话记录
        await this.db.userSessions.put(sessionData, existingSession.id);
      } else {
        // 创建新会话记录
        await this.db.userSessions.add(sessionData);
      }
    } catch (error) {
      console.error("Failed to update user session:", error);
      throw new Error(
        `会话更新失败: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async cleanInvalidSession(sessionId?: number): Promise<void> {
    try {
      if (sessionId != null) {
        await this.db.userSessions.delete(sessionId);
      }
    } catch (error) {
      console.warn("清理无效会话失败:", error);
    }
  }

  private async cleanAllInvalidSessions(): Promise<void> {
    try {
      const sessions = await this.db.userSessions.toArray();
      const validSessions: UserSession[] = [];

      for (const session of sessions) {
        if (session?.currentUserId) {
          try {
            const user = await this.db.users.get(session.currentUserId);
            if (user) {
              validSessions.push(session);
            }
          } catch (error) {
            // 忽略获取用户时的错误，这些会话将被清理
          }
        }
      }

      // 清理所有无效会话
      const sessionsToClean = sessions.filter(
        (session) => !validSessions.includes(session),
      );
      for (const session of sessionsToClean) {
        if (session.id != null) {
          await this.db.userSessions.delete(session.id);
        }
      }
    } catch (error) {
      console.warn("清理无效会话失败:", error);
    }
  }

  private generateUUID(): string {
    // 生成简单的 UUID
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

// 导出单例实例
export const userDataService = new UserDataServiceImpl();

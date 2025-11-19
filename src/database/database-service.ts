/**
 * 数据库服务实现
 * 基于 Dexie.js 的 IndexedDB 操作层
 */

import Dexie, { Table } from "dexie";
import { User, Channel, UserSession } from "./types";

// 数据库类定义
export class CollaboPadDB extends Dexie {
  users!: Table<User>;
  channels!: Table<Channel>;
  userSessions!: Table<UserSession>;

  constructor() {
    super("collaboPadDB");
    this.version(1).stores({
      users: "++id, username, createdAt, updatedAt",
      channels: "id, name, userId, createdAt, updatedAt",
      userSessions: "id, currentUserId, currentChannelId, lastActiveAt",
    });
  }
}

// 数据库服务接口
export interface DatabaseService {
  // 用户操作
  createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // 频道操作
  createChannel(
    channelData: Omit<Channel, "id" | "createdAt" | "updatedAt">,
  ): Promise<Channel>;
  getChannel(id: string): Promise<Channel | undefined>;
  getChannelsByUser(userId: string): Promise<Channel[]>;
  updateChannel(id: string, updates: Partial<Channel>): Promise<Channel>;
  deleteChannel(id: string): Promise<void>;

  // 会话管理
  getUserSession(): Promise<UserSession>;
  updateUserSession(
    session: Partial<Omit<UserSession, "id">>,
  ): Promise<UserSession>;
  clearUserSession(): Promise<void>;
}

// 数据库服务实现
export class DatabaseServiceImpl implements DatabaseService {
  private db: CollaboPadDB;

  constructor() {
    this.db = new CollaboPadDB();
  }

  // 用户操作实现
  async createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      return existingUser;
    }

    const now = new Date();
    const user: User = {
      id: this.generateId(),
      username: userData.username,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.users.add(user);
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return await this.db.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await this.db.users.where("username").equals(username).first();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const now = new Date();
    const updatedData = { ...updates, updatedAt: now };

    await this.db.users.update(id, updatedData);
    const updatedUser = await this.getUser(id);

    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.users.delete(id);
  }

  // 频道操作实现
  async createChannel(
    channelData: Omit<Channel, "id" | "createdAt" | "updatedAt">,
  ): Promise<Channel> {
    // 检查频道是否已存在
    const existingChannel = await this.getChannel(channelData.id);
    if (existingChannel) {
      return existingChannel;
    }

    const now = new Date();
    const channel: Channel = {
      ...channelData,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.channels.add(channel);
    return channel;
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    return await this.db.channels.get(id);
  }

  async getChannelsByUser(userId: string): Promise<Channel[]> {
    return await this.db.channels.where("userId").equals(userId).toArray();
  }

  async updateChannel(id: string, updates: Partial<Channel>): Promise<Channel> {
    const now = new Date();
    const updatedData = { ...updates, updatedAt: now };

    await this.db.channels.update(id, updatedData);
    const updatedChannel = await this.getChannel(id);

    if (!updatedChannel) {
      throw new Error(`Channel with id ${id} not found`);
    }

    return updatedChannel;
  }

  async deleteChannel(id: string): Promise<void> {
    await this.db.channels.delete(id);
  }

  // 会话管理实现
  async getUserSession(): Promise<UserSession> {
    let session = await this.db.userSessions.get("current_session");

    if (!session) {
      // 创建默认会话
      session = {
        id: "current_session",
        currentUserId: null,
        currentChannelId: null,
        lastActiveAt: new Date(),
      };
      await this.db.userSessions.add(session);
    }

    return session;
  }

  async updateUserSession(
    sessionData: Partial<Omit<UserSession, "id">>,
  ): Promise<UserSession> {
    const now = new Date();
    const updatedData = { ...sessionData, lastActiveAt: now };

    await this.db.userSessions.update("current_session", updatedData);
    return await this.getUserSession();
  }

  async clearUserSession(): Promise<void> {
    await this.updateUserSession({
      currentUserId: null,
      currentChannelId: null,
    });
  }

  // 工具方法
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 导出单例实例
export const databaseService = new DatabaseServiceImpl();

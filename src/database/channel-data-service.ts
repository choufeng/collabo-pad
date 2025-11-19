/**
 * 简化的频道数据服务实现
 * 与简化的用户数据服务配合工作
 */

import Dexie, { Table } from "dexie";
import { Channel, User } from "./types";
import { userDataService, CollaboPadDB } from "./user-data-service";

// 简化的频道数据服务接口
export interface ChannelDataService {
  createChannel(
    channelData: Omit<Channel, "id" | "createdAt" | "updatedAt">,
  ): Promise<Channel>;
  getChannel(id: string): Promise<Channel | null>;
  clearChannels(): Promise<void>;
}

// 简化的频道数据服务实现
export class ChannelDataServiceImpl implements ChannelDataService {
  private db: CollaboPadDB;

  constructor() {
    // 使用共享的数据库实例
    this.db = new CollaboPadDB();
  }

  async createChannel(
    channelData: Omit<Channel, "id" | "createdAt" | "updatedAt">,
  ): Promise<Channel> {
    // 查找现有频道
    const existingChannel = await this.db.channels
      .where("id")
      .equals(channelData.id)
      .first();

    if (existingChannel) {
      return existingChannel;
    }

    // 获取当前用户
    const currentUser = await userDataService.getCurrentUser();
    if (!currentUser) {
      throw new Error("用户未登录，无法创建频道");
    }

    const now = new Date();
    const newChannel: Channel = {
      ...channelData,
      userId: currentUser.id,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.channels.add(newChannel);
    return newChannel;
  }

  async getChannel(id: string): Promise<Channel | null> {
    return (await this.db.channels.get(id)) || null;
  }

  async clearChannels(): Promise<void> {
    await this.db.channels.clear();
  }
}

// 导出单例实例
export const channelDataService = new ChannelDataServiceImpl();

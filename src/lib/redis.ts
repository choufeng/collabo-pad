import Redis from "ioredis";
import type {
  StreamMessage,
  StreamInfo,
  Topic,
  CreateTopicRequest,
  CreateTopicResponse,
} from "@/types/redis-stream";

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  connectTimeout: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
}

export class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  private getConfig(): RedisConfig {
    return {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || "0", 10),
      connectTimeout: parseInt(
        process.env.REDIS_CONNECT_TIMEOUT || "10000",
        10,
      ),
      retryDelayOnFailover: parseInt(
        process.env.REDIS_RETRY_DELAY || "1000",
        10,
      ),
      maxRetriesPerRequest: 3,
    };
  }

  async connect(): Promise<Redis> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      const config = this.getConfig();
      this.client = new Redis(config);

      this.client.on("connect", () => {
        console.log("Redis连接已建立");
        this.isConnected = true;
      });

      this.client.on("error", (error) => {
        console.error("Redis连接错误:", error);
        this.isConnected = false;
      });

      this.client.on("close", () => {
        console.log("Redis连接已关闭");
        this.isConnected = false;
      });

      // 测试连接
      await this.client.ping();

      console.log("Redis连接成功");
      this.isConnected = true;

      return this.client;
    } catch (error) {
      console.error("Redis连接失败:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log("Redis连接已断开");
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isConnectionActive(): boolean {
    return this.isConnected && this.client !== null;
  }

  // 基础Redis操作封装
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    return await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    const result = await this.client.exists(key);
    return result === 1;
  }

  async publish(channel: string, message: string): Promise<number> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    return await this.client.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (channel: string, message: string) => void,
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    const subscriber = this.client.duplicate();
    await subscriber.subscribe(channel);

    subscriber.on("message", (channel, message) => {
      callback(channel, message);
    });
  }

  // SSE相关功能
  async addToStream(
    streamKey: string,
    data: Record<string, string>,
  ): Promise<string> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    const result = await this.client.xadd(
      streamKey,
      "*",
      ...Object.entries(data).flat(),
    );

    return result || "";
  }

  async readStream(
    streamKey: string,
    count?: number,
    block?: number,
  ): Promise<any[]> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    try {
      const args: any[] = [];

      if (count) {
        args.push("COUNT", count);
      }

      if (block) {
        args.push("BLOCK", block);
      }

      args.push("STREAMS", streamKey, "$");

      const result = await this.client.xread(args as any);
      return result || [];
    } catch (error) {
      // 如果没有新消息，返回空数组
      if (error instanceof Error && error.message.includes("NOGROUP")) {
        return [];
      }
      throw error;
    }
  }

  // 新增的 Stream 管理功能

  /**
   * 删除 Stream 中的指定消息
   */
  async deleteMessage(streamKey: string, messageId: string): Promise<number> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (!streamKey || !messageId) {
      throw new Error("Stream键名和消息ID是必需的");
    }

    try {
      const result = await this.client.xdel(streamKey, messageId);
      return result;
    } catch (error) {
      console.error("删除Stream消息失败:", error);
      throw new Error(
        `删除消息失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  /**
   * 获取 Stream 的详细信息
   */
  async getStreamInfo(streamKey: string): Promise<StreamInfo | null> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (!streamKey) {
      throw new Error("Stream键名是必需的");
    }

    try {
      // 检查 Stream 是否存在
      const exists = await this.client.exists(streamKey);
      if (!exists) {
        return null;
      }

      // 获取 Stream 信息
      const info = (await this.client.xinfo("STREAM", streamKey)) as string[];

      // 解析信息
      const streamInfo: StreamInfo = {
        length: 0,
        radixTreeKeys: 0,
        radixTreeNodes: 0,
        lastGeneratedId: "",
        groups: 0,
      };

      // Redis XINFO 返回的是一个数组，我们需要解析它
      for (let i = 0; i < info.length; i += 2) {
        const key = info[i];
        const value = info[i + 1];

        switch (key) {
          case "length":
            streamInfo.length = Number(value);
            break;
          case "radix-tree-keys":
            streamInfo.radixTreeKeys = Number(value);
            break;
          case "radix-tree-nodes":
            streamInfo.radixTreeNodes = Number(value);
            break;
          case "last-generated-id":
            streamInfo.lastGeneratedId = String(value);
            break;
          case "groups":
            streamInfo.groups = Number(value);
            break;
          case "first-entry":
            if (Array.isArray(value) && value.length >= 2) {
              streamInfo.firstEntry = {
                id: String(value[0]),
                data: this.parseStreamData(value[1] as string[]),
              };
            }
            break;
          case "last-entry":
            if (Array.isArray(value) && value.length >= 2) {
              streamInfo.lastEntry = {
                id: String(value[0]),
                data: this.parseStreamData(value[1] as string[]),
              };
            }
            break;
        }
      }

      return streamInfo;
    } catch (error) {
      console.error("获取Stream信息失败:", error);
      throw new Error(
        `获取Stream信息失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  /**
   * 获取 Stream 消息范围
   */
  async getStreamRange(
    streamKey: string,
    start?: string,
    end?: string,
    count?: number,
  ): Promise<StreamMessage[]> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (!streamKey) {
      throw new Error("Stream键名是必需的");
    }

    try {
      // 设置默认范围
      const startId = start || "-";
      const endId = end || "+";

      let result;
      if (count && count > 0) {
        result = await this.client.xrange(
          streamKey,
          startId,
          endId,
          "COUNT",
          count.toString(),
        );
      } else {
        result = await this.client.xrange(streamKey, startId, endId);
      }

      if (!result || result.length === 0) {
        return [];
      }

      return result.map(([id, data]) => ({
        id: String(id),
        data: this.parseStreamData(data as string[]),
      }));
    } catch (error) {
      console.error("获取Stream消息范围失败:", error);
      throw new Error(
        `获取消息范围失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  /**
   * 修改 Stream 消息（通过删除后重新添加实现）
   */
  async updateMessage(
    streamKey: string,
    messageId: string,
    newData: Record<string, string>,
  ): Promise<string | null> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (!streamKey || !messageId || !newData) {
      throw new Error("Stream键名、消息ID和新数据都是必需的");
    }

    try {
      // 先删除原消息
      const deleteResult = await this.deleteMessage(streamKey, messageId);

      if (deleteResult === 0) {
        throw new Error("要修改的消息不存在");
      }

      // 添加新消息，保持原始时间戳（如果可能）
      const newMessageId = await this.addToStream(streamKey, newData);

      return newMessageId;
    } catch (error) {
      console.error("修改Stream消息失败:", error);
      throw new Error(
        `修改消息失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  /**
   * 清空整个 Stream
   */
  async clearStream(streamKey: string): Promise<string> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (!streamKey) {
      throw new Error("Stream键名是必需的");
    }

    try {
      // 先检查 Stream 是否存在
      const exists = await this.client.exists(streamKey);
      if (!exists) {
        return "Stream不存在，无需清空";
      }

      // 使用 DEL 命令删除整个 Stream
      const result = await this.client.del(streamKey);

      if (result > 0) {
        return "Stream已成功清空";
      } else {
        throw new Error("清空Stream失败");
      }
    } catch (error) {
      console.error("清空Stream失败:", error);
      throw new Error(
        `清空Stream失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  /**
   * 解析 Stream 数据格式
   * Redis Stream 返回的数据格式是 [key1, value1, key2, value2, ...]
   */
  private parseStreamData(data: string[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (let i = 0; i < data.length; i += 2) {
      if (i + 1 < data.length) {
        result[data[i]] = data[i + 1];
      }
    }

    return result;
  }

  /**
   * 获取 Stream 中的消息数量（长度）
   */
  async getStreamLength(streamKey: string): Promise<number> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (!streamKey) {
      throw new Error("Stream键名是必需的");
    }

    try {
      const length = await this.client.xlen(streamKey);
      return length;
    } catch (error) {
      console.error("获取Stream长度失败:", error);
      throw new Error(
        `获取Stream长度失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  // 主题管理相关方法

  /**
   * 创建主题并存储到Redis Stream
   */
  async createTopic(request: CreateTopicRequest): Promise<CreateTopicResponse> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    // 参数验证
    if (!request.channel_id) {
      throw new Error("频道ID是必需的");
    }
    if (!request.content || request.content.trim().length === 0) {
      throw new Error("主题内容不能为空");
    }
    if (!request.user_id) {
      throw new Error("用户ID是必需的");
    }
    if (!request.user_name) {
      throw new Error("用户名是必需的");
    }

    try {
      // 构建主题数据
      const timestamp = Date.now();
      const topic: Topic = {
        id: "", // 将在添加到stream后获得
        parent_id: request.parent_id,
        channel_id: request.channel_id,
        content: request.content.trim(),
        user_id: request.user_id,
        user_name: request.user_name,
        timestamp,
        metadata: request.metadata,
        tags: request.tags,
        status: "active",
        position_x: request.x,
        position_y: request.y,
      };

      // 构建Stream数据
      const streamData: Record<string, string> = {
        parent_id: request.parent_id || "",
        channel_id: request.channel_id,
        content: request.content,
        user_id: request.user_id,
        user_name: request.user_name,
        timestamp: timestamp.toString(),
        metadata: request.metadata ? JSON.stringify(request.metadata) : "",
        tags: request.tags ? JSON.stringify(request.tags) : "",
        status: "active",
        position_x: request.x !== undefined ? request.x.toString() : "",
        position_y: request.y !== undefined ? request.y.toString() : "",
      };

      // 使用频道ID作为Stream键名
      const streamKey = `channel:${request.channel_id}:topics`;

      // 添加到Redis Stream
      const messageId = await this.addToStream(streamKey, streamData);

      // 设置主题的ID为消息ID
      topic.id = messageId;

      return {
        topic,
        messageId,
        success: true,
        message: "主题创建成功",
      };
    } catch (error) {
      console.error("创建主题失败:", error);
      return {
        topic: {} as Topic,
        messageId: "",
        success: false,
        message: `创建主题失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 从Stream数据解析Topic对象
   */
  private parseTopicFromStreamData(
    messageId: string,
    data: Record<string, string>,
  ): Topic {
    const topic: Topic = {
      id: messageId,
      parent_id: data.parent_id || undefined,
      channel_id: data.channel_id || "",
      content: data.content || "",
      user_id: data.user_id || "",
      user_name: data.user_name || "",
      timestamp: parseInt(data.timestamp || "0", 10),
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
      tags: data.tags ? JSON.parse(data.tags) : undefined,
      status: (data.status as "active" | "archived" | "deleted") || "active",
      position_x: data.position_x ? parseInt(data.position_x, 10) : undefined,
      position_y: data.position_y ? parseInt(data.position_y, 10) : undefined,
    };

    return topic;
  }

  /**
   * 获取指定频道的主题列表
   */
  async getChannelTopics(
    channelId: string,
    start?: string,
    end?: string,
    count?: number,
  ): Promise<{ topics: Topic[]; total: number }> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (!channelId) {
      throw new Error("频道ID是必需的");
    }

    try {
      const streamKey = `channel:${channelId}:topics`;

      // 获取Stream消息
      const streamMessages = await this.getStreamRange(
        streamKey,
        start,
        end,
        count,
      );

      // 解析为Topic对象
      const topics = streamMessages.map((msg) =>
        this.parseTopicFromStreamData(msg.id, msg.data),
      );

      // 获取总数
      const total = await this.getStreamLength(streamKey);

      return { topics, total };
    } catch (error) {
      console.error("获取频道主题失败:", error);
      throw new Error(
        `获取频道主题失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  /**
   * 从指定时间戳开始获取新主题
   */
  async getNewTopics(
    channelId: string,
    lastTimestamp: number,
    count: number = 10,
  ): Promise<Topic[]> {
    if (!this.client) {
      throw new Error("Redis客户端未初始化");
    }

    if (!channelId) {
      throw new Error("频道ID是必需的");
    }

    try {
      const streamKey = `channel:${channelId}:topics`;

      // 构造时间戳对应的Redis Stream ID
      const startId = `${lastTimestamp}-0`;

      // 获取从指定时间戳之后的消息
      const streamMessages = await this.getStreamRange(
        streamKey,
        startId,
        "+",
        count,
      );

      // 解析为Topic对象，过滤掉时间戳相等的消息
      const topics = streamMessages
        .filter((msg) => {
          const msgTimestamp = parseInt(msg.data.timestamp || "0", 10);
          return msgTimestamp > lastTimestamp;
        })
        .map((msg) => this.parseTopicFromStreamData(msg.id, msg.data));

      return topics;
    } catch (error) {
      console.error("获取新主题失败:", error);
      return [];
    }
  }
}

// 创建单例实例
const redisService = new RedisService();

export default redisService;

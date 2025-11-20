import Redis from "ioredis";

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  connectTimeout: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
}

class RedisService {
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
}

// 创建单例实例
const redisService = new RedisService();

export default redisService;

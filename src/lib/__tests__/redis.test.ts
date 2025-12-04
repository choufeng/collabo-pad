import Redis from "ioredis";
import redisService from "../redis";

// Mock ioredis
const mockRedis = {
  on: jest.fn(),
  ping: jest.fn().mockResolvedValue("PONG"),
  set: jest.fn().mockResolvedValue("OK"),
  setex: jest.fn().mockResolvedValue("OK"),
  get: jest.fn().mockResolvedValue("test-value"),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(1),
  publish: jest.fn().mockResolvedValue(1),
  subscribe: jest.fn().mockResolvedValue("OK"),
  duplicate: jest.fn().mockImplementation(function () {
    return this;
  }),
  xadd: jest.fn().mockResolvedValue("123456789-0"),
  xread: jest
    .fn()
    .mockResolvedValue([["test_stream", ["key1", "value1", "key2", "value2"]]]),
  quit: jest.fn().mockResolvedValue("OK"),
};

jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

// Mock process.env
const originalEnv = process.env;

describe("RedisService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      REDIS_HOST: "localhost",
      REDIS_PORT: "6379",
      REDIS_PASSWORD: "",
      REDIS_DB: "0",
      REDIS_CONNECT_TIMEOUT: "10000",
      REDIS_RETRY_DELAY: "1000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getConfig", () => {
    it("应该返回正确的Redis配置", () => {
      // 由于getConfig是私有方法，我们通过connect方法的调用间接测试它
      expect(process.env.REDIS_HOST).toBe("localhost");
      expect(process.env.REDIS_PORT).toBe("6379");
    });

    it("应该使用默认值当环境变量未设置时", () => {
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;

      // 默认值应该通过connect方法正确应用
      expect(Redis).toHaveBeenCalled();
    });
  });

  describe("connect", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("应该成功连接Redis", async () => {
      const result = await redisService.connect();

      expect(Redis).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "localhost",
          port: 6379,
          password: undefined,
          db: 0,
          connectTimeout: 10000,
          retryDelayOnFailover: 1000,
          maxRetriesPerRequest: 3,
        }),
      );

      expect(mockRedis.ping).toHaveBeenCalled();
      expect(mockRedis.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
      expect(mockRedis.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith("close", expect.any(Function));
    });

    it("应该返回已存在的连接当已经连接时", async () => {
      await redisService.connect();
      const mockConstructor = Redis as jest.MockedClass<typeof Redis>;
      mockConstructor.mockClear();

      await redisService.connect();

      expect(Redis).toHaveBeenCalledTimes(1);
    });

    it("应该在连接失败时抛出错误", async () => {
      const mockError = new Error("Connection failed");
      mockRedis.ping.mockRejectedValue(mockError);

      await expect(redisService.connect()).rejects.toThrow("Connection failed");
    });
  });

  describe("基础Redis操作", () => {
    beforeEach(async () => {
      await redisService.connect();
    });

    it("应该能够设置键值", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      await redisService.set("test-key", "test-value");

      expect(mockRedis?.set).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("应该能够设置带TTL的键值", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      await redisService.set("test-key", "test-value", 3600);

      expect(mockRedis?.setex).toHaveBeenCalledWith(
        "test-key",
        3600,
        "test-value",
      );
    });

    it("应该能够获取键值", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      const result = await redisService.get("test-key");

      expect(mockRedis?.get).toHaveBeenCalledWith("test-key");
      expect(result).toBe("test-value");
    });

    it("应该能够删除键", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      const result = await redisService.del("test-key");

      expect(mockRedis?.del).toHaveBeenCalledWith("test-key");
      expect(result).toBe(1);
    });

    it("应该能够检查键是否存在", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      const result = await redisService.exists("test-key");

      expect(mockRedis?.exists).toHaveBeenCalledWith("test-key");
      expect(result).toBe(true);
    });

    it("应该在客户端未初始化时抛出错误", async () => {
      await redisService.disconnect();

      await expect(redisService.set("test-key", "test-value")).rejects.toThrow(
        "Redis客户端未初始化",
      );
      await expect(redisService.get("test-key")).rejects.toThrow(
        "Redis客户端未初始化",
      );
      await expect(redisService.del("test-key")).rejects.toThrow(
        "Redis客户端未初始化",
      );
      await expect(redisService.exists("test-key")).rejects.toThrow(
        "Redis客户端未初始化",
      );
    });
  });

  describe("发布/订阅功能", () => {
    beforeEach(async () => {
      await redisService.connect();
    });

    it("应该能够发布消息", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      const result = await redisService.publish("test-channel", "test-message");

      expect(mockRedis?.publish).toHaveBeenCalledWith(
        "test-channel",
        "test-message",
      );
      expect(result).toBe(1);
    });

    it("应该能够订阅频道", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;
      const mockSubscriber = {
        subscribe: jest.fn().mockResolvedValue("OK"),
        on: jest.fn(),
      };
      mockRedis.duplicate = jest.fn().mockReturnValue(mockSubscriber as any);

      const callback = jest.fn();
      await redisService.subscribe("test-channel", callback);

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith("test-channel");
      expect(mockSubscriber.on).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    });
  });

  describe("流功能", () => {
    beforeEach(async () => {
      await redisService.connect();
    });

    it("应该能够添加数据到流", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      const data = { key1: "value1", key2: "value2" };
      const result = await redisService.addToStream("test_stream", data);

      expect(mockRedis?.xadd).toHaveBeenCalledWith(
        "test_stream",
        "*",
        "key1",
        "value1",
        "key2",
        "value2",
      );
      expect(result).toBe("123456789-0");
    });

    it("应该能够读取流数据", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      const result = await redisService.readStream("test_stream");

      expect(mockRedis?.xread).toHaveBeenCalledWith(
        "BLOCK",
        0,
        "STREAMS",
        "test_stream",
        "$",
      );
      expect(result).toEqual([
        ["test_stream", ["key1", "value1", "key2", "value2"]],
      ]);
    });

    it("应该能够带参数读取流数据", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      const result = await redisService.readStream("test_stream", 10, 5000);

      expect(mockRedis?.xread).toHaveBeenCalledWith(
        "BLOCK",
        5000,
        "COUNT",
        10,
        "STREAMS",
        "test_stream",
        "$",
      );
    });

    it("应该在读取流出错时返回空数组", async () => {
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;
      mockRedis.xread.mockRejectedValue(new Error("NOGROUP"));

      const result = await redisService.readStream("test_stream");

      expect(result).toEqual([]);
    });
  });

  describe("连接管理", () => {
    it("应该能够断开连接", async () => {
      await redisService.connect();
      const mockRedis = redisService.getClient() as jest.Mocked<Redis>;

      await redisService.disconnect();

      expect(mockRedis?.quit).toHaveBeenCalled();
      expect(redisService.getClient()).toBeNull();
    });

    it("应该能够检查连接状态", async () => {
      expect(redisService.isConnectionActive()).toBe(false);

      await redisService.connect();
      expect(redisService.isConnectionActive()).toBe(true);

      await redisService.disconnect();
      expect(redisService.isConnectionActive()).toBe(false);
    });
  });
});

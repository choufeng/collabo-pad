import { RedisService } from "../redis";
import type { StreamMessage } from "@/types/redis-stream";

// Mock Redis client
const mockRedis = {
  xdel: jest.fn(),
  xinfo: jest.fn(),
  xrange: jest.fn(),
  xlen: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  addToStream: jest.fn(),
  on: jest.fn(),
  ping: jest.fn(),
};

// Mock the Redis module
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

describe("Redis Stream Methods", () => {
  let redisService: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock connection
    mockRedis.ping.mockResolvedValue("PONG");
    // Create a new instance for each test
    redisService = new RedisService();
  });

  describe("deleteMessage", () => {
    it("should delete a message from stream successfully", async () => {
      const streamKey = "test_stream";
      const messageId = "1672531200000-0";
      const expectedResult = 1;

      mockRedis.xdel.mockResolvedValue(expectedResult);

      await redisService.connect();
      const result = await redisService.deleteMessage(streamKey, messageId);

      expect(mockRedis.xdel).toHaveBeenCalledWith(streamKey, messageId);
      expect(result).toBe(expectedResult);
    });

    it("should throw error when client is not initialized", async () => {
      // Reset client to null
      mockRedis.getClient.mockReturnValue(null);

      await expect(
        redisService.deleteMessage("test_stream", "message-id"),
      ).rejects.toThrow("Redis客户端未初始化");
    });

    it("should throw error when parameters are missing", async () => {
      await redisService.connect();

      await expect(
        redisService.deleteMessage("", "message-id"),
      ).rejects.toThrow("Stream键名和消息ID是必需的");
      await expect(
        redisService.deleteMessage("test_stream", ""),
      ).rejects.toThrow("Stream键名和消息ID是必需的");
    });
  });

  describe("getStreamInfo", () => {
    it("should return stream info when stream exists", async () => {
      const streamKey = "test_stream";
      const mockInfo = [
        "length",
        "5",
        "radix-tree-keys",
        "5",
        "radix-tree-nodes",
        "4",
        "last-generated-id",
        "1672531200000-4",
        "groups",
        "0",
        "first-entry",
        ["1672531200000-0", ["message", "test1", "type", "start"]],
        "last-entry",
        ["1672531200000-4", ["message", "test5", "type", "end"]],
      ];

      mockRedis.exists.mockResolvedValue(1);
      mockRedis.xinfo.mockResolvedValue(mockInfo);

      await redisService.connect();
      const result = await redisService.getStreamInfo(streamKey);

      expect(mockRedis.exists).toHaveBeenCalledWith(streamKey);
      expect(mockRedis.xinfo).toHaveBeenCalledWith("STREAM", streamKey);
      expect(result).toEqual({
        length: 5,
        radixTreeKeys: 5,
        radixTreeNodes: 4,
        lastGeneratedId: "1672531200000-4",
        groups: 0,
        firstEntry: {
          id: "1672531200000-0",
          data: { message: "test1", type: "start" },
        },
        lastEntry: {
          id: "1672531200000-4",
          data: { message: "test5", type: "end" },
        },
      });
    });

    it("should return null when stream does not exist", async () => {
      const streamKey = "nonexistent_stream";

      mockRedis.exists.mockResolvedValue(0);

      await redisService.connect();
      const result = await redisService.getStreamInfo(streamKey);

      expect(mockRedis.exists).toHaveBeenCalledWith(streamKey);
      expect(result).toBeNull();
    });
  });

  describe("getStreamRange", () => {
    it("should return messages in range without count", async () => {
      const streamKey = "test_stream";
      const mockResult = [
        ["1672531200000-0", ["message", "test1", "type", "start"]],
        ["1672531200000-1", ["message", "test2", "type", "middle"]],
      ];

      mockRedis.xrange.mockResolvedValue(mockResult);

      await redisService.connect();
      const result = await redisService.getStreamRange(streamKey);

      expect(mockRedis.xrange).toHaveBeenCalledWith(streamKey, "-", "+");
      expect(result).toEqual([
        {
          id: "1672531200000-0",
          data: { message: "test1", type: "start" },
        },
        {
          id: "1672531200000-1",
          data: { message: "test2", type: "middle" },
        },
      ]);
    });

    it("should return messages with count limit", async () => {
      const streamKey = "test_stream";
      const count = 10;
      const mockResult = [
        ["1672531200000-0", ["message", "test1", "type", "start"]],
      ];

      mockRedis.xrange.mockResolvedValue(mockResult);

      await redisService.connect();
      const result = await redisService.getStreamRange(
        streamKey,
        "-",
        "+",
        count,
      );

      expect(mockRedis.xrange).toHaveBeenCalledWith(
        streamKey,
        "-",
        "+",
        "COUNT",
        count.toString(),
      );
      expect(result).toEqual([
        {
          id: "1672531200000-0",
          data: { message: "test1", type: "start" },
        },
      ]);
    });

    it("should return empty array when no messages found", async () => {
      const streamKey = "empty_stream";

      mockRedis.xrange.mockResolvedValue([]);

      await redisService.connect();
      const result = await redisService.getStreamRange(streamKey);

      expect(result).toEqual([]);
    });
  });

  describe("updateMessage", () => {
    it("should update message by deleting and adding new one", async () => {
      const streamKey = "test_stream";
      const messageId = "1672531200000-0";
      const newData = { message: "updated content", type: "updated" };
      const newMessageId = "1672531200000-1";

      mockRedis.xdel.mockResolvedValue(1);
      mockRedis.addToStream.mockResolvedValue(newMessageId);

      await redisService.connect();
      const result = await redisService.updateMessage(
        streamKey,
        messageId,
        newData,
      );

      expect(mockRedis.xdel).toHaveBeenCalledWith(streamKey, messageId);
      expect(mockRedis.addToStream).toHaveBeenCalledWith(streamKey, newData);
      expect(result).toBe(newMessageId);
    });

    it("should throw error when message does not exist", async () => {
      const streamKey = "test_stream";
      const messageId = "nonexistent-message";
      const newData = { message: "updated content" };

      mockRedis.xdel.mockResolvedValue(0); // No message deleted

      await redisService.connect();
      await expect(
        redisService.updateMessage(streamKey, messageId, newData),
      ).rejects.toThrow("要修改的消息不存在");
    });
  });

  describe("clearStream", () => {
    it("should clear existing stream", async () => {
      const streamKey = "test_stream";

      mockRedis.exists.mockResolvedValue(1);
      mockRedis.del.mockResolvedValue(1);

      await redisService.connect();
      const result = await redisService.clearStream(streamKey);

      expect(mockRedis.exists).toHaveBeenCalledWith(streamKey);
      expect(mockRedis.del).toHaveBeenCalledWith(streamKey);
      expect(result).toBe("Stream已成功清空");
    });

    it("should return message when stream does not exist", async () => {
      const streamKey = "nonexistent_stream";

      mockRedis.exists.mockResolvedValue(0);

      await redisService.connect();
      const result = await redisService.clearStream(streamKey);

      expect(mockRedis.exists).toHaveBeenCalledWith(streamKey);
      expect(result).toBe("Stream不存在，无需清空");
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe("getStreamLength", () => {
    it("should return stream length", async () => {
      const streamKey = "test_stream";
      const expectedLength = 5;

      mockRedis.xlen.mockResolvedValue(expectedLength);

      await redisService.connect();
      const result = await redisService.getStreamLength(streamKey);

      expect(mockRedis.xlen).toHaveBeenCalledWith(streamKey);
      expect(result).toBe(expectedLength);
    });
  });

  describe("parseStreamData", () => {
    it("should parse flat array into object", async () => {
      const streamKey = "test_stream";
      const mockResult = [
        [
          "1672531200000-0",
          ["key1", "value1", "key2", "value2", "key3", "value3"],
        ],
      ];

      mockRedis.xrange.mockResolvedValue(mockResult);

      await redisService.connect();
      const result = await redisService.getStreamRange(streamKey);

      expect(result).toEqual([
        {
          id: "1672531200000-0",
          data: {
            key1: "value1",
            key2: "value2",
            key3: "value3",
          },
        },
      ]);
    });

    it("should handle odd length arrays gracefully", async () => {
      const streamKey = "test_stream";
      const mockResult = [
        ["1672531200000-0", ["key1", "value1", "key2"]], // Missing value for key2
      ];

      mockRedis.xrange.mockResolvedValue(mockResult);

      await redisService.connect();
      const result = await redisService.getStreamRange(streamKey);

      expect(result).toEqual([
        {
          id: "1672531200000-0",
          data: {
            key1: "value1",
            key2: "",
          },
        },
      ]);
    });
  });
});

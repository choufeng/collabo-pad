import { NextRequest } from "next/server";
import { POST, GET, DELETE } from "../test-data/route";
import redisService from "@/lib/redis";

// Mock redisService
jest.mock("@/lib/redis");

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("/api/redis/test-data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("应该成功写入数据", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockSet = redisService.set as jest.MockedFunction<
        typeof redisService.set
      >;
      const mockAddToStream = redisService.addToStream as jest.MockedFunction<
        typeof redisService.addToStream
      >;
      const mockPublish = redisService.publish as jest.MockedFunction<
        typeof redisService.publish
      >;

      mockConnect.mockResolvedValue(undefined as any);
      mockSet.mockResolvedValue(undefined);
      mockAddToStream.mockResolvedValue("123456789-0");
      mockPublish.mockResolvedValue(1);

      const request = {
        json: jest.fn().mockResolvedValue({
          key: "test-key",
          value: "test-value",
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(mockConnect).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith("test-key", "test-value", undefined);
      expect(mockAddToStream).toHaveBeenCalledWith(
        "test_stream",
        expect.objectContaining({
          key: "test-key",
          value: "test-value",
          type: "test_data",
        }),
      );
      expect(mockPublish).toHaveBeenCalledWith(
        "test_channel",
        expect.any(String),
      );
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("数据写入成功");
    });

    it("应该支持TTL参数", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockSet = redisService.set as jest.MockedFunction<
        typeof redisService.set
      >;
      const mockAddToStream = redisService.addToStream as jest.MockedFunction<
        typeof redisService.addToStream
      >;
      const mockPublish = redisService.publish as jest.MockedFunction<
        typeof redisService.publish
      >;

      mockConnect.mockResolvedValue(undefined as any);
      mockSet.mockResolvedValue(undefined);
      mockAddToStream.mockResolvedValue("123456789-0");
      mockPublish.mockResolvedValue(1);

      const request = {
        json: jest.fn().mockResolvedValue({
          key: "test-key",
          value: "test-value",
          ttl: 3600,
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(mockSet).toHaveBeenCalledWith("test-key", "test-value", 3600);
      expect(mockAddToStream).toHaveBeenCalledWith(
        "test_stream",
        expect.objectContaining({
          ttl: "3600",
        }),
      );
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("应该在缺少必需参数时返回400错误", async () => {
      const request = {
        json: jest.fn().mockResolvedValue({
          key: "test-key",
          // 缺少value
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("key和value是必需的参数");
    });

    it("应该在写入失败时返回500错误", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockError = new Error("Write failed");

      mockConnect.mockRejectedValue(mockError);

      const request = {
        json: jest.fn().mockResolvedValue({
          key: "test-key",
          value: "test-value",
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Write failed");
    });
  });

  describe("GET", () => {
    it("应该成功读取数据", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockGet = redisService.get as jest.MockedFunction<
        typeof redisService.get
      >;
      const mockExists = redisService.exists as jest.MockedFunction<
        typeof redisService.exists
      >;

      mockConnect.mockResolvedValue(undefined as any);
      mockGet.mockResolvedValue("test-value");
      mockExists.mockResolvedValue(true);

      const request = {
        url: "http://localhost:3000/api/redis/test-data?key=test-key",
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(mockConnect).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalledWith("test-key");
      expect(mockExists).toHaveBeenCalledWith("test-key");
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.exists).toBe(true);
      expect(data.value).toBe("test-value");
      expect(data.key).toBe("test-key");
    });

    it("应该在缺少key参数时返回400错误", async () => {
      const request = {
        url: "http://localhost:3000/api/redis/test-data",
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("需要提供key参数");
    });

    it("应该在读取失败时返回500错误", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockError = new Error("Read failed");

      mockConnect.mockRejectedValue(mockError);

      const request = {
        url: "http://localhost:3000/api/redis/test-data?key=test-key",
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Read failed");
    });
  });

  describe("DELETE", () => {
    it("应该成功删除数据", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockDel = redisService.del as jest.MockedFunction<
        typeof redisService.del
      >;

      mockConnect.mockResolvedValue(undefined as any);
      mockDel.mockResolvedValue(1);

      const request = {
        url: "http://localhost:3000/api/redis/test-data?key=test-key",
      } as any;

      const response = await DELETE(request);
      const data = await response.json();

      expect(mockConnect).toHaveBeenCalled();
      expect(mockDel).toHaveBeenCalledWith("test-key");
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("数据删除成功");
      expect(data.deleted).toBe(true);
      expect(data.key).toBe("test-key");
    });

    it("应该在删除不存在的键时返回成功但deleted为false", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockDel = redisService.del as jest.MockedFunction<
        typeof redisService.del
      >;

      mockConnect.mockResolvedValue(undefined as any);
      mockDel.mockResolvedValue(0);

      const request = {
        url: "http://localhost:3000/api/redis/test-data?key=nonexistent-key",
      } as any;

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deleted).toBe(false);
    });

    it("应该在缺少key参数时返回400错误", async () => {
      const request = {
        url: "http://localhost:3000/api/redis/test-data",
      } as any;

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("需要提供key参数");
    });

    it("应该在删除失败时返回500错误", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockError = new Error("Delete failed");

      mockConnect.mockRejectedValue(mockError);

      const request = {
        url: "http://localhost:3000/api/redis/test-data?key=test-key",
      } as any;

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Delete failed");
    });
  });
});

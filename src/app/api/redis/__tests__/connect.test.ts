import { NextRequest } from "next/server";
import { POST, GET } from "../connect/route";
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

describe("/api/redis/connect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("应该成功连接Redis", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockIsConnectionActive =
        redisService.isConnectionActive as jest.MockedFunction<
          typeof redisService.isConnectionActive
        >;

      mockConnect.mockResolvedValue(undefined as any);
      mockIsConnectionActive.mockReturnValue(true);

      const request = {} as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(mockConnect).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "Redis连接成功",
        connected: true,
      });
    });

    it("应该在连接失败时返回500错误", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      const mockError = new Error("Connection failed");

      mockConnect.mockRejectedValue(mockError);

      const request = {} as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(mockConnect).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        message: "Redis连接失败",
        error: "Connection failed",
      });
    });

    it("应该处理未知错误类型", async () => {
      const mockConnect = redisService.connect as jest.MockedFunction<
        typeof redisService.connect
      >;
      mockConnect.mockRejectedValue("String error");

      const request = {} as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("未知错误");
    });
  });

  describe("GET", () => {
    it("应该返回连接状态为已连接", async () => {
      const mockIsConnectionActive =
        redisService.isConnectionActive as jest.MockedFunction<
          typeof redisService.isConnectionActive
        >;
      mockIsConnectionActive.mockReturnValue(true);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        connected: true,
        message: "Redis连接正常",
      });
    });

    it("应该返回连接状态为未连接", async () => {
      const mockIsConnectionActive =
        redisService.isConnectionActive as jest.MockedFunction<
          typeof redisService.isConnectionActive
        >;
      mockIsConnectionActive.mockReturnValue(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        connected: false,
        message: "Redis未连接",
      });
    });
  });
});

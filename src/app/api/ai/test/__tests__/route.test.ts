import { NextRequest } from "next/server";
import { GET, POST } from "../route";

// Mock AI 服务
jest.mock("@/lib/ai-service", () => ({
  aiService: {
    isServiceInitialized: jest.fn(),
    initialize: jest.fn(),
    getServiceStatus: jest.fn(),
    testConnection: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

const mockAIService = require("@/lib/ai-service").aiService;

describe("/api/ai/test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET 请求", () => {
    it("服务已初始化时应该返回服务状态", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(true);
      mockAIService.getServiceStatus.mockReturnValue({
        initialized: true,
        configValid: true,
        modelReady: true,
      });
      mockAIService.testConnection.mockResolvedValue({
        success: true,
        message: "连接正常",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("连接正常");
      expect(data.status).toEqual({
        initialized: true,
        configValid: true,
        modelReady: true,
      });
      expect(data.timestamp).toBeDefined();
    });

    it("服务未初始化时应该尝试初始化", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(false);
      mockAIService.initialize.mockResolvedValue(undefined);
      mockAIService.getServiceStatus.mockReturnValue({
        initialized: true,
        configValid: true,
        modelReady: true,
      });
      mockAIService.testConnection.mockResolvedValue({
        success: true,
        message: "连接正常",
      });

      // Mock 环境变量
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DATABASE_URL: "test-db-url",
        OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      };

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockAIService.initialize).toHaveBeenCalledWith({
        DATABASE_URL: "test-db-url",
        OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      });

      // 恢复环境变量
      process.env = originalEnv;
    });

    it("初始化失败时应该返回错误", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(false);
      mockAIService.initialize.mockRejectedValue(new Error("初始化失败"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("AI 服务未初始化且初始化失败");
      expect(data.error).toBe("初始化失败");
    });

    it("连接测试失败时应该返回失败状态", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(true);
      mockAIService.getServiceStatus.mockReturnValue({
        initialized: true,
        configValid: true,
        modelReady: true,
      });
      mockAIService.testConnection.mockResolvedValue({
        success: false,
        message: "连接失败",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toBe("连接失败");
    });
  });

  describe("POST 请求", () => {
    it("应该成功发送消息并返回 AI 响应", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(true);
      mockAIService.sendMessage.mockResolvedValue({
        success: true,
        data: {
          response: "AI 响应",
          usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30,
          },
        },
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          message: "测试消息",
          config: {
            systemPrompt: "你是一个有用的助手",
          },
        }),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.response).toBe("AI 响应");
      expect(data.data.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
      expect(data.request.message).toBe("测试消息");
      expect(data.request.config.systemPrompt).toBe("你是一个有用的助手");
    });

    it("应该使用默认消息当未提供消息时", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(true);
      mockAIService.sendMessage.mockResolvedValue({
        success: true,
        data: {
          response: "AI 响应",
        },
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockAIService.sendMessage).toHaveBeenCalledWith(
        "你好，这是一个测试消息。",
        undefined,
      );
    });

    it("服务未初始化时应该尝试初始化", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(false);
      mockAIService.initialize.mockResolvedValue(undefined);
      mockAIService.sendMessage.mockResolvedValue({
        success: true,
        data: {
          response: "AI 响应",
        },
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          message: "测试消息",
        }),
      } as unknown as NextRequest;

      // Mock 环境变量
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DATABASE_URL: "test-db-url",
        OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      };

      const response = await POST(mockRequest);

      expect(mockAIService.initialize).toHaveBeenCalled();

      // 恢复环境变量
      process.env = originalEnv;
    });

    it("初始化失败时应该返回错误", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(false);
      mockAIService.initialize.mockRejectedValue(new Error("初始化失败"));

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          message: "测试消息",
        }),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("AI 服务未初始化且初始化失败");
      expect(data.error).toBe("初始化失败");
    });

    it("AI 服务调用失败时应该返回错误", async () => {
      mockAIService.isServiceInitialized.mockReturnValue(true);
      mockAIService.sendMessage.mockResolvedValue({
        success: false,
        error: "AI 调用失败",
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          message: "测试消息",
        }),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe("AI 调用失败");
    });

    it("无效的 JSON 请求应该返回错误", async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error("无效 JSON")),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("API 调用失败");
    });
  });
});

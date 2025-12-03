import { AIService } from "../ai-service";

// Mock LangChain 配置
jest.mock("../langchain/config", () => ({
  LangChainConfig: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true),
    getChatModel: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({
        content: "测试响应",
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }),
    }),
    validateConnection: jest.fn().mockResolvedValue({
      success: true,
      message: "连接正常",
    }),
  })),
  langchainConfig: {
    initialize: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true),
    getChatModel: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({
        content: "测试响应",
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }),
    }),
    validateConnection: jest.fn().mockResolvedValue({
      success: true,
      message: "连接正常",
    }),
  },
}));

jest.mock("@langchain/core/messages", () => ({
  HumanMessage: jest
    .fn()
    .mockImplementation((content) => ({ content, type: "human" })),
  SystemMessage: jest
    .fn()
    .mockImplementation((content) => ({ content, type: "system" })),
}));

describe("AIService", () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = AIService.getInstance();
    jest.clearAllMocks();
  });

  describe("初始化", () => {
    it("应该成功初始化", async () => {
      const mockConfig = {
        DATABASE_URL: "test-db-url",
        OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      };

      await expect(aiService.initialize(mockConfig)).resolves.not.toThrow();
    });

    it("初始化后应该返回正确的状态", async () => {
      const mockConfig = {
        DATABASE_URL: "test-db-url",
        OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      };

      await aiService.initialize(mockConfig);
      expect(aiService.isServiceInitialized()).toBe(true);
    });
  });

  describe("发送消息", () => {
    beforeEach(async () => {
      await aiService.initialize({
        DATABASE_URL: "test-db-url",
        OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      });
    });

    it("应该成功发送消息并接收响应", async () => {
      const result = await aiService.sendMessage("测试消息");

      expect(result.success).toBe(true);
      expect(result.data?.response).toBe("测试响应");
      expect(result.data?.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it("应该支持系统提示", async () => {
      const config = {
        systemPrompt: "你是一个有用的助手",
      };

      const result = await aiService.sendMessage("测试消息", config);

      expect(result.success).toBe(true);
      expect(result.data?.response).toBe("测试响应");
    });

    it("服务未初始化时应该返回错误", async () => {
      const uninitializedService = new AIService();
      const result = await uninitializedService.sendMessage("测试消息");

      expect(result.success).toBe(false);
      expect(result.error).toBe("AI 服务未初始化");
    });
  });

  describe("连接测试", () => {
    beforeEach(async () => {
      await aiService.initialize({
        DATABASE_URL: "test-db-url",
        OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      });
    });

    it("应该成功测试连接", async () => {
      const result = await aiService.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe("连接正常");
    });

    it("服务未初始化时应该返回错误", async () => {
      const uninitializedService = new AIService();
      const result = await uninitializedService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe("AI 服务未初始化");
    });
  });

  describe("服务状态", () => {
    it("未初始化时应该返回正确的状态", () => {
      const uninitializedService = new AIService();
      const status = uninitializedService.getServiceStatus();

      expect(status.initialized).toBe(false);
      // 由于 mock 返回 true，这些字段在测试环境中会是 true
      expect(status.configValid).toBe(true);
      expect(status.modelReady).toBe(true);
    });

    it("初始化后应该返回正确的状态", async () => {
      await aiService.initialize({
        DATABASE_URL: "test-db-url",
        OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      });

      const status = aiService.getServiceStatus();

      expect(status).toEqual({
        initialized: true,
        configValid: true,
        modelReady: true,
      });
    });
  });

  describe("重新初始化", () => {
    it("应该成功重新初始化", async () => {
      const firstConfig = {
        DATABASE_URL: "test-db-url-1",
        OPENAI_API_KEY: "test-key-1",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-3.5-turbo",
      };

      const secondConfig = {
        DATABASE_URL: "test-db-url-2",
        OPENAI_API_KEY: "test-key-2",
        OPENAI_BASE_URL: "https://api.openai.com/v1",
        OPENAI_MODEL: "gpt-4",
      };

      await aiService.initialize(firstConfig);
      expect(aiService.isServiceInitialized()).toBe(true);

      await aiService.reinitialize(secondConfig);
      expect(aiService.isServiceInitialized()).toBe(true);
    });
  });

  describe("单例模式", () => {
    it("应该返回相同的实例", () => {
      const service1 = AIService.getInstance();
      const service2 = AIService.getInstance();

      expect(service1).toBe(service2);
    });
  });
});

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { langchainConfig } from "./langchain/config";
import { EnvConfig } from "@/types/env";

/**
 * AI 消息类型
 */
export interface AIMessage {
  type: "human" | "ai" | "system";
  content: string;
  timestamp: Date;
}

/**
 * AI 服务响应类型
 */
export interface AIServiceResponse {
  success: boolean;
  message?: string;
  data?: {
    response: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
}

/**
 * AI 服务配置
 */
export interface AIServiceConfig {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * AI 服务基础类
 */
export class AIService {
  private static instance: AIService;
  private isInitialized = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * 初始化 AI 服务
   */
  async initialize(config: Partial<EnvConfig>): Promise<void> {
    try {
      langchainConfig.initialize(config);
      this.isInitialized = true;
      console.log("AI 服务初始化成功");
    } catch (error) {
      console.error("AI 服务初始化失败:", error);
      throw error;
    }
  }

  /**
   * 检查服务是否已初始化
   */
  isServiceInitialized(): boolean {
    return this.isInitialized && langchainConfig.isInitialized();
  }

  /**
   * 发送消息到 AI
   */
  async sendMessage(
    message: string,
    config?: AIServiceConfig,
  ): Promise<AIServiceResponse> {
    try {
      if (!this.isServiceInitialized()) {
        return {
          success: false,
          error: "AI 服务未初始化",
        };
      }

      const model = langchainConfig.getChatModel();

      // 构建消息数组
      const messages: any[] = [];

      // 添加系统提示（如果提供）
      if (config?.systemPrompt) {
        messages.push(new SystemMessage(config.systemPrompt));
      }

      // 添加用户消息
      messages.push(new HumanMessage(message));

      // 配置模型参数
      if (config?.maxTokens) {
        // 注意：LangChain 的 ChatOpenAI 在实例化后无法修改 maxTokens
        // 这里仅作为示例，实际使用中可能需要创建新的模型实例
      }

      // 调用 AI
      const response = await model.invoke(messages);

      return {
        success: true,
        data: {
          response: response.content as string,
          usage: {
            promptTokens: (response as any).usage?.prompt_tokens || 0,
            completionTokens: (response as any).usage?.completion_tokens || 0,
            totalTokens: (response as any).usage?.total_tokens || 0,
          },
        },
      };
    } catch (error) {
      console.error("AI 服务调用失败:", error);
      return {
        success: false,
        error: `AI 服务调用失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 测试 AI 服务连接
   */
  async testConnection(): Promise<AIServiceResponse> {
    try {
      if (!this.isServiceInitialized()) {
        return {
          success: false,
          error: "AI 服务未初始化",
        };
      }

      const validation = await langchainConfig.validateConnection();

      return {
        success: validation.success,
        message: validation.message,
      };
    } catch (error) {
      console.error("AI 服务连接测试失败:", error);
      return {
        success: false,
        error: `连接测试失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): {
    initialized: boolean;
    configValid: boolean;
    modelReady: boolean;
  } {
    return {
      initialized: this.isInitialized,
      configValid: langchainConfig.isInitialized(),
      modelReady: langchainConfig.getChatModel() !== null,
    };
  }

  /**
   * 重新初始化服务
   */
  async reinitialize(config: Partial<EnvConfig>): Promise<void> {
    this.isInitialized = false;
    await this.initialize(config);
  }
}

// 导出单例实例
export const aiService = AIService.getInstance();

// 为了在应用启动时初始化 AI 服务，我们需要在适当的地方调用初始化方法
// 这里提供一个初始化函数
export async function initializeAIService(): Promise<void> {
  try {
    const config: Partial<EnvConfig> = {
      DATABASE_URL: process.env.DATABASE_URL || "",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
      OPENAI_BASE_URL:
        process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    };

    await aiService.initialize(config);
  } catch (error) {
    console.error("AI 服务初始化失败:", error);
    throw error;
  }
}

import { ChatOpenAI } from "@langchain/openai";
import { validateEnvConfig, EnvConfig } from "@/types/env";

/**
 * LangChain 配置类
 */
export class LangChainConfig {
  private static instance: LangChainConfig;
  private chatModel: ChatOpenAI | null = null;
  private config: EnvConfig | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): LangChainConfig {
    if (!LangChainConfig.instance) {
      LangChainConfig.instance = new LangChainConfig();
    }
    return LangChainConfig.instance;
  }

  /**
   * 初始化配置
   */
  initialize(config: Partial<EnvConfig>): void {
    const validation = validateEnvConfig(config);

    if (!validation.isValid) {
      throw new Error(
        `LangChain 配置错误: 缺少必需的环境变量: ${validation.missingVars.join(", ")}`,
      );
    }

    this.config = validation.config;
    this.initializeChatModel();
  }

  /**
   * 初始化 ChatOpenAI 模型
   */
  private initializeChatModel(): void {
    if (!this.config) {
      throw new Error("配置未初始化");
    }

    try {
      this.chatModel = new ChatOpenAI({
        openAIApiKey: this.config.OPENAI_API_KEY,
        configuration: {
          baseURL: this.config.OPENAI_BASE_URL,
        },
        modelName: this.config.OPENAI_MODEL,
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 30000, // 30 秒超时
      });
    } catch (error) {
      console.error("ChatOpenAI 模型初始化失败:", error);
      throw new Error(
        `ChatOpenAI 模型初始化失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  /**
   * 获取 ChatOpenAI 模型实例
   */
  getChatModel(): ChatOpenAI {
    if (!this.chatModel) {
      throw new Error("ChatOpenAI 模型未初始化，请先调用 initialize() 方法");
    }
    return this.chatModel;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.chatModel !== null && this.config !== null;
  }

  /**
   * 重新加载配置
   */
  reloadConfig(config: Partial<EnvConfig>): void {
    this.chatModel = null;
    this.config = null;
    this.initialize(config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): EnvConfig | null {
    return this.config;
  }

  /**
   * 验证模型连接
   */
  async validateConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isInitialized()) {
        return { success: false, message: "配置未初始化" };
      }

      const model = this.getChatModel();

      // 发送一个简单的测试消息来验证连接
      await model.invoke("Hello, this is a connection test.");

      return { success: true, message: "OpenAI API 连接正常" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      console.error("OpenAI API 连接验证失败:", error);
      return {
        success: false,
        message: `OpenAI API 连接失败: ${errorMessage}`,
      };
    }
  }
}

// 导出单例实例
export const langchainConfig = LangChainConfig.getInstance();

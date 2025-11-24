import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/ai-service";

/**
 * API 请求体类型定义
 */
interface TestRequest {
  message?: string;
  config?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

/**
 * GET 请求 - 测试连接状态
 */
export async function GET() {
  try {
    // 如果服务未初始化，尝试初始化
    if (!aiService.isServiceInitialized()) {
      try {
        // 尝试从环境变量初始化
        await aiService.initialize({
          DATABASE_URL: process.env.DATABASE_URL || "",
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
          OPENAI_BASE_URL:
            process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
          OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: "AI 服务未初始化且初始化失败",
            error: error instanceof Error ? error.message : "未知错误",
            status: {
              initialized: false,
              configValid: false,
              modelReady: false,
            },
          },
          { status: 500 },
        );
      }
    }

    // 获取服务状态
    const status = aiService.getServiceStatus();

    // 测试连接
    const connectionTest = await aiService.testConnection();

    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.message,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI 测试 API 错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "API 调用失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * POST 请求 - 测试 AI 响应
 */
export async function POST(request: NextRequest) {
  try {
    const body: TestRequest = await request.json();
    const { message = "你好，这是一个测试消息。", config } = body;

    // 如果服务未初始化，尝试初始化
    if (!aiService.isServiceInitialized()) {
      try {
        await aiService.initialize({
          DATABASE_URL: process.env.DATABASE_URL || "",
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
          OPENAI_BASE_URL:
            process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
          OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: "AI 服务未初始化且初始化失败",
            error: error instanceof Error ? error.message : "未知错误",
          },
          { status: 500 },
        );
      }
    }

    // 发送消息到 AI
    const response = await aiService.sendMessage(message, config);

    return NextResponse.json({
      success: response.success,
      data: response.data,
      error: response.error,
      request: {
        message,
        config,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI 测试 API 错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "API 调用失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

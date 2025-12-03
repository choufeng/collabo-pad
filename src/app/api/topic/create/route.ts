import { NextRequest, NextResponse } from "next/server";
import { topicService } from "@/services/TopicService";
import type {
  CreateTopicRequest,
  CreateTopicResponse,
} from "@/types/redis-stream";
import { aiService } from "@/lib/ai-service";
import { systemPrompt } from "@/utils/translate-prompts";

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const {
      parent_id,
      channel_id,
      content,
      user_id,
      user_name,
      metadata,
      tags,
      x,
      y,
      w,
      h,
    } = body as CreateTopicRequest;

    // 基本参数验证
    if (!channel_id || typeof channel_id !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "频道ID是必需的且必须是字符串",
          error: "MISSING_CHANNEL_ID",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "主题内容是必需的且不能为空",
          error: "MISSING_CONTENT",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "主题内容长度不能超过1000个字符",
          error: "CONTENT_TOO_LONG",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "用户ID是必需的",
          error: "MISSING_USER_ID",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    if (!user_name || typeof user_name !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "用户名是必需的",
          error: "MISSING_USER_NAME",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    // 频道ID格式验证
    if (!/^[a-zA-Z0-9_-]+$/.test(channel_id)) {
      return NextResponse.json(
        {
          success: false,
          message: "频道ID只能包含字母、数字、下划线和连字符",
          error: "INVALID_CHANNEL_ID",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    // 父主题ID验证（如果提供）
    if (
      parent_id &&
      (typeof parent_id !== "string" || parent_id.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "父主题ID必须是有效的字符串",
          error: "INVALID_PARENT_ID",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    // 坐标参数验证（如果提供）
    if (x !== undefined && (typeof x !== "number" || isNaN(x))) {
      return NextResponse.json(
        {
          success: false,
          message: "x坐标必须是有效数字",
          error: "INVALID_X_COORDINATE",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    if (y !== undefined && (typeof y !== "number" || isNaN(y))) {
      return NextResponse.json(
        {
          success: false,
          message: "y坐标必须是有效数字",
          error: "INVALID_Y_COORDINATE",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    // 尺寸参数验证（如果提供）
    if (w !== undefined && (typeof w !== "number" || isNaN(w) || w <= 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "宽度必须是正数",
          error: "INVALID_WIDTH",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    if (h !== undefined && (typeof h !== "number" || isNaN(h) || h <= 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "高度必须是正数",
          error: "INVALID_HEIGHT",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    // 内容安全检查 - 过滤潜在的恶意内容
    const sanitizedContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");

    // 确保 AI 服务已初始化
    if (!aiService.isServiceInitialized()) {
      await aiService.initialize({
        DATABASE_URL: process.env.DATABASE_URL!,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL!,
        OPENAI_MODEL: process.env.OPENAI_MODEL!,
      });
    }

    // 直接调用服务
    const translatedContent = await aiService.sendMessage(
      sanitizedContent.trim(),
      {
        systemPrompt,
      },
    );

    // 获取翻译后的内容，如果翻译失败则使用原始内容
    const finalTranslatedContent =
      translatedContent.data?.response?.trim() || sanitizedContent.trim();

    // 构建创建主题请求
    const createRequest: CreateTopicRequest = {
      parent_id: parent_id && parent_id.trim() ? parent_id.trim() : null,
      channel_id: channel_id.trim(),
      content: sanitizedContent.trim(), // 存储原始内容
      user_id: user_id.trim(),
      user_name: user_name.trim(),
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      tags: Array.isArray(tags)
        ? tags.filter((tag) => typeof tag === "string")
        : undefined,
      x: x !== undefined ? Math.round(x) : undefined,
      y: y !== undefined ? Math.round(y) : undefined,
      w: w !== undefined ? Math.round(w) : undefined,
      h: h !== undefined ? Math.round(h) : undefined,
    };

    // 使用TopicService创建主题
    try {
      const topic = await topicService.create({
        channelId: createRequest.channel_id,
        userId: createRequest.user_id,
        username: createRequest.user_name,
        content: createRequest.content,
        translatedContent: finalTranslatedContent,
        parentId:
          createRequest.parent_id && createRequest.parent_id.trim()
            ? createRequest.parent_id.trim()
            : null,
        x: createRequest.x !== undefined ? createRequest.x.toString() : null,
        y: createRequest.y !== undefined ? createRequest.y.toString() : null,
        w: createRequest.w !== undefined ? createRequest.w.toString() : null,
        h: createRequest.h !== undefined ? createRequest.h.toString() : null,
        metadata: createRequest.metadata || null,
        tags: createRequest.tags || null,
      });

      // 直接使用数据库格式，无需转换
      const responseTopic = {
        id: topic.id,
        parent_id: topic.parentId || undefined,
        channel_id: topic.channelId,
        content: topic.content,
        translated_content: topic.translatedContent || undefined,
        user_id: topic.userId,
        user_name: topic.username,
        timestamp: topic.createdAt?.getTime() || Date.now(),
        metadata: topic.metadata || undefined,
        tags: topic.tags || undefined,
        status: "active" as const,
        x:
          topic.x != null && topic.x !== "" && !isNaN(Number(topic.x))
            ? Number(topic.x)
            : undefined,
        y:
          topic.y != null && topic.y !== "" && !isNaN(Number(topic.y))
            ? Number(topic.y)
            : undefined,
        w:
          topic.w != null && topic.w !== "" && !isNaN(Number(topic.w))
            ? Number(topic.w)
            : undefined,
        h:
          topic.h != null && topic.h !== "" && !isNaN(Number(topic.h))
            ? Number(topic.h)
            : undefined,
      };

      // 返回成功响应
      const result: CreateTopicResponse = {
        success: true,
        message: "主题创建成功",
        topic: responseTopic,
        messageId: topic.id, // 使用UUID作为消息ID
      };

      return NextResponse.json(result, { status: 201 });
    } catch (createError) {
      console.error("创建主题失败:", createError);
      return NextResponse.json(
        {
          success: false,
          message: `创建主题失败: ${createError instanceof Error ? createError.message : "未知错误"}`,
          topic: {} as any,
          messageId: "",
          error: "CREATE_TOPIC_FAILED",
        } as CreateTopicResponse,
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("创建主题API错误:", error);

    // 处理JSON解析错误
    if (
      error instanceof SyntaxError &&
      "message" in error &&
      error.message.includes("JSON")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "请求体格式无效，请确保发送有效的JSON",
          error: "INVALID_JSON",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    // 处理其他错误
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
        error: "INTERNAL_SERVER_ERROR",
        topic: {} as any,
        messageId: "",
      } as CreateTopicResponse,
      { status: 500 },
    );
  }
}

// 支持OPTIONS请求用于CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

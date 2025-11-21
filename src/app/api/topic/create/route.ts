import { NextRequest, NextResponse } from "next/server";
import redisService from "@/lib/redis";
import type {
  CreateTopicRequest,
  CreateTopicResponse,
} from "@/types/redis-stream";

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
    if (x !== undefined && (typeof x !== "number" || isNaN(x) || x < 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "x坐标必须是非负数",
          error: "INVALID_X_COORDINATE",
          topic: {} as any,
          messageId: "",
        } as CreateTopicResponse,
        { status: 400 },
      );
    }

    if (y !== undefined && (typeof y !== "number" || isNaN(y) || y < 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "y坐标必须是非负数",
          error: "INVALID_Y_COORDINATE",
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

    // 构建创建主题请求
    const createRequest: CreateTopicRequest = {
      parent_id: parent_id?.trim() || undefined,
      channel_id: channel_id.trim(),
      content: sanitizedContent.trim(),
      user_id: user_id.trim(),
      user_name: user_name.trim(),
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      tags: Array.isArray(tags)
        ? tags.filter((tag) => typeof tag === "string")
        : undefined,
      x: x !== undefined ? Math.round(x) : undefined,
      y: y !== undefined ? Math.round(y) : undefined,
    };

    // 确保Redis连接
    await redisService.connect();

    // 创建主题
    const result = await redisService.createTopic(createRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          ...result,
          error: "CREATE_TOPIC_FAILED",
        } as CreateTopicResponse,
        { status: 500 },
      );
    }

    // 返回成功响应
    return NextResponse.json(result, { status: 201 });
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

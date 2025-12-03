import { NextRequest, NextResponse } from "next/server";
import { topicService } from "@/services/TopicService";
import type { Topic } from "@/types/redis-stream";

export interface UpdateTopicRequest {
  id: string;
  content?: string;
  translated_content?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateTopicResponse {
  success: boolean;
  message: string;
  topic?: Topic;
  error?: string;
}

export async function PUT(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { id, content, translated_content, x, y, w, h, metadata, tags } =
      body as UpdateTopicRequest;

    // 基本参数验证
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "主题ID是必需的且必须是字符串",
          error: "MISSING_TOPIC_ID",
        } as UpdateTopicResponse,
        { status: 400 },
      );
    }

    // 检查主题是否存在
    const existingTopic = await topicService.findById(id);
    if (!existingTopic) {
      return NextResponse.json(
        {
          success: false,
          message: "主题不存在",
          error: "TOPIC_NOT_FOUND",
        } as UpdateTopicResponse,
        { status: 404 },
      );
    }

    // 内容验证（如果提供）
    if (content !== undefined) {
      if (typeof content !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "主题内容必须是字符串",
            error: "INVALID_CONTENT_TYPE",
          } as UpdateTopicResponse,
          { status: 400 },
        );
      }

      if (content.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "主题内容不能为空",
            error: "EMPTY_CONTENT",
          } as UpdateTopicResponse,
          { status: 400 },
        );
      }

      if (content.length > 1000) {
        return NextResponse.json(
          {
            success: false,
            message: "主题内容长度不能超过1000个字符",
            error: "CONTENT_TOO_LONG",
          } as UpdateTopicResponse,
          { status: 400 },
        );
      }
    }

    // 坐标参数验证（如果提供）
    if (x !== undefined && (typeof x !== "number" || isNaN(x))) {
      return NextResponse.json(
        {
          success: false,
          message: "x坐标必须是数字",
          error: "INVALID_X_COORDINATE",
        } as UpdateTopicResponse,
        { status: 400 },
      );
    }

    if (y !== undefined && (typeof y !== "number" || isNaN(y))) {
      return NextResponse.json(
        {
          success: false,
          message: "y坐标必须是数字",
          error: "INVALID_Y_COORDINATE",
        } as UpdateTopicResponse,
        { status: 400 },
      );
    }

    if (w !== undefined && (typeof w !== "number" || isNaN(w) || w <= 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "宽度必须是正数",
          error: "INVALID_WIDTH",
        } as UpdateTopicResponse,
        { status: 400 },
      );
    }

    if (h !== undefined && (typeof h !== "number" || isNaN(h) || h <= 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "高度必须是正数",
          error: "INVALID_HEIGHT",
        } as UpdateTopicResponse,
        { status: 400 },
      );
    }

    // 标签验证（如果提供）
    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json(
        {
          success: false,
          message: "标签必须是数组",
          error: "INVALID_TAGS_TYPE",
        } as UpdateTopicResponse,
        { status: 400 },
      );
    }

    // 内容安全检查 - 过滤潜在的恶意内容
    let sanitizedContent = content;
    if (content !== undefined) {
      sanitizedContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
    }

    // 构建更新数据
    const updateData: any = {};

    if (sanitizedContent !== undefined) {
      updateData.content = sanitizedContent.trim();
    }

    if (translated_content !== undefined) {
      updateData.translatedContent = translated_content.trim();
    }

    if (x !== undefined) {
      updateData.x = x.toString();
    }

    if (y !== undefined) {
      updateData.y = y.toString();
    }

    if (w !== undefined) {
      updateData.w = w.toString();
    }

    if (h !== undefined) {
      updateData.h = h.toString();
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }

    if (tags !== undefined) {
      updateData.tags = tags.filter((tag) => typeof tag === "string");
    }

    // 如果没有需要更新的字段，返回错误
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "没有提供需要更新的字段",
          error: "NO_UPDATE_FIELDS",
        } as UpdateTopicResponse,
        { status: 400 },
      );
    }

    // 更新主题
    const updatedTopic = await topicService.update(id, updateData);

    if (!updatedTopic) {
      return NextResponse.json(
        {
          success: false,
          message: "主题更新失败",
          error: "UPDATE_FAILED",
        } as UpdateTopicResponse,
        { status: 500 },
      );
    }

    // 直接使用数据库格式，无需转换
    const responseTopic: Topic = {
      id: updatedTopic.id,
      parent_id: updatedTopic.parentId || undefined,
      channel_id: updatedTopic.channelId,
      content: updatedTopic.content,
      translated_content: updatedTopic.translatedContent || undefined,
      user_id: updatedTopic.userId,
      user_name: updatedTopic.username,
      timestamp: updatedTopic.updatedAt?.getTime() || Date.now(), // 使用更新时间
      metadata: updatedTopic.metadata || undefined,
      tags: updatedTopic.tags || undefined,
      status: "active" as const,
      x:
        updatedTopic.x != null &&
        updatedTopic.x !== "" &&
        !isNaN(Number(updatedTopic.x))
          ? Number(updatedTopic.x)
          : undefined,
      y:
        updatedTopic.y != null &&
        updatedTopic.y !== "" &&
        !isNaN(Number(updatedTopic.y))
          ? Number(updatedTopic.y)
          : undefined,
      w:
        updatedTopic.w != null &&
        updatedTopic.w !== "" &&
        !isNaN(Number(updatedTopic.w))
          ? Number(updatedTopic.w)
          : undefined,
      h:
        updatedTopic.h != null &&
        updatedTopic.h !== "" &&
        !isNaN(Number(updatedTopic.h))
          ? Number(updatedTopic.h)
          : undefined,
    };

    // 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: "主题更新成功",
        topic: responseTopic,
      } as UpdateTopicResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("更新主题API错误:", error);

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
        } as UpdateTopicResponse,
        { status: 400 },
      );
    }

    // 处理其他错误
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
        error: "INTERNAL_SERVER_ERROR",
      } as UpdateTopicResponse,
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
      "Access-Control-Allow-Methods": "PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

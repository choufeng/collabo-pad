import { NextRequest, NextResponse } from "next/server";
import { topicService } from "@/services/TopicService";
import type { Topic } from "@/types/topic";

export interface DeleteTopicRequest {
  id: string;
  cascade?: boolean; // 是否级联删除子主题，默认为true
}

export interface DeleteTopicResponse {
  success: boolean;
  message: string;
  deletedTopics?: Topic[]; // 被删除的主题列表（包括级联删除的子主题）
  error?: string;
}

export async function DELETE(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { id, cascade = true } = body as DeleteTopicRequest;

    // 基本参数验证
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "主题ID是必需的且必须是字符串",
          error: "MISSING_TOPIC_ID",
        } as DeleteTopicResponse,
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
        } as DeleteTopicResponse,
        { status: 404 },
      );
    }

    // 执行删除操作
    let deletedTopics;
    if (cascade) {
      // 级联删除：删除主题及其所有子主题
      deletedTopics = await topicService.deleteWithDescendants(id);
    } else {
      // 只删除单个主题
      const deletedTopic = await topicService.delete(id);
      deletedTopics = deletedTopic ? [deletedTopic] : [];
    }

    if (deletedTopics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "主题删除失败",
          error: "DELETE_FAILED",
        } as DeleteTopicResponse,
        { status: 500 },
      );
    }

    // 转换为前端兼容的格式
    const convertedDeletedTopics: Topic[] = deletedTopics.map((topic) => ({
      id: topic.id,
      parent_id: topic.parentId || undefined,
      channel_id: topic.channelId,
      content: topic.content,
      user_id: topic.userId,
      user_name: topic.username,
      timestamp: topic.createdAt?.getTime() || Date.now(),
      metadata: topic.metadata || undefined,
      tags: topic.tags || undefined,
      status: "deleted" as const, // 标记为已删除
      position_x: topic.x ? Number(topic.x) : undefined,
      position_y: topic.y ? Number(topic.y) : undefined,
    }));

    // 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: cascade
          ? `成功删除主题及其${deletedTopics.length - 1}个子主题`
          : "成功删除主题",
        deletedTopics: convertedDeletedTopics,
      } as DeleteTopicResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("删除主题API错误:", error);

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
        } as DeleteTopicResponse,
        { status: 400 },
      );
    }

    // 处理其他错误
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
        error: "INTERNAL_SERVER_ERROR",
      } as DeleteTopicResponse,
      { status: 500 },
    );
  }
}

// 支持通过查询参数删除主题（为了与现有API兼容）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> },
) {
  try {
    const resolvedParams = await params;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const cascade = url.searchParams.get("cascade") !== "false"; // 默认为true

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "主题ID是必需的",
          error: "MISSING_TOPIC_ID",
        } as DeleteTopicResponse,
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
        } as DeleteTopicResponse,
        { status: 404 },
      );
    }

    // 执行删除操作
    let deletedTopics;
    if (cascade) {
      deletedTopics = await topicService.deleteWithDescendants(id);
    } else {
      const deletedTopic = await topicService.delete(id);
      deletedTopics = deletedTopic ? [deletedTopic] : [];
    }

    if (deletedTopics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "主题删除失败",
          error: "DELETE_FAILED",
        } as DeleteTopicResponse,
        { status: 500 },
      );
    }

    // 转换为前端兼容的格式
    const convertedDeletedTopics: Topic[] = deletedTopics.map((topic) => ({
      id: topic.id,
      parent_id: topic.parentId || undefined,
      channel_id: topic.channelId,
      content: topic.content,
      user_id: topic.userId,
      user_name: topic.username,
      timestamp: topic.createdAt?.getTime() || Date.now(),
      metadata: topic.metadata || undefined,
      tags: topic.tags || undefined,
      status: "deleted" as const,
      position_x: topic.x ? Number(topic.x) : undefined,
      position_y: topic.y ? Number(topic.y) : undefined,
    }));

    // 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: cascade
          ? `成功删除主题及其${deletedTopics.length - 1}个子主题`
          : "成功删除主题",
        deletedTopics: convertedDeletedTopics,
      } as DeleteTopicResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("删除主题API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
        error: "INTERNAL_SERVER_ERROR",
      } as DeleteTopicResponse,
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
      "Access-Control-Allow-Methods": "DELETE, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

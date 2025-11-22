import { NextRequest, NextResponse } from "next/server";
import { topicService } from "@/services/TopicService";
import type { ChannelTopicsResponse } from "@/types/redis-stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;

    // 参数验证
    if (!channelId || typeof channelId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "频道ID是必需的且必须是字符串",
          error: "MISSING_CHANNEL_ID",
        },
        { status: 400 },
      );
    }

    // 频道ID格式验证
    if (!/^[a-zA-Z0-9_-]+$/.test(channelId)) {
      return NextResponse.json(
        {
          success: false,
          message: "频道ID只能包含字母、数字、下划线和连字符",
          error: "INVALID_CHANNEL_ID",
        },
        { status: 400 },
      );
    }

    // 从数据库获取主题列表
    const topics = await topicService.findByChannelId(channelId);

    // 转换为前端兼容的格式
    const convertedTopics = topics.map((topic) => ({
      id: topic.id,
      parent_id: topic.parentId || undefined,
      channel_id: topic.channelId,
      content: topic.content,
      user_id: topic.userId,
      user_name: topic.username,
      timestamp: topic.createdAt?.getTime() || Date.now(),
      metadata: topic.metadata || undefined,
      tags: topic.tags || undefined,
      status: "active" as const, // 数据库中所有主题都是活跃的
      position_x: topic.x ? Number(topic.x) : undefined,
      position_y: topic.y ? Number(topic.y) : undefined,
      position_w: topic.w ? Number(topic.w) : undefined,
      position_h: topic.h ? Number(topic.h) : undefined,
    }));

    // 构建响应
    const response: ChannelTopicsResponse = {
      topics: convertedTopics,
      total: convertedTopics.length,
      channel_id: channelId,
      last_id:
        convertedTopics.length > 0
          ? convertedTopics[convertedTopics.length - 1].id
          : undefined,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("获取频道主题API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
        error: "INTERNAL_SERVER_ERROR",
      },
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

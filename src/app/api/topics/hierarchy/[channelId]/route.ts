import { NextRequest, NextResponse } from "next/server";
import { topicService, type TopicHierarchyNode } from "@/services/TopicService";
import type { Topic } from "@/types/topic";

// 将TopicHierarchyNode转换为前端兼容的格式
function convertHierarchyNode(node: TopicHierarchyNode): any {
  return {
    id: node.id,
    parent_id: node.parentId || undefined,
    channel_id: node.channelId,
    content: node.content,
    user_id: node.userId,
    user_name: node.username,
    timestamp: node.createdAt?.getTime() || Date.now(),
    metadata: node.metadata || undefined,
    tags: node.tags || undefined,
    status: "active" as const,
    x:
      node.x != null && node.x !== "" && !isNaN(Number(node.x))
        ? Number(node.x)
        : undefined,
    y:
      node.y != null && node.y !== "" && !isNaN(Number(node.y))
        ? Number(node.y)
        : undefined,
    children: node.children.map(convertHierarchyNode), // 递归转换子节点
  };
}

export interface HierarchyResponse {
  success: boolean;
  message: string;
  hierarchy: any[]; // 树形结构的主题数据
  totalTopics: number;
  maxDepth: number;
  error?: string;
}

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
        } as HierarchyResponse,
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
        } as HierarchyResponse,
        { status: 400 },
      );
    }

    // 获取主题层级结构
    const hierarchy = await topicService.findHierarchy(channelId);

    // 计算层级统计信息
    const stats = await topicService.getChannelStats(channelId);

    // 转换为前端兼容的格式
    const convertedHierarchy = hierarchy.map(convertHierarchyNode);

    // 计算树的深度
    const calculateDepth = (nodes: any[]): number => {
      if (nodes.length === 0) return 0;

      let maxDepth = 1;
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          const childDepth = calculateDepth(node.children);
          maxDepth = Math.max(maxDepth, childDepth + 1);
        }
      }
      return maxDepth;
    };

    const maxDepth = calculateDepth(convertedHierarchy);

    // 构建响应
    const response: HierarchyResponse = {
      success: true,
      message: "成功获取主题层级结构",
      hierarchy: convertedHierarchy,
      totalTopics: stats.totalTopics,
      maxDepth,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("获取主题层级结构API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
        error: "INTERNAL_SERVER_ERROR",
        hierarchy: [],
        totalTopics: 0,
        maxDepth: 0,
      } as HierarchyResponse,
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

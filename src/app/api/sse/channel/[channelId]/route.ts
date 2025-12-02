import { NextRequest, NextResponse } from "next/server";
import { topicService } from "@/services/TopicService";
import type { Topic, SSEMessage } from "@/types/redis-stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;

  // 验证频道ID
  if (!channelId || !/^[a-zA-Z0-9_-]+$/.test(channelId)) {
    return NextResponse.json({ error: "无效的频道ID" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const encoder = new TextEncoder();
        let isAlive = true;
        let lastTimestamp = Date.now();

        // 发送连接确认消息
        const sendSSEMessage = (
          type: SSEMessage["type"],
          data?: any,
          message?: string,
        ) => {
          if (!isAlive) return;

          const sseMessage: SSEMessage = {
            type,
            data,
            message,
            timestamp: Date.now(),
            channel_id: channelId,
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(sseMessage)}\n\n`),
          );
        };

        // 连接建立消息
        sendSSEMessage("connection", null, `已连接到频道 ${channelId}`);

        // 发送历史数据
        try {
          const topics = await topicService.findByChannelId(channelId);

          // 按时间倒序发送历史数据
          const sortedTopics = topics.sort(
            (a, b) =>
              (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
          );

          sendSSEMessage(
            "history_data",
            {
              topics: sortedTopics.map((topic) => ({
                id: topic.id,
                parent_id: topic.parentId,
                channel_id: topic.channelId,
                content: topic.content,
                translated_content: topic.translatedContent || undefined,
                user_id: topic.userId,
                user_name: topic.username,
                timestamp: topic.createdAt?.getTime() || Date.now(),
                metadata: topic.metadata,
                tags: topic.tags,
                x: topic.x ? parseFloat(topic.x.toString()) : undefined,
                y: topic.y ? parseFloat(topic.y.toString()) : undefined,
                w: topic.w ? parseFloat(topic.w.toString()) : undefined,
                h: topic.h ? parseFloat(topic.h.toString()) : undefined,
              })),
              total: topics.length,
            },
            `已加载 ${topics.length} 个历史主题`,
          );

          // 更新最后时间戳为最新主题的时间
          if (sortedTopics.length > 0) {
            lastTimestamp = sortedTopics[0].createdAt?.getTime() || Date.now();
          }
        } catch (error) {
          console.error("获取历史数据失败:", error);
          sendSSEMessage("error", null, "获取历史数据失败");
        }

        // 心跳机制
        const heartbeatInterval = setInterval(() => {
          if (isAlive) {
            sendSSEMessage("heartbeat", null, "heartbeat");
          }
        }, 30000); // 每30秒发送一次心跳

        // 监听新主题的机制
        const checkNewTopics = async () => {
          if (!isAlive) return;

          try {
            // 简单的轮询机制检查新主题
            // TODO: 实现PostgreSQL LISTEN/NOTIFY机制
            const currentTopics = await topicService.findByChannelId(channelId);
            const newTopics = currentTopics.filter(
              (topic) =>
                topic.createdAt && topic.createdAt.getTime() > lastTimestamp,
            );

            if (newTopics.length > 0) {
              // 按时间顺序处理新主题
              newTopics.sort(
                (a, b) =>
                  (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0),
              );

              for (const topic of newTopics) {
                sendSSEMessage(
                  "topic_created",
                  {
                    id: topic.id,
                    parent_id: topic.parentId,
                    channel_id: topic.channelId,
                    content: topic.content,
                    translated_content: topic.translatedContent || undefined,
                    user_id: topic.userId,
                    user_name: topic.username,
                    timestamp: topic.createdAt?.getTime() || Date.now(),
                    metadata: topic.metadata,
                    tags: topic.tags,
                    x: topic.x ? parseFloat(topic.x.toString()) : undefined,
                    y: topic.y ? parseFloat(topic.y.toString()) : undefined,
                    w: topic.w ? parseFloat(topic.w.toString()) : undefined,
                    h: topic.h ? parseFloat(topic.h.toString()) : undefined,
                  },
                  `新主题: ${topic.content.substring(0, 50)}...`,
                );

                // 更新最后时间戳
                const topicTime = topic.createdAt?.getTime() || 0;
                if (topicTime > lastTimestamp) {
                  lastTimestamp = topicTime;
                }
              }
            }
          } catch (error) {
            console.error("检查新主题时出错:", error);
            sendSSEMessage("error", null, "检查新主题失败");
          }

          // 继续检查
          if (isAlive) {
            setTimeout(checkNewTopics, 2000); // 每2秒检查一次
          }
        };

        // 延迟开始检查，给历史数据加载一些时间
        setTimeout(checkNewTopics, 1000);

        // 处理连接断开
        request.signal.addEventListener("abort", () => {
          isAlive = false;
          clearInterval(heartbeatInterval);
          controller.close();
        });

        // 处理连接错误
        request.signal.addEventListener("error", () => {
          isAlive = false;
          clearInterval(heartbeatInterval);
          sendSSEMessage("error", null, "连接发生错误");
          controller.close();
        });
      } catch (error) {
        console.error("SSE连接错误:", error);
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "SSE连接失败",
              error: error instanceof Error ? error.message : "未知错误",
              timestamp: Date.now(),
              channel_id: channelId,
            })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
    },
  });
}

// 支持OPTIONS请求用于CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
    },
  });
}

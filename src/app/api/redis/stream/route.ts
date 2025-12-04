import { NextRequest, NextResponse } from "next/server";
import redisService from "@/lib/redis";

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 确保Redis连接
        await redisService.connect();

        const encoder = new TextEncoder();
        let isAlive = true;
        let lastId = "$"; // 从最新消息开始

        // 发送初始连接消息
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "connection",
              message: "SSE连接已建立",
              timestamp: Date.now(),
            })}\n\n`,
          ),
        );

        // 心跳检测，防止连接超时
        const heartbeat = setInterval(() => {
          if (isAlive) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "heartbeat",
                  message: "心跳",
                  timestamp: Date.now(),
                })}\n\n`,
              ),
            );
          }
        }, 30000); // 每30秒发送一次心跳

        // 定期检查Redis流
        const checkStream = async () => {
          try {
            if (!isAlive) return;

            const messages = await redisService.readStream(
              "test_stream",
              10,
              1000,
            );

            if (messages.length > 0) {
              for (const message of messages) {
                const streamData = message[1]; // 消息内容
                if (streamData && streamData.length >= 2) {
                  const messageObj: any = {};

                  // 解析Redis流消息格式
                  for (let i = 0; i < streamData.length; i += 2) {
                    if (i + 1 < streamData.length) {
                      messageObj[streamData[i]] = streamData[i + 1];
                    }
                  }

                  // 更新最后读取的消息ID
                  lastId = message[0];

                  // 发送消息到客户端
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "stream_message",
                        data: messageObj,
                        id: lastId,
                        timestamp: Date.now(),
                      })}\n\n`,
                    ),
                  );
                }
              }
            }
          } catch (error) {
            console.error("检查Redis流时出错:", error);
            if (isAlive) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    message: "读取流数据时出错",
                    error: error instanceof Error ? error.message : "未知错误",
                    timestamp: Date.now(),
                  })}\n\n`,
                ),
              );
            }
          }

          // 如果连接还活着，继续检查
          if (isAlive) {
            setTimeout(checkStream, 1000); // 每秒检查一次
          }
        };

        // 开始检查流
        setTimeout(checkStream, 1000);

        // 处理连接关闭
        request.signal.addEventListener("abort", () => {
          isAlive = false;
          clearInterval(heartbeat);
          controller.close();
        });

        // 监听Redis发布/订阅频道
        try {
          await redisService.subscribe("test_channel", (channel, message) => {
            if (isAlive) {
              try {
                const parsedMessage = JSON.parse(message);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "pubsub_message",
                      data: parsedMessage,
                      channel,
                      timestamp: Date.now(),
                    })}\n\n`,
                  ),
                );
              } catch (parseError) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "pubsub_message",
                      data: message,
                      channel,
                      timestamp: Date.now(),
                    })}\n\n`,
                  ),
                );
              }
            }
          });
        } catch (error) {
          console.error("订阅Redis频道时出错:", error);
        }
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
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import redisService from "@/lib/redis";
import type { StreamResponse, ClearStreamResponse } from "@/types/redis-stream";

// DELETE - 清空整个 Stream
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get("stream");

    if (!stream) {
      return NextResponse.json(
        {
          success: false,
          message: "Stream键名是必需的参数",
        } as StreamResponse,
        { status: 400 },
      );
    }

    // 确保Redis连接
    await redisService.connect();

    // 清空Stream
    const result = await redisService.clearStream(stream);

    // 发布清空通知
    const publishData = JSON.stringify({
      type: "stream_cleared",
      stream,
      result,
      timestamp: Date.now(),
    });
    await redisService.publish("test_channel", publishData);

    const response: ClearStreamResponse = {
      cleared: !result.includes("不存在"),
      stream,
    };

    return NextResponse.json({
      success: true,
      message: result,
      data: response,
    } as StreamResponse<ClearStreamResponse>);
  } catch (error) {
    console.error("清空Stream API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "清空Stream失败",
        error: error instanceof Error ? error.message : "未知错误",
      } as StreamResponse,
      { status: 500 },
    );
  }
}

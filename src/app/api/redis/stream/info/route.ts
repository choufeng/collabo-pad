import { NextRequest, NextResponse } from "next/server";
import redisService from "@/lib/redis";
import type { StreamResponse, StreamInfo } from "@/types/redis-stream";

// GET - 获取 Stream 详细信息
export async function GET(request: NextRequest) {
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

    // 获取Stream信息
    const streamInfo = await redisService.getStreamInfo(stream);

    if (!streamInfo) {
      return NextResponse.json(
        {
          success: false,
          message: "Stream不存在",
        } as StreamResponse,
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "获取Stream信息成功",
      data: streamInfo,
    } as StreamResponse<StreamInfo>);
  } catch (error) {
    console.error("获取Stream信息API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "获取Stream信息失败",
        error: error instanceof Error ? error.message : "未知错误",
      } as StreamResponse,
      { status: 500 },
    );
  }
}

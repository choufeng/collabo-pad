import { NextRequest, NextResponse } from "next/server";
import redisService from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    await redisService.connect();

    return NextResponse.json({
      success: true,
      message: "Redis连接成功",
      connected: redisService.isConnectionActive(),
    });
  } catch (error) {
    console.error("Redis连接API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Redis连接失败",
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const isConnected = redisService.isConnectionActive();

  return NextResponse.json({
    success: true,
    connected: isConnected,
    message: isConnected ? "Redis连接正常" : "Redis未连接",
  });
}

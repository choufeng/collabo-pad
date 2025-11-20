import { NextRequest, NextResponse } from "next/server";
import redisService from "@/lib/redis";

interface TestDataRequest {
  key: string;
  value: string;
  ttl?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestDataRequest = await request.json();
    const { key, value, ttl } = body;

    if (!key || !value) {
      return NextResponse.json(
        {
          success: false,
          message: "key和value是必需的参数",
        },
        { status: 400 },
      );
    }

    // 确保Redis连接
    await redisService.connect();

    // 写入数据
    await redisService.set(key, value, ttl);

    // 同时将数据添加到流中用于SSE测试
    const streamData = {
      key,
      value,
      timestamp: Date.now().toString(),
      type: "test_data",
      ttl: ttl?.toString() || "0",
    };

    await redisService.addToStream("test_stream", streamData);

    // 发布消息到频道
    const publishMessage = JSON.stringify(streamData);
    await redisService.publish("test_channel", publishMessage);

    return NextResponse.json({
      success: true,
      message: "数据写入成功",
      data: {
        key,
        value,
        ttl: ttl || "无过期时间",
      },
    });
  } catch (error) {
    console.error("测试数据写入API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "数据写入失败",
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          message: "需要提供key参数",
        },
        { status: 400 },
      );
    }

    // 确保Redis连接
    await redisService.connect();

    const value = await redisService.get(key);
    const exists = await redisService.exists(key);

    return NextResponse.json({
      success: true,
      exists,
      value,
      key,
    });
  } catch (error) {
    console.error("测试数据读取API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "数据读取失败",
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          message: "需要提供key参数",
        },
        { status: 400 },
      );
    }

    // 确保Redis连接
    await redisService.connect();

    const result = await redisService.del(key);

    return NextResponse.json({
      success: true,
      message: "数据删除成功",
      deleted: result > 0,
      key,
    });
  } catch (error) {
    console.error("测试数据删除API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "数据删除失败",
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}

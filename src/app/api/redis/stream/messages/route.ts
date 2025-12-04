import { NextRequest, NextResponse } from "next/server";
import redisService from "@/lib/redis";
import type {
  StreamResponse,
  AddMessageRequest,
  UpdateMessageRequest,
  DeleteMessageRequest,
  GetMessagesRequest,
  AddMessageResponse,
  UpdateMessageResponse,
  DeleteMessageResponse,
  GetMessagesResponse,
} from "@/types/redis-stream";

// GET - 获取 Stream 消息列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get("stream");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const count = searchParams.get("count");

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

    // 获取消息列表
    const messages = await redisService.getStreamRange(
      stream,
      start || undefined,
      end || undefined,
      count ? parseInt(count, 10) : undefined,
    );

    // 获取总数量
    const total = await redisService.getStreamLength(stream);

    const response: GetMessagesResponse = {
      messages,
      total,
      stream,
    };

    return NextResponse.json({
      success: true,
      message: "获取消息列表成功",
      data: response,
    } as StreamResponse<GetMessagesResponse>);
  } catch (error) {
    console.error("获取Stream消息列表API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "获取消息列表失败",
        error: error instanceof Error ? error.message : "未知错误",
      } as StreamResponse,
      { status: 500 },
    );
  }
}

// POST - 添加新消息到 Stream
export async function POST(request: NextRequest) {
  try {
    const body: AddMessageRequest = await request.json();
    const { stream, data } = body;

    if (!stream || !data) {
      return NextResponse.json(
        {
          success: false,
          message: "Stream键名和消息数据是必需的参数",
        } as StreamResponse,
        { status: 400 },
      );
    }

    if (typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        {
          success: false,
          message: "消息数据必须是一个有效的对象",
        } as StreamResponse,
        { status: 400 },
      );
    }

    // 确保Redis连接
    await redisService.connect();

    // 添加消息到Stream
    const messageId = await redisService.addToStream(stream, data);

    // 发布消息到频道（用于SSE通知）
    const publishData = JSON.stringify({
      type: "stream_message_added",
      stream,
      messageId,
      data,
      timestamp: Date.now(),
    });
    await redisService.publish("test_channel", publishData);

    const response: AddMessageResponse = {
      messageId,
      stream,
    };

    return NextResponse.json({
      success: true,
      message: "添加消息成功",
      data: response,
    } as StreamResponse<AddMessageResponse>);
  } catch (error) {
    console.error("添加Stream消息API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "添加消息失败",
        error: error instanceof Error ? error.message : "未知错误",
      } as StreamResponse,
      { status: 500 },
    );
  }
}

// PUT - 修改 Stream 消息
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get("stream");
    const messageId = searchParams.get("id");

    if (!stream || !messageId) {
      return NextResponse.json(
        {
          success: false,
          message: "Stream键名和消息ID是必需的参数",
        } as StreamResponse,
        { status: 400 },
      );
    }

    const body: UpdateMessageRequest = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "消息数据是必需的参数",
        } as StreamResponse,
        { status: 400 },
      );
    }

    if (typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        {
          success: false,
          message: "消息数据必须是一个有效的对象",
        } as StreamResponse,
        { status: 400 },
      );
    }

    // 确保Redis连接
    await redisService.connect();

    // 修改消息
    const newMessageId = await redisService.updateMessage(
      stream,
      messageId,
      data,
    );

    if (!newMessageId) {
      return NextResponse.json(
        {
          success: false,
          message: "修改消息失败，消息可能不存在",
        } as StreamResponse,
        { status: 404 },
      );
    }

    // 发布修改通知
    const publishData = JSON.stringify({
      type: "stream_message_updated",
      stream,
      messageId,
      newMessageId,
      data,
      timestamp: Date.now(),
    });
    await redisService.publish("test_channel", publishData);

    const response: UpdateMessageResponse = {
      newMessageId,
      stream,
      deletedCount: 1,
    };

    return NextResponse.json({
      success: true,
      message: "修改消息成功",
      data: response,
    } as StreamResponse<UpdateMessageResponse>);
  } catch (error) {
    console.error("修改Stream消息API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "修改消息失败",
        error: error instanceof Error ? error.message : "未知错误",
      } as StreamResponse,
      { status: 500 },
    );
  }
}

// DELETE - 删除 Stream 消息
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get("stream");
    const messageId = searchParams.get("id");

    if (!stream || !messageId) {
      return NextResponse.json(
        {
          success: false,
          message: "Stream键名和消息ID是必需的参数",
        } as StreamResponse,
        { status: 400 },
      );
    }

    // 确保Redis连接
    await redisService.connect();

    // 删除消息
    const deletedCount = await redisService.deleteMessage(stream, messageId);

    // 发布删除通知
    const publishData = JSON.stringify({
      type: "stream_message_deleted",
      stream,
      messageId,
      deletedCount,
      timestamp: Date.now(),
    });
    await redisService.publish("test_channel", publishData);

    const response: DeleteMessageResponse = {
      deletedCount,
      messageId,
      stream,
    };

    return NextResponse.json({
      success: true,
      message: deletedCount > 0 ? "删除消息成功" : "消息不存在或已被删除",
      data: response,
    } as StreamResponse<DeleteMessageResponse>);
  } catch (error) {
    console.error("删除Stream消息API错误:", error);

    return NextResponse.json(
      {
        success: false,
        message: "删除消息失败",
        error: error instanceof Error ? error.message : "未知错误",
      } as StreamResponse,
      { status: 500 },
    );
  }
}

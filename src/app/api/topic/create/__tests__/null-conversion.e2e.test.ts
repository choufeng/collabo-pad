/**
 * 主题创建API空值转换端到端测试
 */

import { NextRequest } from "next/server";
import { POST } from "../route";

// Mock AI service
jest.mock("@/lib/ai-service", () => ({
  aiService: {
    isServiceInitialized: jest.fn().mockReturnValue(true),
    initialize: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn().mockResolvedValue({
      data: { response: "Translated content" },
    }),
  },
}));

// Mock TopicService
jest.mock("@/services/TopicService", () => ({
  topicService: {
    create: jest.fn().mockImplementation((data) => {
      // 返回创建的数据，模拟数据库存储结果
      return Promise.resolve({
        id: "mock-uuid-1234",
        parentId: data.parentId,
        channelId: data.channelId,
        content: data.content,
        translatedContent: data.translatedContent,
        userId: data.userId,
        username: data.username,
        x: data.x,
        y: data.y,
        w: data.w,
        h: data.h,
        metadata: data.metadata,
        tags: data.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
  },
}));

describe("Topic Create API - Null Conversion E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("应该正确转换空字符串为null", async () => {
    const requestBody = {
      channel_id: "test-channel",
      content: "Test content",
      user_id: "user123",
      user_name: "Test User",
      parent_id: "", // 空字符串应该被转换为null
      x: 100,
      y: "", // 空字符串应该被转换为null
      w: undefined, // undefined应该被转换为null
      h: 200,
      metadata: null, // null应该保持为null
      tags: [], // 空数组应该被保留
    };

    const request = new NextRequest("http://localhost:3000/api/topic/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);

    // 验证TopicService.create被调用时的参数
    const { topicService } = require("@/services/TopicService");
    expect(topicService.create).toHaveBeenCalledWith({
      channelId: "test-channel",
      userId: "user123",
      username: "Test User",
      content: "Test content",
      translatedContent: "Translated content",
      parentId: null, // 空字符串被转换为null
      x: "100", // 数字被转换为字符串
      y: null, // 空字符串被转换为null
      w: null, // undefined被转换为null
      h: "200", // 数字被转换为字符串
      metadata: null, // null保持为null
      tags: [], // 空数组被保留
    });

    // 验证响应格式
    expect(responseData.topic).toBeDefined();
    expect(responseData.topic.parent_id).toBeUndefined(); // null在响应中应该转换为undefined
    expect(responseData.topic.x).toBe(100);
    expect(responseData.topic.y).toBeUndefined();
    expect(responseData.topic.w).toBeUndefined();
    expect(responseData.topic.h).toBe(200);
  });

  it("应该正确处理undefined值", async () => {
    const requestBody = {
      channel_id: "test-channel",
      content: "Test content",
      user_id: "user123",
      user_name: "Test User",
      // parent_id 不提供
      x: undefined,
      y: 150,
      w: null,
      h: undefined,
      metadata: undefined,
      tags: undefined,
    };

    const request = new NextRequest("http://localhost:3000/api/topic/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);

    const { topicService } = require("@/services/TopicService");
    expect(topicService.create).toHaveBeenCalledWith({
      channelId: "test-channel",
      userId: "user123",
      username: "Test User",
      content: "Test content",
      translatedContent: "Translated content",
      parentId: null, // 未提供的字段应该为null
      x: null, // undefined被转换为null
      y: "150", // 数字被转换为字符串
      w: null, // null保持为null
      h: null, // undefined被转换为null
      metadata: null, // undefined被转换为null
      tags: null, // undefined被转换为null
    });
  });

  it("应该保留有效的假值", async () => {
    const requestBody = {
      channel_id: "test-channel",
      content: "Test content",
      user_id: "user123",
      user_name: "Test User",
      parent_id: "valid-parent-id",
      x: 0, // 0是有效值
      y: false, // false会被转换为字符串"false"
      metadata: { valid: true }, // 有效对象
      tags: [], // 空数组是有效的
    };

    const request = new NextRequest("http://localhost:3000/api/topic/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);

    const { topicService } = require("@/services/TopicService");
    expect(topicService.create).toHaveBeenCalledWith({
      channelId: "test-channel",
      userId: "user123",
      username: "Test User",
      content: "Test content",
      translatedContent: "Translated content",
      parentId: "valid-parent-id",
      x: "0", // 0被转换为字符串"0"
      y: null, // false在验证步骤会被过滤，因为不是数字
      metadata: { valid: true }, // 对象被保留
      tags: [], // 空数组被保留
      w: null, // 未提供的字段
      h: null, // 未提供的字段
    });
  });

  it("应该处理验证失败的情况", async () => {
    const requestBody = {
      // 缺少必需字段 channel_id
      content: "",
      user_id: "",
      user_name: "",
      // x 不是数字
      x: "invalid-number",
    };

    const request = new NextRequest("http://localhost:3000/api/topic/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBeDefined();

    // TopicService.create不应该被调用
    const { topicService } = require("@/services/TopicService");
    expect(topicService.create).not.toHaveBeenCalled();
  });
});

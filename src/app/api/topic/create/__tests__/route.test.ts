/**
 * @jest-environment node
 */

import { POST } from "../route";

// Mock the topicService
jest.mock("@/services/TopicService", () => ({
  topicService: {
    create: jest.fn(),
  },
}));

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(),
    })),
  },
}));

describe("/api/topic/create API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle the basic structure", async () => {
    // Create a mock request that mimics NextRequest
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        channel_id: "test-channel",
        content: "Test topic",
        user_id: "user-123",
        user_name: "Test User",
      }),
    } as any;

    // Mock the topicService.create method
    const { topicService } = require("@/services/TopicService");
    topicService.create.mockResolvedValue({
      id: "topic-uuid",
      channelId: "test-channel",
      content: "Test topic",
      userId: "user-123",
      username: "Test User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Call the POST function
    const response = await POST(mockRequest);

    // Basic assertions
    expect(response).toBeDefined();
    expect(typeof response.status).toBe("number");
    expect(typeof response.json).toBe("function");

    // Verify topicService.create was called
    expect(topicService.create).toHaveBeenCalledWith({
      channelId: "test-channel",
      userId: "user-123",
      username: "Test User",
      content: "Test topic",
      parentId: null,
      x: undefined,
      y: undefined,
      w: undefined,
      h: undefined,
      metadata: undefined,
      tags: undefined,
    });
  });

  it("should handle missing channel_id", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        content: "Test topic",
        user_id: "user-123",
        user_name: "Test User",
      }),
    } as any;

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe("MISSING_CHANNEL_ID");
  });

  it("should handle missing content", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        channel_id: "test-channel",
        user_id: "user-123",
        user_name: "Test User",
      }),
    } as any;

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe("MISSING_CONTENT");
  });

  it("should handle valid negative coordinates", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        channel_id: "test-channel",
        content: "Test topic",
        user_id: "user-123",
        user_name: "Test User",
        x: -10, // Valid negative coordinate
        y: -20, // Valid negative coordinate
      }),
    } as any;

    // Mock the topicService.create method
    const { topicService } = require("@/services/TopicService");
    topicService.create.mockResolvedValue({
      id: "topic-uuid",
      channelId: "test-channel",
      content: "Test topic",
      userId: "user-123",
      username: "Test User",
      x: "-10",
      y: "-20",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.topic.x).toBe(-10);
    expect(responseData.topic.y).toBe(-20);
  });

  it("should handle invalid coordinates (NaN)", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        channel_id: "test-channel",
        content: "Test topic",
        user_id: "user-123",
        user_name: "Test User",
        x: NaN, // Invalid NaN coordinate
      }),
    } as any;

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe("INVALID_X_COORDINATE");
  });

  it("should handle invalid dimensions", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        channel_id: "test-channel",
        content: "Test topic",
        user_id: "user-123",
        user_name: "Test User",
        w: 0, // Invalid zero width
      }),
    } as any;

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe("INVALID_WIDTH");
  });

  it("should handle JSON parsing errors", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    } as any;

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe("INVALID_JSON");
  });
});

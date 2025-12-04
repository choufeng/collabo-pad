import { jest } from "@jest/globals";
import type {
  CreateTopicRequest,
  CreateTopicResponse,
  Topic,
} from "../../src/types/topic";

// Mock API 响应数据生成器
export const createMockTopic = (overrides: Partial<Topic> = {}): Topic => ({
  id: "test-topic-1",
  channel_id: "test-channel-1",
  content: "Test topic content",
  user_id: "test-user-1",
  user_name: "Test User",
  timestamp: Date.now(),
  ...overrides,
});

export const createMockCreateTopicRequest = (
  overrides: Partial<CreateTopicRequest> = {},
): CreateTopicRequest => ({
  channel_id: "test-channel-1",
  content: "Test topic content",
  user_id: "test-user-1",
  user_name: "Test User",
  ...overrides,
});

export const createMockSuccessResponse = (
  overrides: Partial<CreateTopicResponse> = {},
): CreateTopicResponse => ({
  topic: createMockTopic(),
  messageId: "test-message-1",
  success: true,
  message: "Topic created successfully",
  ...overrides,
});

export const createMockErrorResponse = (
  error: string,
  message: string,
): CreateTopicResponse => ({
  topic: {} as Topic,
  messageId: "",
  success: false,
  message,
  error,
});

// API 调用 Mock 函数
export const mockFetch = jest.fn();

// 设置成功的 API 响应
export const mockSuccessAPIResponse = (topicData?: Topic) => {
  const response = createMockSuccessResponse(
    topicData ? { topic: topicData } : {},
  );
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 201,
    json: async () => response,
  });
};

// 设置失败的 API 响应
export const mockErrorAPIResponse = (
  error: string,
  message: string,
  status = 400,
) => {
  const response = createMockErrorResponse(error, message);
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => response,
  });
};

// 设置网络错误
export const mockNetworkError = (error: Error = new Error("Network error")) => {
  mockFetch.mockRejectedValueOnce(error);
};

// 重置所有 Mock
export const resetAllMocks = () => {
  mockFetch.mockReset();
  jest.clearAllMocks();
};

// 全局 fetch Mock 设置
export const setupGlobalFetchMock = () => {
  global.fetch = mockFetch;
};

// 清理全局 fetch Mock
export const cleanupGlobalFetchMock = () => {
  if (global.fetch === mockFetch) {
    delete global.fetch;
  }
};

// API 调用辅助函数（模拟实际代码中的 API 调用）
export const callCreateTopicAPI = async (
  requestData: CreateTopicRequest,
): Promise<CreateTopicResponse> => {
  const response = await fetch("/api/topic/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "API call failed");
  }

  return response.json();
};

// 验证 API 调用参数
export const expectAPICall = (expectedData: Partial<CreateTopicRequest>) => {
  expect(mockFetch).toHaveBeenCalledWith("/api/topic/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: expect.stringContaining(JSON.stringify(expectedData)),
  });
};

// 常用测试数据
export const TEST_DATA = {
  VALID_TOPIC: {
    channel_id: "test-channel-123",
    content: "这是一个测试主题",
    user_id: "user-123",
    user_name: "测试用户",
  },
  CHILD_TOPIC: {
    parent_id: "parent-topic-123",
    channel_id: "test-channel-123",
    content: "这是一个子主题",
    user_id: "user-123",
    user_name: "测试用户",
  },
  INVALID_TOPIC_NO_CHANNEL: {
    channel_id: "",
    content: "测试内容",
    user_id: "user-123",
    user_name: "测试用户",
  },
  INVALID_TOPIC_NO_CONTENT: {
    channel_id: "test-channel-123",
    content: "",
    user_id: "user-123",
    user_name: "测试用户",
  },
  LONG_CONTENT_TOPIC: {
    channel_id: "test-channel-123",
    content: "a".repeat(1001), // 超过1000字符限制
    user_id: "user-123",
    user_name: "测试用户",
  },
} as const;

// 验证表单提交时的按钮状态
export const expectButtonState = (
  button: HTMLElement,
  disabled: boolean,
  loading: boolean = false,
) => {
  expect(button).toBeDisabled();
  if (loading) {
    expect(button).toHaveTextContent(/loading|creating|saving/i);
  }
};

// 验证错误消息显示
export const expectErrorMessage = (screen: any, message: string) => {
  expect(screen.getByText(message)).toBeInTheDocument();
};

// 验证成功消息显示
export const expectSuccessMessage = (screen: any, message: string) => {
  expect(screen.getByText(message)).toBeInTheDocument();
};

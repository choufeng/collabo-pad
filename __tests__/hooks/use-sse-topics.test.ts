/**
 * useSSETopics Hook 单元测试
 * 测试SSE消息处理，包括新增的 topic_updated 消息类型
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useSSETopics } from "@/hooks/use-sse-topics";
import type { Topic } from "@/types/redis-stream";

// Mock fetch 全局
global.fetch = jest.fn();

// Mock EventSource
class MockEventSource {
  url: string;
  events: { [key: string]: ((event: MessageEvent) => void)[] } = {};
  readyState: number = 0;
  CONNECTING: number = 0;
  OPEN: number = 1;
  CLOSED: number = 2;

  constructor(url: string) {
    this.url = url;
    this.readyState = this.OPEN;
    // 模拟连接建立
    setTimeout(() => {
      this.onopen?.(new Event("open"));
    }, 10);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.events[type]) {
      this.events[type] = [];
    }
    this.events[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (this.events[type]) {
      this.events[type] = this.events[type].filter((l) => l !== listener);
    }
  }

  onopen?: (event: Event) => void;
  onmessage?: (event: MessageEvent) => void;
  onerror?: (event: Event) => void;

  close() {
    this.readyState = this.CLOSED;
  }

  // 测试辅助方法：模拟收到消息
  simulateMessage(data: any) {
    const messageEvent = new MessageEvent("message", {
      data: JSON.stringify(data),
    });

    if (this.onmessage) {
      this.onmessage(messageEvent);
    }

    // 触发所有message事件监听器
    if (this.events["message"]) {
      this.events["message"].forEach((listener) => listener(messageEvent));
    }
  }

  // 测试辅助方法：模拟错误
  simulateError() {
    const errorEvent = new Event("error");
    if (this.onerror) {
      this.onerror(errorEvent);
    }
  }
}

// 替换全局 EventSource
global.EventSource = MockEventSource as any;

describe("useSSETopics", () => {
  const mockChannelId = "test-channel";
  const mockTopic: Topic = {
    id: "topic-1",
    channel_id: mockChannelId,
    content: "Test topic",
    user_id: "user-1",
    user_name: "testuser",
    timestamp: Date.now(),
    x: 100,
    y: 200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("基础功能", () => {
    it("应该初始化为断开连接状态", () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      expect(result.current.connectionStatus).toBe("disconnected");
      expect(result.current.topics).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("应该自动连接到指定频道", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });
    });
  });

  describe("消息处理", () => {
    it("应该处理 topic_created 消息", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 模拟收到 topic_created 消息
      const messageData = {
        type: "topic_created",
        data: mockTopic,
        timestamp: Date.now(),
        channel_id: mockChannelId,
      };

      act(() => {
        // 获取 EventSource 实例并发送消息
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(messageData);
      });

      expect(result.current.topics).toContainEqual(mockTopic);
      expect(result.current.messages).toHaveLength(1);
    });

    it("应该处理 history_data 消息", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 模拟收到 history_data 消息
      const historyTopics = [mockTopic, { ...mockTopic, id: "topic-2" }];
      const messageData = {
        type: "history_data",
        data: { topics: historyTopics },
        timestamp: Date.now(),
        channel_id: mockChannelId,
      };

      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(messageData);
      });

      expect(result.current.topics).toEqual(historyTopics);
    });

    it("应该处理 topic_updated 消息", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 首先添加一个初始主题
      const initialMessageData = {
        type: "topic_created",
        data: mockTopic,
        timestamp: Date.now(),
        channel_id: mockChannelId,
      };

      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(initialMessageData);
      });

      expect(result.current.topics).toHaveLength(1);
      expect(result.current.topics[0]).toEqual(mockTopic);

      // 然后模拟更新主题（位置变更）
      const updatedTopic = {
        ...mockTopic,
        x: 300,
        y: 400,
        timestamp: Date.now() + 1000,
      };

      const updateMessageData = {
        type: "topic_updated",
        data: updatedTopic,
        timestamp: Date.now() + 1000,
        channel_id: mockChannelId,
      };

      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(updateMessageData);
      });

      // 验证主题被更新而不是添加新主题
      expect(result.current.topics).toHaveLength(1);
      expect(result.current.topics[0].x).toBe(300);
      expect(result.current.topics[0].y).toBe(400);
      expect(result.current.messages).toHaveLength(2); // 创建 + 更新
    });

    it("应该忽略未知ID的topic_updated消息", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 模拟收到未知主题的更新消息
      const unknownTopicUpdate = {
        type: "topic_updated",
        data: { ...mockTopic, id: "unknown-topic" },
        timestamp: Date.now(),
        channel_id: mockChannelId,
      };

      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(unknownTopicUpdate);
      });

      // 主题列表应该保持为空
      expect(result.current.topics).toEqual([]);
      // 但消息应该被记录
      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe("错误处理", () => {
    it("应该处理连接错误", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 模拟连接错误
      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateError();
      });

      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.error).toBeTruthy();
    });

    it("应该处理SSE错误消息", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 模拟收到错误消息
      const errorMessageData = {
        type: "error",
        message: "Test error message",
        timestamp: Date.now(),
        channel_id: mockChannelId,
      };

      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(errorMessageData);
      });

      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.error).toBe("Test error message");
    });
  });

  describe("心跳机制", () => {
    it("应该处理心跳消息", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 模拟收到心跳消息
      const heartbeatMessageData = {
        type: "heartbeat",
        timestamp: Date.now(),
        channel_id: mockChannelId,
      };

      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(heartbeatMessageData);
      });

      // 连接状态应该保持为 connected
      expect(result.current.connectionStatus).toBe("connected");
    });
  });

  describe("手动控制", () => {
    it("应该支持手动连接和断开", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 初始状态应该自动连接
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 手动断开
      act(() => {
        result.current.disconnect();
      });

      expect(result.current.connectionStatus).toBe("disconnected");

      // 手动重新连接
      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });
    });

    it("应该支持清空主题列表", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 添加一些主题
      const messageData = {
        type: "topic_created",
        data: mockTopic,
        timestamp: Date.now(),
        channel_id: mockChannelId,
      };

      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(messageData);
      });

      expect(result.current.topics).toHaveLength(1);

      // 清空主题
      act(() => {
        result.current.clearTopics();
      });

      expect(result.current.topics).toEqual([]);
    });

    it("应该支持清除错误状态", async () => {
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 模拟错误
      const errorMessageData = {
        type: "error",
        message: "Test error",
        timestamp: Date.now(),
        channel_id: mockChannelId,
      };

      act(() => {
        const eventSourceInstances = (global.EventSource as any).mock.instances;
        const lastInstance =
          eventSourceInstances[eventSourceInstances.length - 1];
        lastInstance.simulateMessage(errorMessageData);
      });

      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.error).toBe("Test error");

      // 清除错误状态
      act(() => {
        result.current.clearError();
      });

      expect(result.current.connectionStatus).toBe("disconnected");
      expect(result.current.error).toBeNull();
    });
  });

  describe("maxTopics 限制", () => {
    it("应该限制最大主题数量", async () => {
      const maxTopics = 2;
      const { result } = renderHook(() =>
        useSSETopics({ channelId: mockChannelId, maxTopics }),
      );

      // 等待连接建立
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe("connected");
      });

      // 添加超过限制的主题
      for (let i = 0; i < maxTopics + 2; i++) {
        const messageData = {
          type: "topic_created",
          data: { ...mockTopic, id: `topic-${i}` },
          timestamp: Date.now() + i,
          channel_id: mockChannelId,
        };

        act(() => {
          const eventSourceInstances = (global.EventSource as any).mock
            .instances;
          const lastInstance =
            eventSourceInstances[eventSourceInstances.length - 1];
          lastInstance.simulateMessage(messageData);
        });
      }

      // 应该只保留最新的 maxTopics 个主题
      expect(result.current.topics).toHaveLength(maxTopics);
      expect(result.current.topics[0].id).toBe("topic-3"); // 最新的
      expect(result.current.topics[1].id).toBe("topic-2"); // 第二新的
    });
  });
});

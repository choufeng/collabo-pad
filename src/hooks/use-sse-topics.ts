/**
 * SSE 主题数据流管理 Hook
 * 提供实时主题数据连接和状态管理
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { Topic, SSEMessage } from "@/types/redis-stream";

export interface UseSSETopicsOptions {
  channelId: string;
  maxTopics?: number;
  reconnectInterval?: number;
  heartbeatTimeout?: number;
}

export interface UseSSETopicsReturn {
  topics: Topic[];
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  error: string | null;
  messages: SSEMessage[];
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  clearTopics: () => void;
  clearError: () => void;
}

export function useSSETopics({
  channelId,
  maxTopics = 100,
  reconnectInterval = 3000,
  heartbeatTimeout = 35000,
}: UseSSETopicsOptions): UseSSETopicsReturn {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<SSEMessage[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);

  // 清理资源
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // 处理 SSE 消息
  const handleSSEMessage = useCallback(
    (sseMessage: SSEMessage) => {
      setMessages((prev) => [...prev.slice(-50), sseMessage]); // 保留最近50条消息

      switch (sseMessage.type) {
        case "topic_created":
          if (sseMessage.data) {
            setTopics((prev) => {
              const newTopics = [sseMessage.data, ...prev];
              return newTopics.slice(0, maxTopics);
            });
          }
          break;
        case "history_data":
          if (sseMessage.data?.topics) {
            setTopics(sseMessage.data.topics);
          }
          break;
        case "heartbeat":
          lastHeartbeatRef.current = Date.now();
          // 重置心跳超时
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
          }
          heartbeatTimeoutRef.current = setTimeout(() => {
            console.warn("心跳超时，触发重连");
            cleanup();
            setConnectionStatus("error");
            setError("心跳超时");
            // 自动重连
            setTimeout(() => {
              connect();
            }, reconnectInterval);
          }, heartbeatTimeout);
          break;
        case "error":
          setError(sseMessage.message || "发生未知错误");
          setConnectionStatus("error");
          break;
      }
    },
    [maxTopics, heartbeatTimeout, reconnectInterval, cleanup],
  );

  // 连接到 SSE
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus("connecting");
    setError(null);

    if (!channelId?.trim()) {
      setError("频道ID不能为空");
      setConnectionStatus("error");
      return;
    }

    const sseUrl = `/api/sse/channel/${encodeURIComponent(channelId.trim())}`;

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus("connected");
        lastHeartbeatRef.current = Date.now();
      };

      eventSource.onmessage = (event) => {
        try {
          const sseMessage: SSEMessage = JSON.parse(event.data);
          handleSSEMessage(sseMessage);
        } catch (err) {
          console.error("解析SSE消息失败:", err);
          setError("解析SSE消息失败");
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE连接错误:", error);
        setConnectionStatus("error");
        setError("SSE连接失败");
        cleanup();

        // 自动重连逻辑（仅在非主动断开时）
        if (eventSource.readyState !== EventSource.CLOSED) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      console.error("创建SSE连接失败:", err);
      setConnectionStatus("error");
      setError("无法创建SSE连接");
    }
  }, [channelId, handleSSEMessage, reconnectInterval, cleanup]);

  // 断开连接
  const disconnect = useCallback(() => {
    cleanup();
    setConnectionStatus("disconnected");
    setError(null);
  }, [cleanup]);

  // 重连
  const reconnect = useCallback(() => {
    cleanup();
    setTimeout(() => {
      connect();
    }, 100);
  }, [cleanup, connect]);

  // 清空主题
  const clearTopics = useCallback(() => {
    setTopics([]);
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
    if (connectionStatus === "error") {
      setConnectionStatus("disconnected");
    }
  }, [connectionStatus]);

  // 组件卸载时清理连接
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // 频道ID变化时重新连接
  useEffect(() => {
    if (channelId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      cleanup();
    };
  }, [channelId, connect, disconnect, cleanup]);

  return {
    topics,
    connectionStatus,
    error,
    messages,
    connect,
    disconnect,
    reconnect,
    clearTopics,
    clearError,
  };
}

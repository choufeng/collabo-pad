"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Topic, SSEMessage } from "@/types/topic";

export default function TopicTestPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState("test-channel");

  // 表单状态
  const [formData, setFormData] = useState({
    parent_id: "",
    channel_id: "test-channel",
    content: "",
    user_id: "user-123",
    user_name: "测试用户",
    tags: ["测试", "演示"],
  });

  // 加载状态
  const [isCreating, setIsCreating] = useState(false);

  // 错误状态
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 连接到SSE
  const connectToSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus("connecting");
    setError(null);

    const channelId = formData.channel_id.trim();
    if (!channelId) {
      setError("请输入频道ID");
      return;
    }

    const sseUrl = `/api/sse/channel/${encodeURIComponent(channelId)}`;

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus("connected");
        setCurrentChannelId(channelId);
      };

      eventSource.onmessage = (event) => {
        try {
          const sseMessage: SSEMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev.slice(-50), sseMessage]); // 只保留最近50条消息

          // 处理不同类型的消息
          switch (sseMessage.type) {
            case "topic_created":
              if (sseMessage.data && "content" in sseMessage.data) {
                setTopics((prev) => {
                  const newTopics = [sseMessage.data as Topic, ...prev];
                  return newTopics.slice(0, 100); // 只保留最新100个主题
                });
              }
              break;
            case "history_data":
              if (sseMessage.data && "topics" in sseMessage.data) {
                setTopics((sseMessage.data as { topics: Topic[] }).topics);
              }
              break;
            case "error":
              setError(sseMessage.message || "发生未知错误");
              break;
          }
        } catch (err) {
          console.error("解析SSE消息失败:", err);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE连接错误:", error);
        setConnectionStatus("disconnected");
        setError("SSE连接失败");
        eventSource.close();
        eventSourceRef.current = null;
      };
    } catch (err) {
      console.error("创建SSE连接失败:", err);
      setConnectionStatus("disconnected");
      setError("无法创建SSE连接");
    }
  };

  // 断开SSE连接
  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnectionStatus("disconnected");
  };

  // 组件卸载时清理连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 创建主题
  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/topic/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          channel_id: formData.channel_id.trim(),
          content: formData.content.trim(),
          parent_id: formData.parent_id.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 清空表单内容
        setFormData((prev) => ({
          ...prev,
          content: "",
          parent_id: "",
        }));
      } else {
        setError(result.message || "创建主题失败");
      }
    } catch (err) {
      console.error("创建主题失败:", err);
      setError("网络错误，请检查连接");
    } finally {
      setIsCreating(false);
    }
  };

  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  // 清空消息
  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          主题管理测试页面
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：创建主题表单和主题列表 */}
          <div className="space-y-6">
            {/* 连接控制 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">SSE 连接</h2>
              <div className="flex items-center space-x-4">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    connectionStatus === "connected"
                      ? "bg-green-100 text-green-800"
                      : connectionStatus === "connecting"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {connectionStatus === "connected"
                    ? "已连接"
                    : connectionStatus === "connecting"
                      ? "连接中..."
                      : "未连接"}
                </div>
                {connectionStatus === "connected" && (
                  <span className="text-sm text-gray-600">
                    频道: {currentChannelId}
                  </span>
                )}
                <button
                  onClick={connectToSSE}
                  disabled={connectionStatus === "connecting"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {connectionStatus === "disconnected" ? "连接" : "重新连接"}
                </button>
                {connectionStatus === "connected" && (
                  <button
                    onClick={disconnectSSE}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    断开
                  </button>
                )}
              </div>
            </div>

            {/* 创建主题表单 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">创建新主题</h2>
              <form onSubmit={createTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    频道ID
                  </label>
                  <input
                    type="text"
                    value={formData.channel_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        channel_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="test-channel"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    父主题ID (可选)
                  </label>
                  <input
                    type="text"
                    value={formData.parent_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parent_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="留空表示根主题"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    主题内容
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="请输入主题内容..."
                    required
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.content.length}/1000 字符
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      用户ID
                    </label>
                    <input
                      type="text"
                      value={formData.user_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          user_id: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={formData.user_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          user_name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标签 (逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(", ")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="测试, 演示"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? "创建中..." : "创建主题"}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* 主题列表 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  主题列表 ({topics.length})
                </h2>
                <button
                  onClick={() => setTopics([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空列表
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {topics.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无主题</p>
                ) : (
                  topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {topic.content}
                          </h3>
                          {topic.parent_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              父主题: {topic.parent_id}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatTime(topic.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {topic.user_name}
                          </span>
                          {topic.tags && topic.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {topic.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {topic.id}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 右侧：SSE消息日志 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                SSE 消息日志 ({messages.length})
              </h2>
              <button
                onClick={clearMessages}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                清空日志
              </button>
            </div>
            <div className="space-y-2 max-h-screen overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">等待SSE消息...</p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      message.type === "error"
                        ? "bg-red-50 border border-red-200"
                        : message.type === "topic_created"
                          ? "bg-green-50 border border-green-200"
                          : message.type === "connection"
                            ? "bg-blue-50 border border-blue-200"
                            : message.type === "history_data"
                              ? "bg-purple-50 border border-purple-200"
                              : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium capitalize">
                        {message.type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    {message.message && (
                      <p className="text-gray-700 mb-1">{message.message}</p>
                    )}
                    {message.data && (
                      <pre className="text-xs text-gray-600 overflow-x-auto bg-white p-2 rounded border">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

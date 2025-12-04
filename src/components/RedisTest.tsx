"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { StreamMessage, StreamInfo } from "@/types/redis-stream";

interface Message {
  type: string;
  data?: any;
  message?: string;
  timestamp: number;
  id?: string;
  channel?: string;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: number;
}

export default function RedisTestComponent() {
  // 连接状态
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");

  // Stream 相关状态
  const [streamKey, setStreamKey] = useState("test_stream");
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<StreamMessage | null>(
    null,
  );

  // 表单数据
  const [messageData, setMessageData] = useState<Record<string, string>>({
    message: "",
    type: "test",
    source: "ui",
  });

  // UI 状态
  const [isSSEConnected, setIsSSEConnected] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"stream" | "keyvalue">("stream");

  // 测试结果和历史
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [sseMessages, setSseMessages] = useState<Message[]>([]);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);

  // 测试Redis连接
  const testConnection = useCallback(async () => {
    setConnectionStatus("connecting");
    try {
      const response = await fetch("/api/redis/connect", {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        setConnectionStatus("connected");
        addTestResult({
          success: true,
          message: "Redis连接测试成功",
          data: result,
          timestamp: Date.now(),
        });
      } else {
        setConnectionStatus("error");
        addTestResult({
          success: false,
          message: "Redis连接测试失败",
          data: result,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      setConnectionStatus("error");
      addTestResult({
        success: false,
        message: "Redis连接测试失败",
        data: error instanceof Error ? error.message : "未知错误",
        timestamp: Date.now(),
      });
    }
  }, []);

  // 检查连接状态
  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/redis/connect");
      const result = await response.json();
      setConnectionStatus(result.connected ? "connected" : "disconnected");
    } catch (error) {
      setConnectionStatus("disconnected");
    }
  }, []);

  // 获取 Stream 信息
  const getStreamInfo = useCallback(async () => {
    if (!streamKey) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/redis/stream/info?stream=${encodeURIComponent(streamKey)}`,
      );
      const result = await response.json();

      if (result.success) {
        setStreamInfo(result.data);
        addTestResult({
          success: true,
          message: "获取Stream信息成功",
          data: result.data,
          timestamp: Date.now(),
        });
      } else {
        setStreamInfo(null);
        addTestResult({
          success: false,
          message: "获取Stream信息失败",
          data: result,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      setStreamInfo(null);
      addTestResult({
        success: false,
        message: "获取Stream信息失败",
        data: error instanceof Error ? error.message : "未知错误",
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, [streamKey]);

  // 获取 Stream 消息列表
  const getStreamMessages = useCallback(async () => {
    if (!streamKey) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/redis/stream/messages?stream=${encodeURIComponent(streamKey)}&count=50`,
      );
      const result = await response.json();

      if (result.success) {
        setMessages(result.data.messages);
        addTestResult({
          success: true,
          message: `获取到 ${result.data.messages.length} 条消息`,
          data: result.data,
          timestamp: Date.now(),
        });
      } else {
        setMessages([]);
        addTestResult({
          success: false,
          message: "获取消息列表失败",
          data: result,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      setMessages([]);
      addTestResult({
        success: false,
        message: "获取消息列表失败",
        data: error instanceof Error ? error.message : "未知错误",
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, [streamKey]);

  // 添加消息到 Stream
  const addStreamMessage = useCallback(async () => {
    if (!streamKey || !messageData.message) {
      addTestResult({
        success: false,
        message: "Stream键名和消息内容是必需的",
        timestamp: Date.now(),
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/redis/stream/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stream: streamKey,
          data: {
            ...messageData,
            timestamp: Date.now().toString(),
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        addTestResult({
          success: true,
          message: "添加消息成功",
          data: result.data,
          timestamp: Date.now(),
        });
        // 刷新消息列表和Stream信息
        await getStreamMessages();
        await getStreamInfo();
        // 清空表单
        setMessageData({
          message: "",
          type: "test",
          source: "ui",
        });
      } else {
        addTestResult({
          success: false,
          message: "添加消息失败",
          data: result,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      addTestResult({
        success: false,
        message: "添加消息失败",
        data: error instanceof Error ? error.message : "未知错误",
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, [streamKey, messageData, getStreamMessages, getStreamInfo]);

  // 删除 Stream 消息
  const deleteStreamMessage = useCallback(
    async (messageId: string) => {
      if (!streamKey || !messageId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/redis/stream/messages?stream=${encodeURIComponent(streamKey)}&id=${encodeURIComponent(messageId)}`,
          {
            method: "DELETE",
          },
        );

        const result = await response.json();

        if (result.success) {
          addTestResult({
            success: true,
            message: "删除消息成功",
            data: result.data,
            timestamp: Date.now(),
          });
          // 刷新消息列表和Stream信息
          await getStreamMessages();
          await getStreamInfo();
          setSelectedMessage(null);
        } else {
          addTestResult({
            success: false,
            message: "删除消息失败",
            data: result,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        addTestResult({
          success: false,
          message: "删除消息失败",
          data: error instanceof Error ? error.message : "未知错误",
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [streamKey, getStreamMessages, getStreamInfo],
  );

  // 编辑 Stream 消息
  const editStreamMessage = useCallback(async () => {
    if (!streamKey || !selectedMessage?.id || !messageData.message) {
      addTestResult({
        success: false,
        message: "Stream键名、消息ID和新内容是必需的",
        timestamp: Date.now(),
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/redis/stream/messages?stream=${encodeURIComponent(streamKey)}&id=${encodeURIComponent(selectedMessage.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stream: streamKey,
            messageId: selectedMessage.id,
            data: {
              ...messageData,
              timestamp: Date.now().toString(),
              edited: "true",
            },
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        addTestResult({
          success: true,
          message: "修改消息成功",
          data: result.data,
          timestamp: Date.now(),
        });
        // 刷新消息列表和Stream信息
        await getStreamMessages();
        await getStreamInfo();
        setEditMode(false);
        setSelectedMessage(null);
        // 清空表单
        setMessageData({
          message: "",
          type: "test",
          source: "ui",
        });
      } else {
        addTestResult({
          success: false,
          message: "修改消息失败",
          data: result,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      addTestResult({
        success: false,
        message: "修改消息失败",
        data: error instanceof Error ? error.message : "未知错误",
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, [
    streamKey,
    selectedMessage,
    messageData,
    getStreamMessages,
    getStreamInfo,
  ]);

  // 清空 Stream
  const clearStream = useCallback(async () => {
    if (!streamKey) return;

    const confirmClear = window.confirm(
      `确定要清空 Stream "${streamKey}" 吗？此操作不可恢复。`,
    );
    if (!confirmClear) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/redis/stream/clear?stream=${encodeURIComponent(streamKey)}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (result.success) {
        addTestResult({
          success: true,
          message: "清空Stream成功",
          data: result.data,
          timestamp: Date.now(),
        });
        // 刷新Stream信息
        await getStreamInfo();
        setMessages([]);
      } else {
        addTestResult({
          success: false,
          message: "清空Stream失败",
          data: result,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      addTestResult({
        success: false,
        message: "清空Stream失败",
        data: error instanceof Error ? error.message : "未知错误",
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, [streamKey, getStreamInfo]);

  // 连接SSE
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/redis/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsSSEConnected(true);
      addTestResult({
        success: true,
        message: "SSE连接已建立",
        timestamp: Date.now(),
      });
    };

    eventSource.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        setSseMessages((prev) => [...prev.slice(-49), message]); // 保留最新50条消息
      } catch (error) {
        console.error("解析SSE消息失败:", error);
      }
    };

    eventSource.onerror = (error) => {
      setIsSSEConnected(false);
      addTestResult({
        success: false,
        message: "SSE连接错误",
        data: error,
        timestamp: Date.now(),
      });
    };
  }, []);

  // 断开SSE连接
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsSSEConnected(false);
      addTestResult({
        success: true,
        message: "SSE连接已断开",
        timestamp: Date.now(),
      });
    }
  }, []);

  // 选择消息进行编辑
  const selectMessageForEdit = useCallback((message: StreamMessage) => {
    setSelectedMessage(message);
    setEditMode(true);
    setMessageData({
      message: message.data.message || "",
      type: message.data.type || "test",
      source: message.data.source || "ui",
    });
  }, []);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setSelectedMessage(null);
    setMessageData({
      message: "",
      type: "test",
      source: "ui",
    });
  }, []);

  // 添加测试结果
  const addTestResult = useCallback((result: TestResult) => {
    setTestResults((prev) => [...prev.slice(-19), result]); // 保留最新20条结果
  }, []);

  // 清空测试结果
  const clearTestResults = useCallback(() => {
    setTestResults([]);
  }, []);

  // 清空SSE消息
  const clearSseMessages = useCallback(() => {
    setSseMessages([]);
  }, []);

  // 格式化时间戳
  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("zh-CN");
  }, []);

  // 获取消息颜色
  const getMessageColor = useCallback((type: string) => {
    switch (type) {
      case "connection":
        return "text-green-600";
      case "heartbeat":
        return "text-blue-500";
      case "stream_message":
      case "stream_message_added":
        return "text-purple-600";
      case "pubsub_message":
        return "text-orange-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  }, []);

  // 获取连接状态颜色和文本
  const getConnectionStatusInfo = useCallback(() => {
    switch (connectionStatus) {
      case "connected":
        return { color: "text-green-600 bg-green-100", text: "已连接" };
      case "connecting":
        return { color: "text-yellow-600 bg-yellow-100", text: "连接中..." };
      case "error":
        return { color: "text-red-600 bg-red-100", text: "连接错误" };
      default:
        return { color: "text-gray-600 bg-gray-100", text: "未连接" };
    }
  }, [connectionStatus]);

  const statusInfo = getConnectionStatusInfo();

  // 当streamKey改变时，刷新Stream信息和消息列表
  useEffect(() => {
    if (streamKey && connectionStatus === "connected") {
      getStreamInfo();
      getStreamMessages();
    }
  }, [streamKey, connectionStatus, getStreamInfo, getStreamMessages]);

  useEffect(() => {
    checkConnectionStatus();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [checkConnectionStatus]);

  return (
    <div className="space-y-6">
      {/* 连接状态 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Redis连接状态</h2>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
          >
            {statusInfo.text}
          </span>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={testConnection}
            disabled={connectionStatus === "connecting"}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            测试连接
          </button>
          <button
            onClick={checkConnectionStatus}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            刷新状态
          </button>
        </div>
      </div>

      {/* 功能标签页 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab("stream")}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === "stream"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Stream 操作
          </button>
          <button
            onClick={() => setActiveTab("keyvalue")}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === "keyvalue"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Key-Value 操作 (传统)
          </button>
        </div>

        {activeTab === "stream" && (
          <div className="space-y-4">
            {/* Stream 配置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream 键名
                </label>
                <input
                  type="text"
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入Stream键名"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={getStreamInfo}
                  disabled={loading || !streamKey}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  获取信息
                </button>
                <button
                  onClick={getStreamMessages}
                  disabled={loading || !streamKey}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  刷新消息
                </button>
                <button
                  onClick={clearStream}
                  disabled={loading || !streamKey}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  清空Stream
                </button>
              </div>
            </div>

            {/* Stream 信息显示 */}
            {streamInfo && (
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Stream 信息
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">消息数量:</span>
                    <span className="ml-2 font-medium">
                      {streamInfo.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">最后生成ID:</span>
                    <span className="ml-2 font-medium">
                      {streamInfo.lastGeneratedId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">消费者组:</span>
                    <span className="ml-2 font-medium">
                      {streamInfo.groups}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Radix树键:</span>
                    <span className="ml-2 font-medium">
                      {streamInfo.radixTreeKeys}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 消息添加/编辑表单 */}
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                {editMode ? "编辑消息" : "添加消息"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    消息内容
                  </label>
                  <input
                    type="text"
                    value={messageData.message}
                    onChange={(e) =>
                      setMessageData({
                        ...messageData,
                        message: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入消息内容"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    消息类型
                  </label>
                  <input
                    type="text"
                    value={messageData.type}
                    onChange={(e) =>
                      setMessageData({ ...messageData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="消息类型"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                {editMode ? (
                  <>
                    <button
                      onClick={editStreamMessage}
                      disabled={loading || !messageData.message}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      保存修改
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      取消编辑
                    </button>
                  </>
                ) : (
                  <button
                    onClick={addStreamMessage}
                    disabled={loading || !messageData.message}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    添加消息
                  </button>
                )}
              </div>
            </div>

            {/* 消息列表 */}
            {messages.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold text-gray-900 mb-3">消息列表</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="border border-gray-200 rounded-md p-3 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-gray-900">
                          ID: {message.id}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => selectMessageForEdit(message)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => deleteStreamMessage(message.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(message.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "keyvalue" && (
          <div className="text-gray-600">
            <p>
              Key-Value
              操作功能已移至次要位置。如需使用此功能，请参考原有实现或考虑使用
              Stream 模式。
            </p>
          </div>
        )}
      </div>

      {/* SSE流 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">SSE实时流</h2>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isSSEConnected
                ? "text-green-600 bg-green-100"
                : "text-gray-600 bg-gray-100"
            }`}
          >
            {isSSEConnected ? "已连接" : "未连接"}
          </span>
        </div>
        <div className="flex gap-3 mb-4">
          <button
            onClick={connectSSE}
            disabled={isSSEConnected}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            连接SSE
          </button>
          <button
            onClick={disconnectSSE}
            disabled={!isSSEConnected}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            断开SSE
          </button>
          <button
            onClick={clearSseMessages}
            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
          >
            清空消息
          </button>
        </div>
        <div className="bg-white border border-gray-300 rounded-md h-64 overflow-y-auto p-3">
          {sseMessages.length === 0 ? (
            <p className="text-gray-500 text-center">暂无消息</p>
          ) : (
            <div className="space-y-2">
              {sseMessages.map((message, index) => (
                <div
                  key={index}
                  className="text-sm border-b border-gray-200 pb-2"
                >
                  <span
                    className={`font-medium ${getMessageColor(message.type)}`}
                  >
                    [{message.type}]
                  </span>
                  <span className="text-gray-500 ml-2">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.message && (
                    <p className="text-gray-700 mt-1">{message.message}</p>
                  )}
                  {message.data && (
                    <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-1 rounded overflow-x-auto">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 测试结果 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">测试结果</h2>
          <button
            onClick={clearTestResults}
            className="px-3 py-1 bg-gray-400 text-white text-sm rounded-md hover:bg-gray-500"
          >
            清空结果
          </button>
        </div>
        <div className="bg-white border border-gray-300 rounded-md h-48 overflow-y-auto p-3">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center">暂无测试结果</p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="text-sm border-b border-gray-200 pb-2"
                >
                  <span
                    className={`font-medium ${
                      result.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {result.success ? "✓" : "✗"} {formatTime(result.timestamp)}
                  </span>
                  <p className="text-gray-700 mt-1">{result.message}</p>
                  {result.data && (
                    <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-1 rounded overflow-x-auto">
                      {typeof result.data === "string"
                        ? result.data
                        : JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [testKey, setTestKey] = useState("test-key");
  const [testValue, setTestValue] = useState("test-value");
  const [testTTL, setTestTTL] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isSSEConnected, setIsSSEConnected] = useState(false);
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

  // 写入测试数据
  const writeTestData = useCallback(async () => {
    try {
      const payload: any = { key: testKey, value: testValue };
      if (testTTL) {
        payload.ttl = parseInt(testTTL, 10);
      }

      const response = await fetch("/api/redis/test-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      addTestResult({
        success: result.success,
        message: result.success ? "数据写入成功" : "数据写入失败",
        data: result,
        timestamp: Date.now(),
      });
    } catch (error) {
      addTestResult({
        success: false,
        message: "数据写入失败",
        data: error instanceof Error ? error.message : "未知错误",
        timestamp: Date.now(),
      });
    }
  }, [testKey, testValue, testTTL]);

  // 读取测试数据
  const readTestData = useCallback(
    async (key?: string) => {
      try {
        const searchKey = key || testKey;
        const response = await fetch(
          `/api/redis/test-data?key=${encodeURIComponent(searchKey)}`,
        );
        const result = await response.json();

        addTestResult({
          success: result.success,
          message: result.success ? "数据读取成功" : "数据读取失败",
          data: result,
          timestamp: Date.now(),
        });
      } catch (error) {
        addTestResult({
          success: false,
          message: "数据读取失败",
          data: error instanceof Error ? error.message : "未知错误",
          timestamp: Date.now(),
        });
      }
    },
    [testKey],
  );

  // 删除测试数据
  const deleteTestData = useCallback(
    async (key?: string) => {
      try {
        const searchKey = key || testKey;
        const response = await fetch(
          `/api/redis/test-data?key=${encodeURIComponent(searchKey)}`,
          {
            method: "DELETE",
          },
        );
        const result = await response.json();

        addTestResult({
          success: result.success,
          message: result.success ? "数据删除成功" : "数据删除失败",
          data: result,
          timestamp: Date.now(),
        });
      } catch (error) {
        addTestResult({
          success: false,
          message: "数据删除失败",
          data: error instanceof Error ? error.message : "未知错误",
          timestamp: Date.now(),
        });
      }
    },
    [testKey],
  );

  // 连接SSE流
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
        setMessages((prev) => [...prev.slice(-49), message]); // 保留最新50条消息
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

    return () => {
      eventSource.close();
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

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 清空测试结果
  const clearTestResults = useCallback(() => {
    setTestResults([]);
  }, []);

  // 添加测试结果
  const addTestResult = useCallback((result: TestResult) => {
    setTestResults((prev) => [...prev.slice(-19), result]); // 保留最新20条结果
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

      {/* 数据操作 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          数据操作测试
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key
            </label>
            <input
              type="text"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入测试key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value
            </label>
            <input
              type="text"
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入测试value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TTL (秒，可选)
            </label>
            <input
              type="text"
              value={testTTL}
              onChange={(e) => setTestTTL(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="过期时间，留空为永不过期"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={writeTestData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            写入数据
          </button>
          <button
            onClick={() => readTestData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            读取数据
          </button>
          <button
            onClick={() => deleteTestData()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            删除数据
          </button>
        </div>
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
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            连接SSE
          </button>
          <button
            onClick={disconnectSSE}
            disabled={!isSSEConnected}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            断开SSE
          </button>
          <button
            onClick={clearMessages}
            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
          >
            清空消息
          </button>
        </div>
        <div className="bg-white border border-gray-300 rounded-md h-64 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">暂无消息</p>
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => (
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

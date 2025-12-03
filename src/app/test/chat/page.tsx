"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  content: string;
  type: "user" | "ai";
  timestamp: Date;
  error?: string;
}

interface AIResponse {
  success: boolean;
  data?: {
    response: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
}

export default function ChatTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "你是一个有用的AI助手。请用简洁的语言回答问题。",
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          config: {
            systemPrompt: systemPrompt,
          },
        }),
      });

      const data: AIResponse = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.success ? data.data?.response || "收到空响应" : "",
        type: "ai",
        timestamp: new Date(),
        error: data.success ? undefined : data.error,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        type: "ai",
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "未知错误",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4">
            <h1 className="text-2xl font-bold mb-2">LangChain 对话测试界面</h1>
            <p className="text-blue-100 text-sm">
              这是一个测试页面，用于验证 LangChain 集成功能
            </p>

            {/* System Prompt Configuration */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                系统提示 (System Prompt):
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 text-blue-900 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                rows={2}
                placeholder="你是一个有用的AI助手..."
              />
            </div>
          </div>

          {/* Messages Container */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>开始与 AI 对话吧！</p>
                <p className="text-sm mt-2">输入消息并按 Enter 发送</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {message.error ? (
                    <div>
                      <p className="font-medium text-red-600">错误:</p>
                      <p className="text-red-500 text-sm">{message.error}</p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.type === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-bounce bg-gray-400 w-2 h-2 rounded-full"></div>
                    <div
                      className="animate-bounce bg-gray-400 w-2 h-2 rounded-full"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="animate-bounce bg-gray-400 w-2 h-2 rounded-full"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">AI 正在思考...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "发送中..." : "发送"}
              </button>
              <button
                onClick={clearChat}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                清空
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              按 Enter 发送消息，Shift+Enter 换行
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-lg mb-2">使用说明</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 这是一个测试页面，用于验证 LangChain 与 OpenAI API 的集成</li>
            <li>• 可以自定义系统提示来改变 AI 的行为模式</li>
            <li>• 支持实时对话，错误处理和状态显示</li>
            <li>• 按 Enter 发送消息，Shift+Enter 换行</li>
            <li>• 点击"清空"按钮可以清除对话历史</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

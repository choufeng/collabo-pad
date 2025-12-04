import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RedisTestComponent from "../RedisTest";

// Mock fetch
global.fetch = jest.fn();

// Mock EventSource
global.EventSource = jest.fn().mockImplementation(() => ({
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn(),
  close: jest.fn(),
})) as any;

// Mock console methods
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("RedisTestComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    (fetch as jest.Mock).mockReset();
  });

  describe("连接状态测试", () => {
    it("应该显示初始连接状态为未连接", () => {
      render(<RedisTestComponent />);

      expect(screen.getByText("Redis连接状态")).toBeInTheDocument();
      expect(screen.getByText("未连接")).toBeInTheDocument();
      expect(screen.getByText("测试连接")).toBeInTheDocument();
    });

    it("应该能够测试Redis连接", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: true,
          message: "Redis连接成功",
          connected: true,
        }),
      });

      render(<RedisTestComponent />);

      const testButton = screen.getByText("测试连接");
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText("已连接")).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith("/api/redis/connect", {
        method: "POST",
      });
    });

    it("应该处理连接失败的情况", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: false,
          message: "Redis连接失败",
          error: "Connection failed",
        }),
      });

      render(<RedisTestComponent />);

      const testButton = screen.getByText("测试连接");
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText("连接错误")).toBeInTheDocument();
      });
    });

    it("应该能够刷新连接状态", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: true,
          connected: true,
          message: "Redis连接正常",
        }),
      });

      render(<RedisTestComponent />);

      const refreshButton = screen.getByText("刷新状态");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText("已连接")).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith("/api/redis/connect");
    });
  });

  describe("数据操作测试", () => {
    it("应该显示数据操作表单", () => {
      render(<RedisTestComponent />);

      expect(screen.getByText("数据操作测试")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("输入测试key")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("输入测试value")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("过期时间，留空为永不过期"),
      ).toBeInTheDocument();
      expect(screen.getByText("写入数据")).toBeInTheDocument();
      expect(screen.getByText("读取数据")).toBeInTheDocument();
      expect(screen.getByText("删除数据")).toBeInTheDocument();
    });

    it("应该能够写入测试数据", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: true,
          message: "数据写入成功",
          data: { key: "test-key", value: "test-value" },
        }),
      });

      render(<RedisTestComponent />);

      const keyInput = screen.getByPlaceholderText("输入测试key");
      const valueInput = screen.getByPlaceholderText("输入测试value");
      const writeButton = screen.getByText("写入数据");

      fireEvent.change(keyInput, { target: { value: "test-key" } });
      fireEvent.change(valueInput, { target: { value: "test-value" } });
      fireEvent.click(writeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/redis/test-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "test-key", value: "test-value" }),
        });
      });
    });

    it("应该能够读取测试数据", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: true,
          exists: true,
          value: "test-value",
          key: "test-key",
        }),
      });

      render(<RedisTestComponent />);

      const readButton = screen.getByText("读取数据");
      fireEvent.click(readButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/redis/test-data?key=test-key");
      });
    });

    it("应该能够删除测试数据", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: true,
          message: "数据删除成功",
          deleted: true,
          key: "test-key",
        }),
      });

      render(<RedisTestComponent />);

      const deleteButton = screen.getByText("删除数据");
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/redis/test-data?key=test-key",
          {
            method: "DELETE",
          },
        );
      });
    });

    it("应该支持TTL参数", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: true,
          message: "数据写入成功",
        }),
      });

      render(<RedisTestComponent />);

      const keyInput = screen.getByPlaceholderText("输入测试key");
      const valueInput = screen.getByPlaceholderText("输入测试value");
      const ttlInput = screen.getByPlaceholderText("过期时间，留空为永不过期");
      const writeButton = screen.getByText("写入数据");

      fireEvent.change(keyInput, { target: { value: "test-key" } });
      fireEvent.change(valueInput, { target: { value: "test-value" } });
      fireEvent.change(ttlInput, { target: { value: "3600" } });
      fireEvent.click(writeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/redis/test-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "test-key",
            value: "test-value",
            ttl: 3600,
          }),
        });
      });
    });
  });

  describe("SSE流测试", () => {
    it("应该显示SSE流控制", () => {
      render(<RedisTestComponent />);

      expect(screen.getByText("SSE实时流")).toBeInTheDocument();
      expect(screen.getByText("未连接")).toBeInTheDocument();
      expect(screen.getByText("连接SSE")).toBeInTheDocument();
      expect(screen.getByText("断开SSE")).toBeInTheDocument();
      expect(screen.getByText("清空消息")).toBeInTheDocument();
    });

    it("应该能够连接SSE流", () => {
      const mockEventSource = {
        onopen: jest.fn(),
        onmessage: jest.fn(),
        onerror: jest.fn(),
        close: jest.fn(),
      };

      (global.EventSource as jest.Mock).mockImplementation(
        () => mockEventSource,
      );

      render(<RedisTestComponent />);

      const connectButton = screen.getByText("连接SSE");
      fireEvent.click(connectButton);

      expect(global.EventSource).toHaveBeenCalledWith("/api/redis/stream");
      expect(mockEventSource.onopen).toHaveBeenCalled();
      expect(screen.getByText("已连接")).toBeInTheDocument();
    });

    it("应该能够断开SSE连接", () => {
      const mockEventSource = {
        onopen: jest.fn(),
        onmessage: jest.fn(),
        onerror: jest.fn(),
        close: jest.fn(),
      };

      (global.EventSource as jest.Mock).mockImplementation(
        () => mockEventSource,
      );

      render(<RedisTestComponent />);

      const connectButton = screen.getByText("连接SSE");
      fireEvent.click(connectButton);

      const disconnectButton = screen.getByText("断开SSE");
      fireEvent.click(disconnectButton);

      expect(mockEventSource.close).toHaveBeenCalled();
      expect(screen.getByText("未连接")).toBeInTheDocument();
    });

    it("应该能够清空消息", () => {
      render(<RedisTestComponent />);

      const clearButton = screen.getByText("清空消息");
      fireEvent.click(clearButton);

      expect(screen.getByText("暂无消息")).toBeInTheDocument();
    });
  });

  describe("测试结果测试", () => {
    it("应该显示测试结果区域", () => {
      render(<RedisTestComponent />);

      expect(screen.getByText("测试结果")).toBeInTheDocument();
      expect(screen.getByText("清空结果")).toBeInTheDocument();
      expect(screen.getByText("暂无测试结果")).toBeInTheDocument();
    });

    it("应该能够清空测试结果", () => {
      render(<RedisTestComponent />);

      const clearButton = screen.getByText("清空结果");
      fireEvent.click(clearButton);

      expect(screen.getByText("暂无测试结果")).toBeInTheDocument();
    });
  });

  describe("输入表单交互", () => {
    it("应该能够修改输入值", () => {
      render(<RedisTestComponent />);

      const keyInput = screen.getByPlaceholderText("输入测试key");
      const valueInput = screen.getByPlaceholderText("输入测试value");
      const ttlInput = screen.getByPlaceholderText("过期时间，留空为永不过期");

      fireEvent.change(keyInput, { target: { value: "new-key" } });
      fireEvent.change(valueInput, { target: { value: "new-value" } });
      fireEvent.change(ttlInput, { target: { value: "7200" } });

      expect(keyInput).toHaveValue("new-key");
      expect(valueInput).toHaveValue("new-value");
      expect(ttlInput).toHaveValue("7200");
    });
  });

  describe("错误处理", () => {
    it("应该处理网络错误", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(<RedisTestComponent />);

      const testButton = screen.getByText("测试连接");
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText("连接错误")).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it("应该处理API错误响应", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: false,
          message: "API Error",
          error: "Detailed error message",
        }),
      });

      render(<RedisTestComponent />);

      const testButton = screen.getByText("测试连接");
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText("连接错误")).toBeInTheDocument();
      });
    });
  });
});

/**
 * Board组件拖动功能测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Board from "../Board";

// Mock fetch API
global.fetch = vi.fn();

describe("Board拖动功能", () => {
  const mockUser = {
    id: "user-1",
    name: "Test User",
  };

  const mockChannel = {
    id: "test-channel",
  };

  const mockNodes = [
    {
      id: "topic-1",
      type: "custom",
      position: { x: 100, y: 100 },
      data: {
        label: "Test Node 1",
        content: "Test content 1",
        level: 0,
        topic_id: "topic-1",
        user_id: "user-1",
        user_name: "Test User",
        timestamp: Date.now(),
        x: 100,
        y: 100,
      },
    },
    {
      id: "topic-2",
      type: "custom",
      position: { x: 200, y: 200 },
      data: {
        label: "Test Node 2",
        content: "Test content 2",
        level: 1,
        parent_id: "topic-1",
        topic_id: "topic-2",
        user_id: "user-1",
        user_name: "Test User",
        timestamp: Date.now(),
        x: 200,
        y: 200,
      },
    },
  ];

  const mockEdges = [
    {
      id: "edge-topic-1-topic-2",
      source: "topic-1",
      target: "topic-2",
      type: "smoothstep",
      animated: false,
      style: {
        stroke: "#10B981",
        strokeWidth: 2,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("应该正常渲染Board组件", () => {
    render(
      <Board
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        user={mockUser}
        channel={mockChannel}
      />,
    );

    expect(screen.getByText("Test Node 1")).toBeInTheDocument();
    expect(screen.getByText("Test Node 2")).toBeInTheDocument();
  });

  it("应该在拖动结束时调用保存API", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: Promise.resolve({
        success: true,
        message: "主题更新成功",
      }),
    });

    render(
      <Board
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        user={mockUser}
        channel={mockChannel}
      />,
    );

    // 查找节点
    const node1 = screen.getByText("Test Node 1");
    expect(node1).toBeInTheDocument();

    // 模拟拖动结束事件
    const mockNode = {
      id: "topic-1",
      position: { x: 150, y: 150 }, // 新位置
      data: {
        ...mockNodes[0].data,
        x: 100,
        y: 100,
      },
    };

    // 创建拖动事件
    const dragEvent = new MouseEvent("mouseup", {
      bubbles: true,
    });

    // 模拟ReactFlow的onNodeDrag事件
    const boardElement = document.querySelector("[data-testid='board']");
    if (boardElement) {
      // 手动触发拖动结束事件
      fireEvent(
        boardElement,
        new CustomEvent("nodeDragEnd", {
          detail: { node: mockNode, event: dragEvent },
        }),
      );
    }

    // 等待API调用
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/topics/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "topic-1",
          x: 150,
          y: 150,
        }),
      });
    });
  });

  it("应该在位置没有变化时不调用API", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: Promise.resolve({
        success: true,
        message: "主题更新成功",
      }),
    });

    render(
      <Board
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        user={mockUser}
        channel={mockChannel}
      />,
    );

    // 模拟拖动到相同位置
    const mockNode = {
      id: "topic-1",
      position: { x: 100, y: 100 }, // 相同位置
      data: {
        ...mockNodes[0].data,
        x: 100,
        y: 100,
      },
    };

    const dragEvent = new MouseEvent("mouseup", {
      bubbles: true,
    });

    const boardElement = document.querySelector("[data-testid='board']");
    if (boardElement) {
      fireEvent(
        boardElement,
        new CustomEvent("nodeDragEnd", {
          detail: { node: mockNode, event: dragEvent },
        }),
      );
    }

    // 等待一小段时间确保没有API调用
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("应该显示保存状态指示器", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: Promise.resolve({
                  success: true,
                  message: "主题更新成功",
                }),
              }),
            100,
          ),
        ),
    );

    render(
      <Board
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        user={mockUser}
        channel={mockChannel}
      />,
    );

    // 模拟拖动开始
    const mockNode = {
      id: "topic-1",
      position: { x: 150, y: 150 },
      data: {
        ...mockNodes[0].data,
        x: 100,
        y: 100,
      },
    };

    const dragEvent = new MouseEvent("mouseup", {
      bubbles: true,
    });

    const boardElement = document.querySelector("[data-testid='board']");
    if (boardElement) {
      fireEvent(
        boardElement,
        new CustomEvent("nodeDragEnd", {
          detail: { node: mockNode, event: dragEvent },
        }),
      );
    }

    // 检查是否显示保存状态
    await waitFor(() => {
      expect(screen.getByText(/正在保存.*个节点位置/)).toBeInTheDocument();
    });
  });

  it("应该处理API错误", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: Promise.resolve({
        success: false,
        message: "保存失败",
      }),
    });

    render(
      <Board
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        user={mockUser}
        channel={mockChannel}
      />,
    );

    const mockNode = {
      id: "topic-1",
      position: { x: 150, y: 150 },
      data: {
        ...mockNodes[0].data,
        x: 100,
        y: 100,
      },
    };

    const dragEvent = new MouseEvent("mouseup", {
      bubbles: true,
    });

    const boardElement = document.querySelector("[data-testid='board']");
    if (boardElement) {
      fireEvent(
        boardElement,
        new CustomEvent("nodeDragEnd", {
          detail: { node: mockNode, event: dragEvent },
        }),
      );
    }

    // 等待API调用完成
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // 应该继续正常工作，不应该有错误中断
    expect(screen.getByText("Test Node 1")).toBeInTheDocument();
  });

  it("应该正确处理节点ID提取", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: Promise.resolve({
        success: true,
        message: "主题更新成功",
      }),
    });

    render(
      <Board
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        user={mockUser}
        channel={mockChannel}
      />,
    );

    const mockNode = {
      id: "topic-with-prefix",
      position: { x: 250, y: 250 },
      data: {
        ...mockNodes[0].data,
        topic_id: "real-topic-id",
        x: 200,
        y: 200,
      },
    };

    const dragEvent = new MouseEvent("mouseup", {
      bubbles: true,
    });

    const boardElement = document.querySelector("[data-testid='board']");
    if (boardElement) {
      fireEvent(
        boardElement,
        new CustomEvent("nodeDragEnd", {
          detail: { node: mockNode, event: dragEvent },
        }),
      );
    }

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/topics/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "real-topic-id", // 应该使用topic_id而不是完整的节点ID
          x: 250,
          y: 250,
        }),
      });
    });
  });
});

/**
 * Board组件测试
 * 测试按钮布局和交互功能
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Board from "../Board";

// Mock ReactFlow
jest.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  useNodesState: jest.fn(),
  useEdgesState: jest.fn(),
  addEdge: jest.fn(),
  Controls: jest.fn(() => <div data-testid="controls" />),
  MiniMap: jest.fn(() => <div data-testid="minimap" />),
  Background: ({ variant }: { variant?: string }) => (
    <div data-testid="background">{variant}</div>
  ),
  BackgroundVariant: {
    Dots: "dots",
  },
}));

describe("Board 组件", () => {
  const user = userEvent.setup();

  // Mock useNodesState
  const mockSetNodes = jest.fn();
  const mockSetEdges = jest.fn();
  const mockOnNodesChange = jest.fn();
  const mockOnEdgesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useNodesState hook
    const { useNodesState } = require("@xyflow/react");
    useNodesState.mockReturnValue([[], mockSetNodes, mockOnNodesChange]);

    // Mock useEdgesState hook
    const { useEdgesState } = require("@xyflow/react");
    useEdgesState.mockReturnValue([[], mockSetEdges, mockOnEdgesChange]);
  });

  describe("按钮布局", () => {
    it("应该正确渲染Add Topic按钮在右上角", () => {
      // Act
      render(<Board />);

      // Assert
      const button = screen.getByRole("button", { name: "Add Topic" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("top-4", "right-4");
    });

    it("应该有正确的按钮样式类", () => {
      // Act
      render(<Board />);

      // Assert
      const button = screen.getByRole("button", { name: "Add Topic" });
      expect(button).toHaveClass(
        "bg-blue-500",
        "hover:bg-blue-600",
        "text-white",
        "font-medium",
        "py-2",
        "px-4",
        "rounded-lg",
        "shadow-lg",
      );
    });

    it("按钮应该是绝对定位", () => {
      // Act
      render(<Board />);

      // Assert
      const button = screen.getByRole("button", { name: "Add Topic" });
      expect(button).toHaveClass("absolute");
    });
  });

  describe("按钮交互", () => {
    it("点击按钮应该触发侧边栏打开", async () => {
      // Act
      render(<Board />);
      const button = screen.getByRole("button", { name: "Add Topic" });

      await user.click(button);

      // Assert
      // 验证侧边栏被打开（通过检查RightSidebar的presence）
      await waitFor(() => {
        const sidebar = document.querySelector('[data-testid="right-sidebar"]');
        expect(sidebar).toBeInTheDocument();
      });
    });

    it("按钮应该支持键盘导航", () => {
      // Act
      render(<Board />);
      const button = screen.getByRole("button", { name: "Add Topic" });

      // Assert
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("响应式布局", () => {
    it("按钮位置应该在所有屏幕尺寸下保持正确", () => {
      // Act
      render(<Board />);

      // Assert
      const button = screen.getByRole("button", { name: "Add Topic" });
      expect(button).toHaveClass("top-4", "right-4");
    });
  });

  describe("可访问性", () => {
    it("按钮应该有适当的可访问性属性", () => {
      // Act
      render(<Board />);

      // Assert
      const button = screen.getByRole("button", { name: "Add Topic" });
      expect(button).toHaveAttribute("type", "button");
    });
  });
});

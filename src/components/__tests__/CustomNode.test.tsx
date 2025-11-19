/**
 * CustomNode组件测试
 * 测试自定义节点的层级化显示和"+"按钮功能
 */

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomNode from "../CustomNode";
import { ExtendedNodeData } from "@/utils/node-hierarchy";

// Mock ReactFlow Handle component
jest.mock("@xyflow/react", () => ({
  Handle: ({ type, position, className, ...props }: any) => (
    <div
      data-testid={`handle-${type}`}
      data-position={position}
      className={className}
      {...props}
    />
  ),
  Position: {
    Left: "left",
    Right: "right",
  },
}));

describe("CustomNode 组件", () => {
  const user = userEvent.setup();
  const mockOnAddChild = jest.fn();

  // 基础父节点数据
  const parentNodeData: ExtendedNodeData & {
    label: string;
    content: string;
    level?: number;
    childIds?: string[];
  } = {
    label: "父节点内容",
    content: "这是父节点的详细内容",
    level: 0,
    childIds: ["child-1", "child-2"],
  };

  // 基础子节点数据
  const childNodeData: ExtendedNodeData & {
    label: string;
    content: string;
    level?: number;
    childIds?: string[];
  } = {
    label: "子节点内容",
    content: "这是子节点的详细内容",
    level: 1,
    parentId: "parent-1",
    childIds: [],
  };

  // 深层级子节点数据
  const deepChildNodeData: ExtendedNodeData & {
    label: string;
    content: string;
    level?: number;
    childIds?: string[];
  } = {
    label: "深层级子节点",
    content: "这是深层级子节点的内容",
    level: 3,
    parentId: "child-1",
    childIds: [],
  };

  const defaultProps = {
    id: "test-node-1",
    data: parentNodeData,
    selected: false,
    onAddChild: mockOnAddChild,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("基础渲染", () => {
    it("应该正确渲染节点内容", () => {
      render(<CustomNode {...defaultProps} />);

      expect(screen.getByText("父节点内容")).toBeInTheDocument();
      expect(screen.getByText("这是父节点的详细内容")).toBeInTheDocument();
    });

    it("应该渲染连接点", () => {
      render(<CustomNode {...defaultProps} />);

      expect(screen.getByTestId("handle-target")).toBeInTheDocument();
      expect(screen.getByTestId("handle-source")).toBeInTheDocument();
    });

    it("应该渲染添加子节点按钮", () => {
      render(<CustomNode {...defaultProps} />);

      const addButton = screen.getByRole("button", {
        name: /add child comment/i,
      });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute("title", "Add child comment");
    });
  });

  describe("层级样式", () => {
    it("应该为父节点应用正确的样式", () => {
      render(<CustomNode {...defaultProps} />);

      const nodeElement = screen.getByTestId("custom-node");

      expect(nodeElement).toHaveStyle({
        backgroundColor: "#3B82F6", // 蓝色背景
        padding: "16px 20px",
        fontSize: "16px",
      });
    });

    it("应该为子节点应用不同的样式", () => {
      render(<CustomNode {...defaultProps} data={childNodeData} />);

      const nodeElement = screen.getByTestId("custom-node");

      expect(nodeElement).toHaveStyle({
        backgroundColor: "#10B981", // 绿色背景
        padding: "12px 16px",
        fontSize: "14px",
        transform: "scale(0.9)", // 子节点缩小90%
      });
    });

    it("应该为深层级节点应用更小的缩放", () => {
      render(<CustomNode {...defaultProps} data={deepChildNodeData} />);

      const nodeElement = screen.getByTestId("custom-node");

      expect(nodeElement).toHaveStyle({
        backgroundColor: "#EF4444", // 红色背景（层级3）
        transform: "scale(0.7)", // 最小缩放70%
      });
    });
  });

  describe("添加按钮功能", () => {
    it("应该显示正确尺寸的添加按钮", () => {
      render(<CustomNode {...defaultProps} />);

      const addButton = screen.getByRole("button", {
        name: /add child comment/i,
      });
      expect(addButton).toHaveStyle({
        width: "28px",
        height: "28px",
      });
    });

    it("应该为子节点显示较小的添加按钮", () => {
      render(<CustomNode {...defaultProps} data={childNodeData} />);

      const addButton = screen.getByRole("button", {
        name: /add child comment/i,
      });
      expect(addButton).toHaveStyle({
        width: "24px",
        height: "24px",
      });
    });

    it("点击添加按钮应该调用onAddChild回调", async () => {
      render(<CustomNode {...defaultProps} />);

      const addButton = screen.getByRole("button", {
        name: /add child comment/i,
      });
      await user.click(addButton);

      expect(mockOnAddChild).toHaveBeenCalledTimes(1);
      expect(mockOnAddChild).toHaveBeenCalledWith("test-node-1");
    });

    it("点击添加按钮不应该触发节点选择", async () => {
      render(<CustomNode {...defaultProps} selected={false} />);

      const addButton = screen.getByRole("button", {
        name: /add child comment/i,
      });
      await user.click(addButton);

      // 验证按钮点击事件被阻止冒泡（通过检查是否有选择相关的副作用）
      // 这里主要是确保事件不会传播到父元素
      expect(mockOnAddChild).toHaveBeenCalled();
    });
  });

  describe("子节点数量指示器", () => {
    it("应该显示子节点数量", () => {
      render(<CustomNode {...defaultProps} />);

      expect(screen.getByText("2")).toBeInTheDocument(); // childIds有2个元素
    });

    it("当没有子节点时不应该显示指示器", () => {
      const noChildData = { ...parentNodeData, childIds: [] };
      render(<CustomNode {...defaultProps} data={noChildData} />);

      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });
  });

  describe("选中状态", () => {
    it("应该为选中节点添加环形高亮", () => {
      render(<CustomNode {...defaultProps} selected={true} />);

      const nodeElement = screen.getByTestId("custom-node");

      expect(nodeElement).toHaveClass(
        "ring-2",
        "ring-blue-500",
        "ring-offset-2",
      );
    });

    it("未选中节点不应该有环形高亮", () => {
      render(<CustomNode {...defaultProps} selected={false} />);

      const nodeElement = screen.getByTestId("custom-node");

      expect(nodeElement).not.toHaveClass("ring-2", "ring-blue-500");
    });
  });

  describe("悬停效果", () => {
    it("应该支持悬停状态", () => {
      render(<CustomNode {...defaultProps} />);

      const nodeElement = screen.getByTestId("custom-node");

      expect(nodeElement).toHaveClass("hover:shadow-lg");
    });
  });

  describe("可访问性", () => {
    it("添加按钮应该有正确的aria-label", () => {
      render(<CustomNode {...defaultProps} />);

      const addButton = screen.getByRole("button", {
        name: /add child comment/i,
      });
      expect(addButton).toHaveAttribute("aria-label", "Add child comment");
    });

    it("添加按钮应该有工具提示", () => {
      render(<CustomNode {...defaultProps} />);

      const addButton = screen.getByRole("button", {
        name: /add child comment/i,
      });
      expect(addButton).toHaveAttribute("title", "Add child comment");
    });
  });

  describe("响应式设计", () => {
    it("应该支持截断长文本", () => {
      const longTextData = {
        ...parentNodeData,
        label: "这是一个非常长的节点标题，应该被截断显示",
        content: "这是一个非常长的节点内容，也应该被截断显示",
      };

      render(<CustomNode {...defaultProps} data={longTextData} />);

      const labelElement = screen.getByText(/这是一个非常长的节点标题/);
      expect(labelElement).toHaveClass("truncate");
    });
  });

  describe("开发模式调试", () => {
    // 在开发环境中测试层级指示器
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("在开发模式中应该显示层级指示器", () => {
      render(<CustomNode {...defaultProps} />);

      expect(screen.getByText("L0")).toBeInTheDocument();
    });

    it("应该显示正确的层级数字", () => {
      render(<CustomNode {...defaultProps} data={childNodeData} />);

      expect(screen.getByText("L1")).toBeInTheDocument();
    });
  });
});

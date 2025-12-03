/**
 * CustomNode组件测试
 * 测试自定义节点的层级化显示和创建者信息显示
 */

import { render, screen } from "@testing-library/react";
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
  // 基础父节点数据
  const parentNodeData: ExtendedNodeData & {
    label: string;
    content: string;
    level?: number;
    childIds?: string[];
    creator?: string;
  } = {
    label: "父节点内容",
    content: "这是父节点的详细内容",
    level: 0,
    childIds: ["child-1", "child-2"],
    creator: "testUser",
  };

  // 基础子节点数据
  const childNodeData: ExtendedNodeData & {
    label: string;
    content: string;
    level?: number;
    childIds?: string[];
    creator?: string;
  } = {
    label: "子节点内容",
    content: "这是子节点的详细内容",
    level: 1,
    parentId: "parent-1",
    childIds: [],
    creator: "childUser",
  };

  // 深层级子节点数据
  const deepChildNodeData: ExtendedNodeData & {
    label: string;
    content: string;
    level?: number;
    childIds?: string[];
    creator?: string;
  } = {
    label: "深层级子节点",
    content: "这是深层级子节点的内容",
    level: 3,
    parentId: "child-1",
    childIds: [],
    creator: "deepUser",
  };

  // 没有创建者信息的节点数据
  const nodeDataWithoutCreator: ExtendedNodeData & {
    label: string;
    content: string;
    level?: number;
    childIds?: string[];
  } = {
    label: "无创建者节点",
    content: "这是没有创建者信息的节点",
    level: 0,
    childIds: [],
  };

  const defaultProps = {
    id: "test-node-1",
    data: parentNodeData,
    selected: false,
  };

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

    it("不应该显示添加子节点按钮", () => {
      render(<CustomNode {...defaultProps} />);

      expect(
        screen.queryByRole("button", { name: /add child comment/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("层级样式", () => {
    it("应该为不同层级的节点应用不同的样式", () => {
      const { rerender } = render(<CustomNode {...defaultProps} />);

      const parentNodeElement = screen.getByTestId("custom-node");
      const parentNodeStyle = parentNodeElement.style.backgroundColor;

      // 渲染子节点
      rerender(<CustomNode {...defaultProps} data={childNodeData} />);
      const childNodeElement = screen.getByTestId("custom-node");
      const childNodeStyle = childNodeElement.style.backgroundColor;

      // 子节点和父节点应该有不同的背景色
      expect(childNodeStyle).not.toBe(parentNodeStyle);
    });

    it("应该为深层级节点应用缩放效果", () => {
      render(<CustomNode {...defaultProps} data={deepChildNodeData} />);

      const nodeElement = screen.getByTestId("custom-node");

      // 检查是否有transform样式
      expect(nodeElement.style.transform).toBeTruthy();
    });

    it("应该为不同层级的节点应用视觉效果", () => {
      const { rerender } = render(
        <CustomNode {...defaultProps} data={parentNodeData} />,
      );

      const parentStyle = screen.getByTestId("custom-node").style;

      rerender(<CustomNode {...defaultProps} data={childNodeData} />);
      const childStyle = screen.getByTestId("custom-node").style;

      // 父节点和子节点通常有不同的样式
      expect(parentStyle.transform || childStyle.transform).toBeDefined();

      // 验证节点确实有样式应用
      expect(parentStyle.backgroundColor).toBeTruthy();
      expect(childStyle.backgroundColor).toBeTruthy();
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

    it("节点内容应该充分利用可用空间", () => {
      render(<CustomNode {...defaultProps} />);

      const contentContainer = screen.getByText("父节点内容").parentElement;
      expect(contentContainer).toHaveClass("flex-1");
    });
  });

  describe("创建者信息显示", () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("在开发模式中应该显示创建者信息", () => {
      render(<CustomNode {...defaultProps} />);

      expect(screen.getByText("testUser")).toBeInTheDocument();
    });

    it("应该显示正确的创建者用户名", () => {
      render(<CustomNode {...defaultProps} data={childNodeData} />);

      expect(screen.getByText("childUser")).toBeInTheDocument();
    });

    it("应该显示深层级节点的创建者", () => {
      render(<CustomNode {...defaultProps} data={deepChildNodeData} />);

      expect(screen.getByText("deepUser")).toBeInTheDocument();
    });

    it("当没有创建者信息时不应该显示创建者标签", () => {
      render(<CustomNode {...defaultProps} data={nodeDataWithoutCreator} />);

      expect(screen.queryByText(/testUser/)).not.toBeInTheDocument();
    });

    it("在生产模式中不应该显示创建者信息", () => {
      process.env.NODE_ENV = "production";

      render(<CustomNode {...defaultProps} />);

      expect(screen.queryByText("testUser")).not.toBeInTheDocument();
    });
  });

  describe("向后兼容性", () => {
    it("应该支持没有creator字段的旧数据", () => {
      expect(() => {
        render(<CustomNode {...defaultProps} data={nodeDataWithoutCreator} />);
      }).not.toThrow();
    });

    it("应该支持包含creator字段的新数据", () => {
      expect(() => {
        render(<CustomNode {...defaultProps} data={parentNodeData} />);
      }).not.toThrow();
    });
  });

  describe("布局变化", () => {
    it("移除+按钮后内容区域应该使用全部可用空间", () => {
      render(<CustomNode {...defaultProps} />);

      const nodeElement = screen.getByTestId("custom-node");
      const contentContainer = nodeElement.querySelector(".flex-1");

      expect(contentContainer).toBeInTheDocument();
      expect(nodeElement.querySelector("button")).not.toBeInTheDocument();
    });
  });
});

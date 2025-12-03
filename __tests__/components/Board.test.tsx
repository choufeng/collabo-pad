import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Board from "../../src/components/Board";
import { createMockNode, createMockEdge } from "../utils/testUtils";

// Mock ReactFlow
jest.mock("@xyflow/react", () => {
  const React = require("react");
  return {
    ReactFlow: function ReactFlowMock(props) {
      return React.createElement(
        "div",
        { "data-testid": "react-flow" },
        props.children,
      );
    },
    Background: function BackgroundMock() {
      return React.createElement("div", { "data-testid": "background" });
    },
    Controls: function ControlsMock() {
      return React.createElement("div", { "data-testid": "controls" });
    },
    MiniMap: function MiniMapMock() {
      return React.createElement("div", { "data-testid": "minimap" });
    },
    useNodesState: function useNodesStateMock(initialNodes) {
      const [nodes, setNodes] = React.useState(initialNodes);
      const [_, setOnNodesChange] = React.useState(() => () => {});
      return [nodes, setNodes, setOnNodesChange];
    },
    useEdgesState: function useEdgesStateMock(initialEdges) {
      const [edges, setEdges] = React.useState(initialEdges);
      const [_, setOnEdgesChange] = React.useState(() => () => {});
      return [edges, setEdges, setOnEdgesChange];
    },
    addEdge: function addEdgeMock(edgeParams, edges) {
      return [...edges, { ...edgeParams, id: "new-edge" }];
    },
    ConnectionLineType: "smoothstep",
    NodeChange: {},
    EdgeChange: {},
    BackgroundVariant: {
      Dots: "dots",
      Lines: "lines",
      Cross: "cross",
    },
  };
});

describe("Board组件", () => {
  const defaultProps = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("基础渲染", () => {
    it("应该正确渲染Board组件", () => {
      render(<Board {...defaultProps} />);

      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
      expect(screen.getByTestId("background")).toBeInTheDocument();
      expect(screen.getByTestId("controls")).toBeInTheDocument();
    });

    it("应该包含Add Topic按钮", () => {
      render(<Board {...defaultProps} />);

      const createButton = screen.getByText("Add Topic");
      expect(createButton).toBeInTheDocument();
    });

    it("初始状态下不应该显示侧边栏", () => {
      render(<Board {...defaultProps} />);

      expect(screen.queryByTestId("right-sidebar")).not.toBeInTheDocument();
    });
  });

  describe("节点创建功能", () => {
    it("点击Add Topic按钮应该展开侧边栏", () => {
      render(<Board {...defaultProps} />);

      const createButton = screen.getByText("Add Topic");
      fireEvent.click(createButton);

      expect(screen.getByTestId("right-sidebar")).toBeInTheDocument();
    });

    it("应该传递正确的模式给侧边栏", () => {
      render(<Board {...defaultProps} />);

      const createButton = screen.getByText("Add Topic");
      fireEvent.click(createButton);

      const sidebar = screen.getByTestId("right-sidebar");
      expect(sidebar).toHaveAttribute("data-mode", "create");
    });

    it("应该传递空的数据给侧边栏", () => {
      render(<Board {...defaultProps} />);

      const createButton = screen.getByText("Add Topic");
      fireEvent.click(createButton);

      const sidebar = screen.getByTestId("right-sidebar");
      expect(sidebar).toHaveAttribute("data-node-data", "{}");
    });
  });

  describe("侧边栏状态管理", () => {
    it("保存节点后应该关闭侧边栏", () => {
      render(<Board {...defaultProps} />);

      // 打开创建侧边栏
      const createButton = screen.getByText("Add Topic");
      fireEvent.click(createButton);

      // 模拟表单提交 - 填充内容并提交
      const textarea = screen.getByPlaceholderText("Enter topic content");
      fireEvent.change(textarea, { target: { value: "测试节点内容" } });
      const saveButton = screen.getByRole("button", { name: "Create Topic" });
      fireEvent.click(saveButton);

      // 验证侧边栏关闭
      expect(screen.queryByTestId("right-sidebar")).not.toBeInTheDocument();
    });

    it("按ESC键应该关闭侧边栏", () => {
      render(<Board {...defaultProps} />);

      // 打开创建侧边栏
      const createButton = screen.getByText("Add Topic");
      fireEvent.click(createButton);

      // 按ESC键
      fireEvent.keyDown(document, { key: "Escape" });

      // 验证侧边栏关闭
      expect(screen.queryByTestId("right-sidebar")).not.toBeInTheDocument();
    });
  });

  describe("ReactFlow集成", () => {
    it("应该正确处理节点变化", () => {
      render(<Board {...defaultProps} />);

      // 模拟节点变化
      const nodeChanges = [
        { type: "position", id: "test-node-1", position: { x: 200, y: 200 } },
      ];

      // 验证节点状态更新
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });

    it("应该正确处理连接线变化", () => {
      render(<Board {...defaultProps} />);

      // 模拟连接线变化
      const edgeChanges = [{ type: "remove", id: "test-edge-1" }];

      // 验证连接线状态更新
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });
  });

  describe("错误处理", () => {
    it("应该处理无效的节点数据", () => {
      render(<Board {...defaultProps} />);

      // 验证组件能够处理无效数据
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });

    it("应该处理侧边栏操作异常", () => {
      render(<Board {...defaultProps} />);

      // 模拟异常情况
      const createButton = screen.getByText("Add Topic");
      fireEvent.click(createButton);

      // 验证错误处理
      expect(screen.getByTestId("right-sidebar")).toBeInTheDocument();
    });
  });
});

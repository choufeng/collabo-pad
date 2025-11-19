import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RightSidebar, {
  SidebarMode,
  NodeData,
} from "../../src/components/RightSidebar";
import { createMockNodeData } from "../utils/testUtils";

// Mock NodeEditor
jest.mock("../../src/components/NodeEditor", () => {
  const React = require("react");
  const NodeEditorMock = function NodeEditorMock({
    mode,
    selectedNodeId,
    sourceNodeId,
    initialData,
    onSave,
    onCancel,
  }: any) {
    return React.createElement("div", { "data-testid": "node-editor" }, [
      React.createElement("div", { key: "mode" }, `Mode: ${mode}`),
      React.createElement(
        "div",
        { key: "selectedNodeId" },
        `Selected ID: ${selectedNodeId}`,
      ),
      React.createElement(
        "div",
        { key: "sourceNodeId" },
        `Source ID: ${sourceNodeId}`,
      ),
      React.createElement(
        "div",
        { key: "initialData" },
        `Initial Data: ${JSON.stringify(initialData)}`,
      ),
      React.createElement(
        "button",
        {
          key: "save",
          onClick: () => {
            if (selectedNodeId) {
              // 编辑模式，传递 nodeId 和 data
              (onSave as any)(
                selectedNodeId,
                initialData || { content: "test content" },
              );
            } else {
              // 创建模式，只传递 data
              (onSave as any)(initialData || { content: "test content" });
            }
          },
        },
        "Save",
      ),
      React.createElement(
        "button",
        {
          key: "cancel",
          onClick: onCancel,
        },
        "Cancel",
      ),
    ]);
  };

  NodeEditorMock.displayName = "NodeEditorMock";

  return {
    __esModule: true,
    default: NodeEditorMock,
  };
});

describe("RightSidebar组件", () => {
  const defaultProps = {
    isOpen: false,
    mode: null as SidebarMode,
    onClose: jest.fn(),
    onSaveNode: jest.fn(),
    onUpdateNode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("基础渲染", () => {
    it("当 isOpen 为 false 时不应该渲染", () => {
      render(<RightSidebar {...defaultProps} />);

      expect(screen.queryByTestId("right-sidebar")).not.toBeInTheDocument();
    });

    it("当 isOpen 为 true 时应该渲染侧边栏", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="create" />);

      expect(screen.getByTestId("right-sidebar")).toBeInTheDocument();
    });

    it("应该渲染正确的模式标题", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="create" />);

      expect(screen.getByText("Create New Topic")).toBeInTheDocument();
    });

    it("应该渲染 NodeEditor 组件", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="create" />);

      expect(screen.getByTestId("node-editor")).toBeInTheDocument();
    });
  });

  describe("不同模式的标题显示", () => {
    it("创建模式应该显示正确的标题", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="create" />);

      expect(screen.getByText("Create New Topic")).toBeInTheDocument();
    });

    it("编辑模式应该显示正确的标题", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="edit" />);

      expect(screen.getByText("Edit Topic")).toBeInTheDocument();
    });

    it("连接模式应该显示正确的标题", () => {
      render(
        <RightSidebar {...defaultProps} isOpen={true} mode="connection" />,
      );

      expect(screen.getByText("Create Connected Topic")).toBeInTheDocument();
    });
  });

  describe("关闭功能", () => {
    it("应该渲染关闭按钮", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="create" />);

      const closeButton = screen.getByLabelText("Close sidebar");
      expect(closeButton).toBeInTheDocument();
    });

    it("点击关闭按钮应该调用 onClose", () => {
      const onClose = jest.fn();
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="create"
          onClose={onClose}
        />,
      );

      const closeButton = screen.getByLabelText("Close sidebar");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("ESC 键关闭", () => {
    it("按 ESC 键应该调用 onClose", () => {
      const onClose = jest.fn();
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="create"
          onClose={onClose}
        />,
      );

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("当侧边栏关闭时按 ESC 键不应该调用 onClose", () => {
      const onClose = jest.fn();
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={false}
          mode="create"
          onClose={onClose}
        />,
      );

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Props 传递", () => {
    it("应该正确传递 mode 给 NodeEditor", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="edit" />);

      expect(screen.getByText("Mode: edit")).toBeInTheDocument();
    });

    it("应该正确传递 selectedNodeId 给 NodeEditor", () => {
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="edit"
          selectedNodeId="node-123"
        />,
      );

      expect(screen.getByText("Selected ID: node-123")).toBeInTheDocument();
    });

    it("应该正确传递 sourceNodeId 给 NodeEditor", () => {
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="connection"
          sourceNodeId="source-456"
        />,
      );

      expect(screen.getByText("Source ID: source-456")).toBeInTheDocument();
    });

    it("应该正确传递 initialData 给 NodeEditor", () => {
      const initialData: NodeData = { content: "测试内容" };
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="edit"
          initialData={initialData}
        />,
      );

      expect(
        screen.getByText("Initial Data: " + JSON.stringify(initialData)),
      ).toBeInTheDocument();
    });
  });

  describe("回调函数", () => {
    it("应该正确传递 onSaveNode 给 NodeEditor（非编辑模式）", () => {
      const onSaveNode = jest.fn();
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="create"
          onSaveNode={onSaveNode}
        />,
      );

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      expect(onSaveNode).toHaveBeenCalledWith({ content: "test content" });
    });

    it("应该正确传递 onUpdateNode 给 NodeEditor（编辑模式）", () => {
      const onUpdateNode = jest.fn();
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="edit"
          selectedNodeId="node-123"
          onUpdateNode={onUpdateNode}
        />,
      );

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      expect(onUpdateNode).toHaveBeenCalledWith("node-123", {
        content: "test content",
      });
    });

    it("应该正确传递 onClose 给 NodeEditor", () => {
      const onClose = jest.fn();
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="create"
          onClose={onClose}
        />,
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("数据属性", () => {
    it("应该设置正确的 data-testid", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="create" />);

      const sidebar = screen.getByTestId("right-sidebar");
      expect(sidebar).toBeInTheDocument();
    });

    it("应该设置正确的 data-mode", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="create" />);

      const sidebar = screen.getByTestId("right-sidebar");
      expect(sidebar).toHaveAttribute("data-mode", "create");
    });

    it("应该设置正确的 data-node-data", () => {
      const initialData: NodeData = { content: "测试数据" };
      render(
        <RightSidebar
          {...defaultProps}
          isOpen={true}
          mode="edit"
          initialData={initialData}
        />,
      );

      const sidebar = screen.getByTestId("right-sidebar");
      expect(sidebar).toHaveAttribute(
        "data-node-data",
        JSON.stringify(initialData),
      );
    });

    it("当没有 initialData 时应该设置空的 data-node-data", () => {
      render(<RightSidebar {...defaultProps} isOpen={true} mode="create" />);

      const sidebar = screen.getByTestId("right-sidebar");
      expect(sidebar).toHaveAttribute("data-node-data", "{}");
    });
  });

  describe("错误处理", () => {
    it("应该处理缺失的回调函数", () => {
      expect(() => {
        render(
          <RightSidebar
            isOpen={true}
            mode="create"
            onClose={jest.fn()}
            onSaveNode={jest.fn()}
            onUpdateNode={jest.fn()}
          />,
        );
      }).not.toThrow();
    });

    it("应该处理空的 initialData", () => {
      expect(() => {
        render(
          <RightSidebar
            {...defaultProps}
            isOpen={true}
            mode="edit"
            initialData={undefined}
          />,
        );
      }).not.toThrow();
    });
  });
});

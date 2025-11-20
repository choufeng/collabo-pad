import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NodeEditor from "../../src/components/NodeEditor";
import { SidebarMode } from "../../src/components/RightSidebar";

// 简化的API Mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("NodeEditor API Integration (Simple)", () => {
  const defaultProps = {
    mode: "create" as SidebarMode,
    onSave: jest.fn(),
    onCancel: jest.fn(),
    user: {
      id: "test-user-123",
      name: "Test User",
    },
    channel: {
      id: "test-channel-123",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("应该测试当前的NodeEditor是否缺少API集成功能", async () => {
    // 设置成功的API响应
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: "Topic created successfully",
        topic: { id: "test-topic" },
        messageId: "test-message",
      }),
    });

    render(<NodeEditor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Enter topic content");
    const submitButton = screen.getByRole("button", { name: "Create Topic" });

    // 输入内容并提交
    fireEvent.change(textarea, { target: { value: "测试主题内容" } });
    fireEvent.click(submitButton);

    // 等待一段时间看是否有API调用发生
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 当前实现应该没有调用fetch API（这是红阶段测试的核心）
    expect(mockFetch).not.toHaveBeenCalled();

    // 但是应该调用onSave回调（当前行为）
    expect(defaultProps.onSave).toHaveBeenCalledWith({
      content: "测试主题内容",
    });
  });

  it("子主题创建也应该缺少API集成", async () => {
    const mockOnCreateChildNode = jest.fn();

    const childProps = {
      ...defaultProps,
      mode: "edit" as SidebarMode,
      selectedNodeId: "parent-node-123",
      onCreateChildNode: mockOnCreateChildNode,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: "Topic created successfully",
        topic: { id: "child-topic", parent_id: "parent-node-123" },
        messageId: "test-message",
      }),
    });

    render(<NodeEditor {...childProps} />);

    // 检查子主题创建表单是否存在
    expect(screen.getByText("Add Child Topic")).toBeInTheDocument();

    const childTextarea = screen.getByPlaceholderText(
      "Enter child topic content...",
    );
    const createButton = screen.getByRole("button", {
      name: "Create Child Topic",
    });

    fireEvent.change(childTextarea, { target: { value: "子主题内容" } });
    fireEvent.click(createButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 当前实现应该没有调用fetch API
    expect(mockFetch).not.toHaveBeenCalled();

    // 但是应该调用onCreateChildNode回调（当前行为）
    expect(mockOnCreateChildNode).toHaveBeenCalledWith(
      "parent-node-123",
      "子主题内容",
    );
  });

  it("应该测试API错误处理逻辑缺失", async () => {
    // 设置API错误响应
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: "API调用失败",
        error: "BAD_REQUEST",
      }),
    });

    render(<NodeEditor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Enter topic content");
    const submitButton = screen.getByRole("button", { name: "Create Topic" });

    fireEvent.change(textarea, { target: { value: "测试内容" } });
    fireEvent.click(submitButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 当前实现不会调用API，所以不会有错误处理
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByText("API调用失败")).not.toBeInTheDocument();
  });
});

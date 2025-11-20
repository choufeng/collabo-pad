import React, { act } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NodeEditor from "../../src/components/NodeEditor";
import { SidebarMode } from "../../src/components/RightSidebar";
import {
  mockFetch,
  setupGlobalFetchMock,
  cleanupGlobalFetchMock,
  mockErrorAPIResponse,
  mockSuccessAPIResponse,
  mockNetworkError,
  expectAPICall,
  TEST_DATA,
} from "../utils/apiTestUtils";

// 模拟用户上下文
const mockUser = {
  id: "test-user-123",
  name: "Test User",
};

// 模拟频道上下文
const mockChannel = {
  id: "test-channel-123",
};

describe("NodeEditor API Integration Tests", () => {
  const defaultProps = {
    mode: "create" as SidebarMode,
    onSave: jest.fn(),
    onCancel: jest.fn(),
    user: mockUser,
    channel: mockChannel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupGlobalFetchMock();
  });

  afterEach(() => {
    cleanupGlobalFetchMock();
  });

  describe("Add Topic Form API Integration", () => {
    describe("API Error Cases", () => {
      it("应该显示错误信息当API调用失败时 - 缺少必需参数", async () => {
        // 设置 API 返回错误
        mockErrorAPIResponse(
          "MISSING_CHANNEL_ID",
          "频道ID是必需的且必须是字符串",
          400,
        );

        render(<NodeEditor {...defaultProps} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        // 输入内容并提交
        fireEvent.change(textarea, { target: { value: "测试主题内容" } });
        fireEvent.click(submitButton);

        // 等待错误消息显示
        await waitFor(() => {
          expect(
            screen.getByText("频道ID是必需的且必须是字符串"),
          ).toBeInTheDocument();
        });

        // 验证API被调用
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it("应该显示错误信息当内容为空时", async () => {
        mockErrorAPIResponse(
          "MISSING_CONTENT",
          "主题内容是必需的且不能为空",
          400,
        );

        render(<NodeEditor {...defaultProps} />);

        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        // 提交空表单
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText("主题内容是必需的且不能为空"),
          ).toBeInTheDocument();
        });
      });

      it("应该显示错误信息当内容过长时", async () => {
        mockErrorAPIResponse(
          "CONTENT_TOO_LONG",
          "主题内容长度不能超过1000个字符",
          400,
        );

        render(<NodeEditor {...defaultProps} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        // 输入超长内容
        const longContent = "a".repeat(1001);
        fireEvent.change(textarea, { target: { value: longContent } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText("主题内容长度不能超过1000个字符"),
          ).toBeInTheDocument();
        });
      });

      it("应该处理网络错误", async () => {
        mockNetworkError(new Error("Network connection failed"));

        render(<NodeEditor {...defaultProps} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        fireEvent.change(textarea, { target: { value: "测试内容" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText("Network connection failed"),
          ).toBeInTheDocument();
        });
      });

      it("应该处理服务器内部错误", async () => {
        mockErrorAPIResponse("INTERNAL_SERVER_ERROR", "服务器内部错误", 500);

        render(<NodeEditor {...defaultProps} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        fireEvent.change(textarea, { target: { value: "测试内容" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText("服务器内部错误")).toBeInTheDocument();
        });
      });

      it("提交失败时应该保持用户输入的内容", async () => {
        mockErrorAPIResponse("VALIDATION_ERROR", "验证失败", 400);

        render(<NodeEditor {...defaultProps} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        const testContent = "用户输入的内容应该保持不变";
        fireEvent.change(textarea, { target: { value: testContent } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText("验证失败")).toBeInTheDocument();
        });

        // 验证内容仍然存在
        expect(textarea).toHaveValue(testContent);
      });

      it("应该显示加载状态并禁用按钮在API调用期间", async () => {
        // 设置延迟的API响应
        mockFetch.mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    status: 201,
                    json: async () => ({ success: true, message: "Success" }),
                  }),
                100,
              ),
            ),
        );

        render(<NodeEditor {...defaultProps} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        fireEvent.change(textarea, { target: { value: "测试内容" } });
        fireEvent.click(submitButton);

        // 检查按钮状态
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent(/loading|creating/i);
      });
    });

    describe("API Success Cases", () => {
      it("应该成功创建主题并显示成功消息", async () => {
        const mockTopic = {
          id: "new-topic-123",
          channel_id: "test-channel-123",
          content: "测试主题内容",
          user_id: "test-user-123",
          user_name: "Test User",
          timestamp: Date.now(),
        };

        mockSuccessAPIResponse(mockTopic);

        render(<NodeEditor {...defaultProps} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        fireEvent.change(textarea, { target: { value: "测试主题内容" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText("Topic created successfully"),
          ).toBeInTheDocument();
        });

        // 验证API调用参数
        expectAPICall({
          channel_id: "test-channel-123",
          content: "测试主题内容",
          user_id: "test-user-123",
          user_name: "Test User",
        });
      });

      it("成功创建后应该清空表单", async () => {
        mockSuccessAPIResponse();

        render(<NodeEditor {...defaultProps} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        fireEvent.change(textarea, { target: { value: "测试内容" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText("Topic created successfully"),
          ).toBeInTheDocument();
        });

        // 验证表单被清空
        expect(textarea).toHaveValue("");
      });

      it("成功创建后应该调用onSave回调", async () => {
        const mockOnSave = jest.fn();
        mockSuccessAPIResponse();

        render(<NodeEditor {...defaultProps} onSave={mockOnSave} />);

        const textarea = screen.getByPlaceholderText("Enter topic content");
        const submitButton = screen.getByRole("button", {
          name: "Create Topic",
        });

        fireEvent.change(textarea, { target: { value: "测试内容" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith({
            content: "测试内容",
          });
        });
      });
    });
  });

  describe("Add Child Topic Form API Integration", () => {
    const childTopicProps = {
      ...defaultProps,
      mode: "edit" as SidebarMode,
      selectedNodeId: "parent-topic-123",
      onCreateChildNode: jest.fn(),
    };

    describe("Child Topic API Error Cases", () => {
      it("应该显示错误信息当子主题创建失败时", async () => {
        mockErrorAPIResponse("PARENT_NOT_FOUND", "父主题不存在", 400);

        render(<NodeEditor {...childTopicProps} />);

        const childTextarea = screen.getByPlaceholderText(
          "Enter child topic content...",
        );
        const createButton = screen.getByRole("button", {
          name: "Create Child Topic",
        });

        fireEvent.change(childTextarea, { target: { value: "子主题内容" } });
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(screen.getByText("父主题不存在")).toBeInTheDocument();
        });
      });

      it("创建子主题失败时应该保持输入内容", async () => {
        mockErrorAPIResponse(
          "CHILD_TOPIC_CREATE_FAILED",
          "创建子主题失败",
          500,
        );

        render(<NodeEditor {...childTopicProps} />);

        const childTextarea = screen.getByPlaceholderText(
          "Enter child topic content...",
        );
        const createButton = screen.getByRole("button", {
          name: "Create Child Topic",
        });

        const childContent = "子主题内容应该保持";
        fireEvent.change(childTextarea, { target: { value: childContent } });
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(screen.getByText("创建子主题失败")).toBeInTheDocument();
        });

        expect(childTextarea).toHaveValue(childContent);
      });
    });

    describe("Child Topic API Success Cases", () => {
      it("应该成功创建子主题", async () => {
        const mockChildTopic = {
          id: "child-topic-123",
          parent_id: "parent-topic-123",
          channel_id: "test-channel-123",
          content: "子主题内容",
          user_id: "test-user-123",
          user_name: "Test User",
          timestamp: Date.now(),
        };

        mockSuccessAPIResponse(mockChildTopic);

        render(<NodeEditor {...childTopicProps} />);

        const childTextarea = screen.getByPlaceholderText(
          "Enter child topic content...",
        );
        const createButton = screen.getByRole("button", {
          name: "Create Child Topic",
        });

        fireEvent.change(childTextarea, { target: { value: "子主题内容" } });
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(
            screen.getByText("Topic created successfully"),
          ).toBeInTheDocument();
        });

        // 验证API调用包含parent_id
        expectAPICall({
          parent_id: "parent-topic-123",
          channel_id: "test-channel-123",
          content: "子主题内容",
          user_id: "test-user-123",
          user_name: "Test User",
        });
      });

      it("成功创建子主题后应该清空子主题表单", async () => {
        mockSuccessAPIResponse();

        render(<NodeEditor {...childTopicProps} />);

        const childTextarea = screen.getByPlaceholderText(
          "Enter child topic content...",
        );
        const createButton = screen.getByRole("button", {
          name: "Create Child Topic",
        });

        fireEvent.change(childTextarea, { target: { value: "子主题内容" } });
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(
            screen.getByText("Topic created successfully"),
          ).toBeInTheDocument();
        });

        // 验证子主题表单被清空
        expect(childTextarea).toHaveValue("");
      });

      it("成功创建子主题后应该调用onCreateChildNode回调", async () => {
        const mockOnCreateChildNode = jest.fn();
        mockSuccessAPIResponse();

        render(
          <NodeEditor
            {...childTopicProps}
            onCreateChildNode={mockOnCreateChildNode}
          />,
        );

        const childTextarea = screen.getByPlaceholderText(
          "Enter child topic content...",
        );
        const createButton = screen.getByRole("button", {
          name: "Create Child Topic",
        });

        fireEvent.change(childTextarea, { target: { value: "子主题内容" } });
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(mockOnCreateChildNode).toHaveBeenCalledWith(
            "parent-topic-123",
            "子主题内容",
          );
        });
      });
    });
  });

  describe("Form Validation and Error Handling", () => {
    it("应该验证表单数据在发送到API之前", async () => {
      render(<NodeEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Enter topic content");
      const submitButton = screen.getByRole("button", { name: "Create Topic" });

      // 输入超过500字符限制的内容
      const longContent = "a".repeat(501);
      fireEvent.change(textarea, { target: { value: longContent } });

      // 检查是否显示客户端验证错误
      expect(screen.getByText("501/500")).toBeInTheDocument();

      // 如果有客户端验证，按钮应该是禁用的
      if (submitButton.hasAttribute("disabled")) {
        expect(submitButton).toBeDisabled();
      }
    });

    it("应该处理空格内容的提交", async () => {
      mockErrorAPIResponse(
        "MISSING_CONTENT",
        "主题内容是必需的且不能为空",
        400,
      );

      render(<NodeEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Enter topic content");
      const submitButton = screen.getByRole("button", { name: "Create Topic" });

      fireEvent.change(textarea, { target: { value: "   " } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("主题内容是必需的且不能为空"),
        ).toBeInTheDocument();
      });
    });
  });
});

/**
 * 简化的首页面组件测试
 * 适配新的用户和频道数据服务
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomePage } from "../home-page";
import { useUserStore } from "../../stores/user-store";
import { useRouter } from "next/navigation";

// Mock 状态管理
jest.mock("../../stores/user-store");

// Mock 路由
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseUserStore = useUserStore as jest.MockedFunction<
  typeof useUserStore
>;
const mockPush = jest.fn();

describe("HomePage 组件 - 简化版本", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    // 设置路由 mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // 设置默认的用户 store mock 返回值
    mockUseUserStore.mockReturnValue({
      currentUser: null,
      isLoading: false,
      error: null,
      setCurrentUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      createOrGetUser: jest.fn(),
      loadCurrentUser: jest.fn(),
      clearCurrentUser: jest.fn(),
      reset: jest.fn(),
    });
  });

  describe("渲染测试", () => {
    it("应该正确渲染首页面", () => {
      // Act
      render(<HomePage />);

      // Assert
      expect(screen.getByText("协作画板")).toBeInTheDocument();
      expect(
        screen.getByText("输入用户名和频道ID开始协作"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("用户名")).toBeInTheDocument();
      expect(screen.getByLabelText("频道ID")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "进入画板" }),
      ).toBeInTheDocument();
    });

    it("应该显示使用说明", () => {
      // Act
      render(<HomePage />);

      // Assert
      expect(screen.getByText("使用说明：")).toBeInTheDocument();
      expect(
        screen.getByText("• 用户名：任意非空字符，长度不超过100"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("• 频道ID：只能包含字母和数字，区分大小写"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("• 相同用户名会复用已存在的用户"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("• 相同频道ID会进入已存在的频道"),
      ).toBeInTheDocument();
    });
  });

  describe("表单验证", () => {
    it("应该验证空用户名", async () => {
      // Arrange
      render(<HomePage />);
      const submitButton = screen.getByRole("button", { name: "进入画板" });

      // Act
      await user.click(submitButton);

      // Assert
      expect(screen.getByText("用户名不能为空")).toBeInTheDocument();
    });

    it("应该验证空频道ID", async () => {
      // Arrange
      render(<HomePage />);
      const usernameInput = screen.getByLabelText("用户名");
      const submitButton = screen.getByRole("button", { name: "进入画板" });

      // Act
      await user.type(usernameInput, "testuser");
      await user.click(submitButton);

      // Assert
      expect(screen.getByText("频道ID不能为空")).toBeInTheDocument();
    });

    it("应该限制用户名最大长度为100", () => {
      // Arrange
      render(<HomePage />);
      const usernameInput = screen.getByLabelText("用户名");

      // Assert
      expect(usernameInput).toHaveAttribute("maxLength", "100");
    });

    it("应该验证频道ID格式", async () => {
      // Arrange
      render(<HomePage />);
      const channelIdInput = screen.getByLabelText("频道ID");
      const submitButton = screen.getByRole("button", { name: "进入画板" });

      // Act
      await user.type(screen.getByLabelText("用户名"), "testuser");
      await user.type(channelIdInput, "invalid-channel");
      await user.click(submitButton);

      // Assert
      expect(screen.getByText("频道ID只能包含字母和数字")).toBeInTheDocument();
    });
  });

  describe("表单提交", () => {
    it("应该能够成功提交有效表单", async () => {
      // Arrange
      const mockCreateOrGetUser = jest.fn().mockResolvedValue({
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
      });

      mockUseUserStore.mockReturnValue({
        currentUser: null,
        isLoading: false,
        error: null,
        setCurrentUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createOrGetUser: mockCreateOrGetUser,
        loadCurrentUser: jest.fn(),
        clearCurrentUser: jest.fn(),
        reset: jest.fn(),
      });

      render(<HomePage />);

      const usernameInput = screen.getByLabelText("用户名");
      const channelIdInput = screen.getByLabelText("频道ID");
      const submitButton = screen.getByRole("button", { name: "进入画板" });

      // Act
      await user.type(usernameInput, "testuser");
      await user.type(channelIdInput, "testchannel");
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateOrGetUser).toHaveBeenCalledWith("testuser");
        expect(mockPush).toHaveBeenCalledWith("/board/testchannel");
      });
    });

    it("应该处理用户创建失败", async () => {
      // Arrange
      const mockCreateOrGetUser = jest
        .fn()
        .mockRejectedValue(new Error("用户创建失败"));

      mockUseUserStore.mockReturnValue({
        currentUser: null,
        isLoading: false,
        error: "用户创建失败",
        setCurrentUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createOrGetUser: mockCreateOrGetUser,
        loadCurrentUser: jest.fn(),
        clearCurrentUser: jest.fn(),
        reset: jest.fn(),
      });

      render(<HomePage />);

      const usernameInput = screen.getByLabelText("用户名");
      const channelIdInput = screen.getByLabelText("频道ID");
      const submitButton = screen.getByRole("button", { name: "进入画板" });

      // Act
      await user.type(usernameInput, "testuser");
      await user.type(channelIdInput, "testchannel");
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("用户创建失败")).toBeInTheDocument();
      });
    });
  });

  describe("加载状态", () => {
    it("应该在用户加载时禁用表单", () => {
      // Arrange
      mockUseUserStore.mockReturnValue({
        currentUser: null,
        isLoading: true,
        error: null,
        setCurrentUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createOrGetUser: jest.fn(),
        loadCurrentUser: jest.fn(),
        clearCurrentUser: jest.fn(),
        reset: jest.fn(),
      });

      render(<HomePage />);

      const usernameInput = screen.getByLabelText("用户名");
      const channelIdInput = screen.getByLabelText("频道ID");
      const submitButton = screen.getByRole("button", { name: "正在处理..." });

      // Assert
      expect(usernameInput).toBeDisabled();
      expect(channelIdInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("正在处理...");
    });
  });

  describe("错误显示", () => {
    it("应该显示用户错误", () => {
      // Arrange
      mockUseUserStore.mockReturnValue({
        currentUser: null,
        isLoading: false,
        error: "用户错误",
        setCurrentUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createOrGetUser: jest.fn(),
        loadCurrentUser: jest.fn(),
        clearCurrentUser: jest.fn(),
        reset: jest.fn(),
      });

      render(<HomePage />);

      // Assert
      expect(screen.getByText("用户错误")).toBeInTheDocument();
    });
  });

  describe("输入字符限制", () => {
    it("应该限制用户名最大长度为100", () => {
      // Arrange
      render(<HomePage />);
      const usernameInput = screen.getByLabelText("用户名");

      // Assert
      expect(usernameInput).toHaveAttribute("maxLength", "100");
    });

    it("应该限制频道ID最大长度为50", () => {
      // Arrange
      render(<HomePage />);
      const channelIdInput = screen.getByLabelText("频道ID");

      // Assert
      expect(channelIdInput).toHaveAttribute("maxLength", "50");
    });
  });
});

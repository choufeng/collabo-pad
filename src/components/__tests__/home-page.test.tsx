/**
 * 首页面组件测试
 * 遵循 TDD 原则：先写测试，再写实现
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomePage } from "../home-page";
import { useUserStore } from "../../stores/user-store";
import { useChannelStore } from "../../stores/channel-store";
import { useRouter } from "next/navigation";

// Mock 状态管理
jest.mock("../../stores/user-store");
jest.mock("../../stores/channel-store");

// Mock 路由
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseUserStore = useUserStore as jest.MockedFunction<
  typeof useUserStore
>;
const mockUseChannelStore = useChannelStore as jest.MockedFunction<
  typeof useChannelStore
>;
const mockPush = jest.fn();

describe("HomePage 组件", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 设置默认的 mock 返回值
    mockUseUserStore.mockReturnValue({
      currentUser: null,
      isLoading: false,
      error: null,
      setCurrentUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      createOrUpdateUser: jest.fn(),
      loadCurrentUser: jest.fn(),
      clearCurrentUser: jest.fn(),
      reset: jest.fn(),
    });

    mockUseChannelStore.mockReturnValue({
      currentChannel: null,
      userChannels: [],
      isLoading: false,
      error: null,
      setCurrentChannel: jest.fn(),
      setUserChannels: jest.fn(),
      addChannel: jest.fn(),
      removeChannel: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      createChannel: jest.fn(),
      loadUserChannels: jest.fn(),
      switchChannel: jest.fn(),
      updateChannel: jest.fn(),
      reset: jest.fn(),
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    } as any);
  });

  describe("页面渲染", () => {
    it("应该渲染页面标题", () => {
      // Act
      render(<HomePage />);

      // Assert
      expect(screen.getByText("协作画板")).toBeInTheDocument();
    });

    it("应该渲染用户名输入框", () => {
      // Act
      render(<HomePage />);

      // Assert
      const usernameInput = screen.getByLabelText("用户名");
      expect(usernameInput).toBeInTheDocument();
      expect(usernameInput).toHaveAttribute("type", "text");
    });

    it("应该渲染频道ID输入框", () => {
      // Act
      render(<HomePage />);

      // Assert
      const channelIdInput = screen.getByLabelText("频道ID");
      expect(channelIdInput).toBeInTheDocument();
      expect(channelIdInput).toHaveAttribute("type", "text");
    });

    it("应该渲染提交按钮", () => {
      // Act
      render(<HomePage />);

      // Assert
      const submitButton = screen.getByRole("button", { name: "进入画板" });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });
  });

  describe("表单交互", () => {
    it("应该允许输入用户名", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<HomePage />);

      const usernameInput = screen.getByLabelText("用户名");

      // Act
      await user.type(usernameInput, "testuser");

      // Assert
      expect(usernameInput).toHaveValue("testuser");
    });

    it("应该允许输入频道ID", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<HomePage />);

      const channelIdInput = screen.getByLabelText("频道ID");

      // Act
      await user.type(channelIdInput, "test-channel");

      // Assert
      expect(channelIdInput).toHaveValue("test-channel");
    });

    it("应该显示用户名验证错误", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<HomePage />);

      const submitButton = screen.getByRole("button", { name: "进入画板" });

      // Act
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("用户名不能为空")).toBeInTheDocument();
      });
    });

    it("应该显示频道ID验证错误", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<HomePage />);

      const usernameInput = screen.getByLabelText("用户名");
      const submitButton = screen.getByRole("button", { name: "进入画板" });

      // Act
      await user.type(usernameInput, "testuser");
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("频道ID不能为空")).toBeInTheDocument();
      });
    });

    it("应该显示频道ID格式验证错误", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<HomePage />);

      const usernameInput = screen.getByLabelText("用户名");
      const channelIdInput = screen.getByLabelText("频道ID");
      const submitButton = screen.getByRole("button", { name: "进入画板" });

      // Act
      await user.type(usernameInput, "testuser");
      await user.type(channelIdInput, "invalid channel!@#");
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("频道ID只能包含字母和数字"),
        ).toBeInTheDocument();
      });
    });

    it("应该在验证通过后提交表单", async () => {
      // Arrange
      const mockCreateUser = jest.fn().mockResolvedValue({
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockCreateChannel = jest.fn().mockResolvedValue({
        id: "testchannel",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUseUserStore.mockReturnValue({
        currentUser: null,
        isLoading: false,
        error: null,
        setCurrentUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createOrUpdateUser: mockCreateUser,
        loadCurrentUser: jest.fn(),
        clearCurrentUser: jest.fn(),
        reset: jest.fn(),
      });

      mockUseChannelStore.mockReturnValue({
        currentChannel: null,
        userChannels: [],
        isLoading: false,
        error: null,
        setCurrentChannel: jest.fn(),
        setUserChannels: jest.fn(),
        addChannel: jest.fn(),
        removeChannel: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createChannel: mockCreateChannel,
        loadUserChannels: jest.fn(),
        switchChannel: jest.fn(),
        updateChannel: jest.fn(),
        reset: jest.fn(),
      });

      const user = userEvent.setup();
      render(<HomePage />);

      const usernameInput = screen.getByLabelText("用户名");
      const channelIdInput = screen.getByLabelText("频道ID");
      const submitButton = screen.getByRole("button", {
        name: /进入画板|正在处理/,
      });

      // Act
      await user.clear(usernameInput);
      await user.type(usernameInput, "testuser");

      await user.clear(channelIdInput);
      await user.type(channelIdInput, "testchannel");
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith({ username: "testuser" });
        expect(mockCreateChannel).toHaveBeenCalledWith({
          id: "testchannel",
          userId: "user-123",
        });
        expect(mockPush).toHaveBeenCalledWith("/board/testchannel");
      });
    });
  });

  describe("加载状态", () => {
    it("应该在加载时禁用表单", () => {
      // Arrange
      mockUseUserStore.mockReturnValue({
        currentUser: null,
        isLoading: true,
        error: null,
        setCurrentUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createOrUpdateUser: jest.fn(),
        loadCurrentUser: jest.fn(),
        clearCurrentUser: jest.fn(),
        reset: jest.fn(),
      });

      render(<HomePage />);

      // Assert
      const usernameInput = screen.getByLabelText("用户名");
      const channelIdInput = screen.getByLabelText("频道ID");
      const submitButton = screen.getByRole("button", {
        name: /进入画板|正在处理/,
      });

      expect(usernameInput).toBeDisabled();
      expect(channelIdInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("正在处理...")).toBeInTheDocument();
    });
  });

  describe("错误处理", () => {
    it("应该显示用户创建错误", () => {
      // Arrange
      mockUseUserStore.mockReturnValue({
        currentUser: null,
        isLoading: false,
        error: "用户创建失败",
        setCurrentUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createOrUpdateUser: jest.fn(),
        loadCurrentUser: jest.fn(),
        clearCurrentUser: jest.fn(),
        reset: jest.fn(),
      });

      render(<HomePage />);

      // Assert
      expect(screen.getByText("用户创建失败")).toBeInTheDocument();
    });

    it("应该显示频道创建错误", () => {
      // Arrange
      mockUseChannelStore.mockReturnValue({
        currentChannel: null,
        userChannels: [],
        isLoading: false,
        error: "频道创建失败",
        setCurrentChannel: jest.fn(),
        setUserChannels: jest.fn(),
        addChannel: jest.fn(),
        removeChannel: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createChannel: jest.fn(),
        loadUserChannels: jest.fn(),
        switchChannel: jest.fn(),
        updateChannel: jest.fn(),
        reset: jest.fn(),
      });

      render(<HomePage />);

      // Assert
      expect(screen.getByText("频道创建失败")).toBeInTheDocument();
    });
  });
});

/**
 * 频道状态管理测试
 * 遵循 TDD 原则：先写测试，再写实现
 */

import { act, renderHook } from "@testing-library/react";
import { useChannelStore } from "../channel-store";
import { databaseService } from "../../database/database-service";

// Mock 数据库服务
jest.mock("../../database/database-service");
const mockDatabaseService = databaseService as jest.Mocked<
  typeof databaseService
>;

// Mock 用户状态
jest.mock("../user-store", () => ({
  useUserStore: () => ({
    currentUser: {
      id: "user-123",
      username: "testuser",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }),
}));

describe("频道状态管理", () => {
  beforeEach(() => {
    // 重置所有状态和 mock
    jest.clearAllMocks();
    // 重置 Zustand 状态
    useChannelStore.getState().reset();
  });

  describe("初始状态", () => {
    it("应该有正确的初始状态", () => {
      // Act
      const { result } = renderHook(() => useChannelStore());

      // Assert
      expect(result.current.currentChannel).toBeNull();
      expect(result.current.userChannels).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("状态设置操作", () => {
    it("应该能够设置当前频道", () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const mockChannel = {
        id: "channel-123",
        name: "测试频道",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      act(() => {
        result.current.setCurrentChannel(mockChannel);
      });

      // Assert
      expect(result.current.currentChannel).toEqual(mockChannel);
    });

    it("应该能够设置用户频道列表", () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const mockChannels = [
        {
          id: "channel-1",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "channel-2",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Act
      act(() => {
        result.current.setUserChannels(mockChannels);
      });

      // Assert
      expect(result.current.userChannels).toEqual(mockChannels);
    });

    it("应该能够添加频道到列表", () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const existingChannel = {
        id: "channel-1",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newChannel = {
        id: "channel-2",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 先设置一个频道
      act(() => {
        result.current.setUserChannels([existingChannel]);
      });

      // Act
      act(() => {
        result.current.addChannel(newChannel);
      });

      // Assert
      expect(result.current.userChannels).toHaveLength(2);
      expect(result.current.userChannels).toContainEqual(existingChannel);
      expect(result.current.userChannels).toContainEqual(newChannel);
    });

    it("应该能够从列表移除频道", () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channel1 = {
        id: "channel-1",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const channel2 = {
        id: "channel-2",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 先设置两个频道
      act(() => {
        result.current.setUserChannels([channel1, channel2]);
      });

      // Act
      act(() => {
        result.current.removeChannel("channel-1");
      });

      // Assert
      expect(result.current.userChannels).toHaveLength(1);
      expect(result.current.userChannels).toContainEqual(channel2);
      expect(result.current.userChannels).not.toContainEqual(channel1);
    });
  });

  describe("异步频道操作", () => {
    const mockUserId = "user-123";

    it("应该能够创建新频道", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channelData = {
        id: "test-channel",
        name: "测试频道",
        userId: mockUserId,
      };
      const expectedChannel = {
        id: "test-channel",
        name: "测试频道",
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.createChannel.mockResolvedValue(expectedChannel);

      // Act
      await act(async () => {
        await result.current.createChannel(channelData);
      });

      // Assert
      expect(mockDatabaseService.createChannel).toHaveBeenCalledWith(
        channelData,
      );
      expect(result.current.currentChannel).toEqual(expectedChannel);
      expect(result.current.userChannels).toContainEqual(expectedChannel);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("应该处理频道创建失败", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channelData = {
        id: "test-channel",
        userId: mockUserId,
      };
      const error = new Error("频道创建失败");

      mockDatabaseService.createChannel.mockRejectedValue(error);

      // Act
      await act(async () => {
        try {
          await result.current.createChannel(channelData);
        } catch (err) {
          // 预期会抛出错误
        }
      });

      // Assert
      expect(result.current.currentChannel).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(error.message);
    });

    it("应该能够加载用户的所有频道", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const mockChannels = [
        {
          id: "channel-1",
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "channel-2",
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDatabaseService.getChannelsByUser.mockResolvedValue(mockChannels);

      // Act
      await act(async () => {
        await result.current.loadUserChannels(mockUserId);
      });

      // Assert
      expect(mockDatabaseService.getChannelsByUser).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(result.current.userChannels).toEqual(mockChannels);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("应该能够切换频道", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channel1 = {
        id: "channel-1",
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const channel2 = {
        id: "channel-2",
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 先设置频道
      act(() => {
        result.current.setUserChannels([channel1, channel2]);
        result.current.setCurrentChannel(channel1);
      });

      mockDatabaseService.updateUserSession.mockResolvedValue({
        id: "current_session",
        currentUserId: mockUserId,
        currentChannelId: "channel-2",
        lastActiveAt: new Date(),
      });

      // Act
      await act(async () => {
        await result.current.switchChannel("channel-2");
      });

      // Assert
      expect(result.current.currentChannel).toEqual(channel2);
      expect(mockDatabaseService.updateUserSession).toHaveBeenCalledWith({
        currentChannelId: "channel-2",
      });
    });

    it("应该切换到不存在的频道时抛出错误", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());

      // Act & Assert
      await act(async () => {
        await expect(
          result.current.switchChannel("non-existent-channel"),
        ).rejects.toThrow("频道不存在");
      });
    });
  });

  describe("持久化同步", () => {
    it("应该在频道状态变化时更新数据库会话", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const mockChannel = {
        id: "channel-123",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.updateUserSession.mockResolvedValue({
        id: "current_session",
        currentUserId: "user-123",
        currentChannelId: "channel-123",
        lastActiveAt: new Date(),
      });

      // Act
      await act(async () => {
        result.current.setCurrentChannel(mockChannel);
      });

      // 等待防抖时间
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Assert
      expect(mockDatabaseService.updateUserSession).toHaveBeenCalledWith({
        currentChannelId: "channel-123",
      });
    });
  });
});

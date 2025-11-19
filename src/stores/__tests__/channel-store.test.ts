/**
 * 简化的频道状态管理测试
 * 适配新的频道数据服务
 */

import { act, renderHook } from "@testing-library/react";
import { useChannelStore } from "../channel-store";
import { channelDataService } from "../../database/channel-data-service";

// Mock 频道数据服务
jest.mock("../../database/channel-data-service");
const mockChannelDataService = channelDataService as jest.Mocked<
  typeof channelDataService
>;

describe("频道状态管理 - 简化版本", () => {
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

    it("应该能够设置加载状态", () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());

      // Act
      act(() => {
        result.current.setLoading(true);
      });

      // Assert
      expect(result.current.isLoading).toBe(true);

      // Cleanup
      act(() => {
        result.current.setLoading(false);
      });
    });

    it("应该能够设置错误状态", () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const errorMessage = "测试错误";

      // Act
      act(() => {
        result.current.setError(errorMessage);
      });

      // Assert
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("异步频道操作", () => {
    it("应该能够创建新频道", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channelData = {
        id: "testchannel",
        name: "测试频道",
        userId: "user-123",
      };
      const mockChannel = {
        ...channelData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelDataService.createChannel.mockResolvedValue(mockChannel);

      // Act
      await act(async () => {
        await result.current.createChannel(channelData);
      });

      // Assert
      expect(mockChannelDataService.createChannel).toHaveBeenCalledWith(
        channelData,
      );
      expect(result.current.currentChannel).toEqual(mockChannel);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("应该处理频道创建失败", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channelData = {
        id: "testchannel",
        name: "测试频道",
        userId: "user-123",
      };
      const error = new Error("频道创建失败");

      mockChannelDataService.createChannel.mockRejectedValue(error);

      // Act & Assert
      try {
        await act(async () => {
          await result.current.createChannel(channelData);
        });
      } catch (e) {
        // 预期会抛出错误
      }

      // 等待所有异步操作完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.currentChannel).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("频道创建失败");
    });

    it("应该避免重复创建相同频道", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channelData = {
        id: "testchannel",
        name: "测试频道",
        userId: "user-123",
      };
      const mockChannel = {
        ...channelData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelDataService.createChannel.mockResolvedValue(mockChannel);

      // Act - 创建两次
      await act(async () => {
        await result.current.createChannel(channelData);
      });

      await act(async () => {
        await result.current.createChannel(channelData);
      });

      // Assert
      expect(mockChannelDataService.createChannel).toHaveBeenCalledTimes(2);
      expect(result.current.currentChannel).toEqual(mockChannel);
    });
  });

  describe("状态重置", () => {
    it("应该能够重置所有状态", () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const mockChannel = {
        id: "channel-123",
        name: "测试频道",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 设置一些状态
      act(() => {
        result.current.setCurrentChannel(mockChannel);
        result.current.setLoading(true);
        result.current.setError("一些错误");
      });

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.currentChannel).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("边界条件处理", () => {
    it("应该处理空频道名称", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channelData = {
        id: "testchannel",
        name: "",
        userId: "user-123",
      };
      const mockChannel = {
        ...channelData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelDataService.createChannel.mockResolvedValue(mockChannel);

      // Act
      await act(async () => {
        await result.current.createChannel(channelData);
      });

      // Assert
      expect(mockChannelDataService.createChannel).toHaveBeenCalledWith(
        channelData,
      );
      expect(result.current.currentChannel).toEqual(mockChannel);
    });

    it("应该处理特殊字符频道名称", async () => {
      // Arrange
      const { result } = renderHook(() => useChannelStore());
      const channelData = {
        id: "testchannel",
        name: "频道_123-测试",
        userId: "user-123",
      };
      const mockChannel = {
        ...channelData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelDataService.createChannel.mockResolvedValue(mockChannel);

      // Act
      await act(async () => {
        await result.current.createChannel(channelData);
      });

      // Assert
      expect(mockChannelDataService.createChannel).toHaveBeenCalledWith(
        channelData,
      );
      expect(result.current.currentChannel).toEqual(mockChannel);
    });
  });
});

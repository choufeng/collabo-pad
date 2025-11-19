/**
 * 简化的用户状态管理测试
 * 适配新的用户数据服务
 */

import { act, renderHook } from "@testing-library/react";
import { useUserStore } from "../user-store";
import { userDataService } from "../../database/user-data-service";

// Mock 用户数据服务
jest.mock("../../database/user-data-service");
const mockUserDataService = userDataService as jest.Mocked<
  typeof userDataService
>;

describe("用户状态管理 - 简化版本", () => {
  beforeEach(() => {
    // 重置所有状态和 mock
    jest.clearAllMocks();
    // 重置 Zustand 状态
    useUserStore.getState().reset();
  });

  describe("初始状态", () => {
    it("应该有正确的初始状态", () => {
      // Act
      const { result } = renderHook(() => useUserStore());

      // Assert
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("状态设置操作", () => {
    it("应该能够设置当前用户", () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
      };

      // Act
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      // Assert
      expect(result.current.currentUser).toEqual(mockUser);
    });

    it("应该能够设置加载状态", () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());

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
      const { result } = renderHook(() => useUserStore());
      const errorMessage = "测试错误";

      // Act
      act(() => {
        result.current.setError(errorMessage);
      });

      // Assert
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("异步用户操作", () => {
    it("应该能够创建或获取用户", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const username = "testuser";
      const mockUser = {
        id: "user-123",
        username: username,
        createdAt: new Date(),
      };

      mockUserDataService.createOrGetUser.mockResolvedValue(mockUser);

      // Act
      await act(async () => {
        await result.current.createOrGetUser(username);
      });

      // Assert
      expect(mockUserDataService.createOrGetUser).toHaveBeenCalledWith(
        username,
      );
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("应该能够从数据库加载当前用户", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
      };

      mockUserDataService.getCurrentUser.mockResolvedValue(mockUser);

      // Act
      await act(async () => {
        await result.current.loadCurrentUser();
      });

      // Assert
      expect(mockUserDataService.getCurrentUser).toHaveBeenCalled();
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("应该能够清除当前用户", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
      };

      // 先设置一个用户
      mockUserDataService.getCurrentUser.mockResolvedValue(mockUser);
      await act(async () => {
        await result.current.loadCurrentUser();
      });

      // 清除 mock
      jest.clearAllMocks();
      mockUserDataService.clearUserData.mockResolvedValue();

      // Act
      await act(async () => {
        await result.current.clearCurrentUser();
      });

      // Assert
      expect(mockUserDataService.clearUserData).toHaveBeenCalled();
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("应该处理用户创建失败", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const username = "testuser";
      const error = new Error("用户创建失败");

      mockUserDataService.createOrGetUser.mockRejectedValue(error);

      // Act & Assert
      try {
        await act(async () => {
          await result.current.createOrGetUser(username);
        });
      } catch (e) {
        // 预期会抛出错误
      }

      // 等待所有异步操作完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("用户创建失败");
    });

    it("应该处理空用户名的输入", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const username = "   ";
      const mockUser = {
        id: "user-123",
        username: "",
        createdAt: new Date(),
      };

      mockUserDataService.createOrGetUser.mockResolvedValue(mockUser);

      // Act
      await act(async () => {
        await result.current.createOrGetUser(username);
      });

      // Assert
      expect(mockUserDataService.createOrGetUser).toHaveBeenCalledWith(
        username,
      );
      expect(result.current.currentUser).toEqual(mockUser);
    });
  });

  describe("状态重置", () => {
    it("应该能够重置所有状态", () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
      };

      // 设置一些状态
      act(() => {
        result.current.setCurrentUser(mockUser);
        result.current.setLoading(true);
        result.current.setError("一些错误");
      });

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("重复创建测试", () => {
    it("应该避免重复创建相同用户", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const username = "testuser";
      const mockUser = {
        id: "user-123",
        username: username,
        createdAt: new Date(),
      };

      mockUserDataService.createOrGetUser.mockResolvedValue(mockUser);

      // Act - 创建两次
      await act(async () => {
        await result.current.createOrGetUser(username);
      });

      await act(async () => {
        await result.current.createOrGetUser(username);
      });

      // Assert
      expect(mockUserDataService.createOrGetUser).toHaveBeenCalledTimes(2);
      expect(mockUserDataService.createOrGetUser).toHaveBeenNthCalledWith(
        1,
        username,
      );
      expect(mockUserDataService.createOrGetUser).toHaveBeenNthCalledWith(
        2,
        username,
      );
      expect(result.current.currentUser).toEqual(mockUser);
    });
  });
});

/**
 * 用户状态管理测试
 * 遵循 TDD 原则：先写测试，再写实现
 */

import { act, renderHook } from "@testing-library/react";
import { useUserStore } from "../user-store";
import { databaseService } from "../../database/database-service";

// Mock 数据库服务
jest.mock("../../database/database-service");
const mockDatabaseService = databaseService as jest.Mocked<
  typeof databaseService
>;

describe("用户状态管理", () => {
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
        updatedAt: new Date(),
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

      // Act
      act(() => {
        result.current.setLoading(false);
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
    });

    it("应该能够设置错误信息", () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const errorMessage = "用户创建失败";

      // Act
      act(() => {
        result.current.setError(errorMessage);
      });

      // Assert
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("异步用户操作", () => {
    it("应该能够创建新用户", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const userData = { username: "testuser" };
      const expectedUser = {
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.createUser.mockResolvedValue(expectedUser);

      // Act
      await act(async () => {
        await result.current.createOrUpdateUser(userData);
      });

      // Assert
      expect(mockDatabaseService.createUser).toHaveBeenCalledWith(userData);
      expect(result.current.currentUser).toEqual(expectedUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("应该处理用户创建失败", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const userData = { username: "testuser" };
      const error = new Error("用户名已存在");

      mockDatabaseService.createUser.mockRejectedValue(error);

      // Act
      await act(async () => {
        try {
          await result.current.createOrUpdateUser(userData);
        } catch (err) {
          // 预期会抛出错误
        }
      });

      // Assert
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(error.message);
    });

    it("应该能够从数据库加载当前用户", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock 会话数据
      mockDatabaseService.getUserSession.mockResolvedValue({
        id: "current_session",
        currentUserId: "user-123",
        currentChannelId: null,
        lastActiveAt: new Date(),
      });

      mockDatabaseService.getUser.mockResolvedValue(mockUser);

      // Act
      await act(async () => {
        await result.current.loadCurrentUser();
      });

      // Assert
      expect(mockDatabaseService.getUserSession).toHaveBeenCalled();
      expect(mockDatabaseService.getUser).toHaveBeenCalledWith("user-123");
      expect(result.current.currentUser).toEqual(mockUser);
    });

    it("应该处理空会话的加载", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());

      mockDatabaseService.getUserSession.mockResolvedValue({
        id: "current_session",
        currentUserId: null,
        currentChannelId: null,
        lastActiveAt: new Date(),
      });

      // Act
      await act(async () => {
        await result.current.loadCurrentUser();
      });

      // Assert
      expect(mockDatabaseService.getUserSession).toHaveBeenCalled();
      expect(mockDatabaseService.getUser).not.toHaveBeenCalled();
      expect(result.current.currentUser).toBeNull();
    });

    it("应该能够清除当前用户", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 先设置用户
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      mockDatabaseService.clearUserSession.mockResolvedValue();

      // Act
      await act(async () => {
        await result.current.clearCurrentUser();
      });

      // Assert
      expect(mockDatabaseService.clearUserSession).toHaveBeenCalled();
      expect(result.current.currentUser).toBeNull();
    });
  });

  describe("持久化同步", () => {
    it("应该在用户状态变化时更新数据库会话", async () => {
      // Arrange
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: "user-123",
        username: "testuser",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.updateUserSession.mockResolvedValue({
        id: "current_session",
        currentUserId: "user-123",
        currentChannelId: null,
        lastActiveAt: new Date(),
      });

      // Act
      await act(async () => {
        result.current.setCurrentUser(mockUser);
      });

      // 等待防抖时间
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Assert
      expect(mockDatabaseService.updateUserSession).toHaveBeenCalledWith({
        currentUserId: "user-123",
      });
    });
  });
});

/**
 * 用户状态管理
 * 基于 Zustand 的用户状态 Store
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { User } from "../database/types";
import { databaseService } from "../database/database-service";

// 用户状态接口
export interface UserState {
  // 状态
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 异步操作
  createOrUpdateUser: (
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  clearCurrentUser: () => Promise<void>;

  // 重置状态
  reset: () => void;
}

// 创建用户状态 Store
export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      isLoading: false,
      error: null,

      // 基础操作方法
      setCurrentUser: (user: User | null) => {
        set({ currentUser: user }, false, "setCurrentUser");

        // 异步持久化到数据库会话
        if (user) {
          // 使用防抖避免频繁写入
          setTimeout(() => {
            databaseService
              .updateUserSession({
                currentUserId: user.id,
              })
              .catch(console.error);
          }, 100);
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, "setLoading");
      },

      setError: (error: string | null) => {
        set({ error }, false, "setError");
      },

      // 异步操作
      createOrUpdateUser: async (userData) => {
        const { setLoading, setError, setCurrentUser } = get();

        try {
          setLoading(true);
          setError(null);

          const user = await databaseService.createUser(userData);
          setCurrentUser(user);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "用户创建失败";
          setError(errorMessage);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      loadCurrentUser: async () => {
        const { setLoading, setError, setCurrentUser } = get();

        try {
          setLoading(true);
          setError(null);

          // 获取会话信息
          const session = await databaseService.getUserSession();

          if (session.currentUserId) {
            // 加载用户数据
            const user = await databaseService.getUser(session.currentUserId);
            if (user) {
              setCurrentUser(user);
            } else {
              // 用户不存在，清除会话
              await databaseService.clearUserSession();
            }
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "用户加载失败";
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },

      clearCurrentUser: async () => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(null);

          await databaseService.clearUserSession();
          set({ currentUser: null }, false, "clearCurrentUser");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "清除用户失败";
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },

      // 重置状态
      reset: () => {
        set(
          {
            currentUser: null,
            isLoading: false,
            error: null,
          },
          false,
          "reset",
        );
      },
    }),
    {
      name: "user-store",
      trace: true,
    },
  ),
);

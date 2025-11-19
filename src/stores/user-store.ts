/**
 * 用户状态管理
 * 基于 Zustand 和简化用户数据服务的用户状态 Store
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { User } from "../database/types";
import { userDataService } from "../database/user-data-service";

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
  createOrGetUser: (username: string) => Promise<void>;
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
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, "setLoading");
      },

      setError: (error: string | null) => {
        set({ error }, false, "setError");
      },

      // 异步操作
      createOrGetUser: async (username: string) => {
        const { setLoading, setError, setCurrentUser } = get();

        try {
          setLoading(true);
          setError(null);

          const user = await userDataService.createOrGetUser(username);
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

          const user = await userDataService.getCurrentUser();
          setCurrentUser(user);
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

          await userDataService.clearUserData();
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

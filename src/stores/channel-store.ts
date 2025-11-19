/**
 * 频道状态管理
 * 基于 Zustand 的频道状态 Store
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Channel } from "../database/types";
import { channelDataService } from "../database/channel-data-service";

// 简化的频道状态接口
export interface ChannelState {
  // 状态
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  setCurrentChannel: (channel: Channel | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 异步操作
  createChannel: (
    channelData: Omit<Channel, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;

  // 重置状态
  reset: () => void;
}

// 创建简化的频道状态 Store
export const useChannelStore = create<ChannelState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      currentChannel: null,
      isLoading: false,
      error: null,

      // 基础操作方法
      setCurrentChannel: (channel: Channel | null) => {
        set({ currentChannel: channel }, false, "setCurrentChannel");
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, "setLoading");
      },

      setError: (error: string | null) => {
        set({ error }, false, "setError");
      },

      // 异步操作
      createChannel: async (channelData) => {
        const { setLoading, setError, setCurrentChannel } = get();

        try {
          setLoading(true);
          setError(null);

          const channel = await channelDataService.createChannel(channelData);
          setCurrentChannel(channel);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "频道创建失败";
          setError(errorMessage);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // 重置状态
      reset: () => {
        set(
          {
            currentChannel: null,
            isLoading: false,
            error: null,
          },
          false,
          "reset",
        );
      },
    }),
    {
      name: "channel-store",
      trace: true,
    },
  ),
);

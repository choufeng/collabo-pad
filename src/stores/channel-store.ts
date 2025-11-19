/**
 * 频道状态管理
 * 基于 Zustand 的频道状态 Store
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Channel } from "../database/types";
import { databaseService } from "../database/database-service";

// 频道状态接口
export interface ChannelState {
  // 状态
  currentChannel: Channel | null;
  userChannels: Channel[];
  isLoading: boolean;
  error: string | null;

  // 操作方法
  setCurrentChannel: (channel: Channel | null) => void;
  setUserChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  removeChannel: (channelId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 异步操作
  createChannel: (
    channelData: Omit<Channel, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  loadUserChannels: (userId: string) => Promise<void>;
  switchChannel: (channelId: string) => Promise<void>;
  updateChannel: (
    channelId: string,
    updates: Partial<Channel>,
  ) => Promise<void>;

  // 重置状态
  reset: () => void;
}

// 创建频道状态 Store
export const useChannelStore = create<ChannelState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      currentChannel: null,
      userChannels: [],
      isLoading: false,
      error: null,

      // 基础操作方法
      setCurrentChannel: (channel: Channel | null) => {
        set({ currentChannel: channel }, false, "setCurrentChannel");

        // 异步持久化到数据库会话
        if (channel) {
          // 使用防抖避免频繁写入
          setTimeout(() => {
            databaseService
              .updateUserSession({
                currentChannelId: channel.id,
              })
              .catch(console.error);
          }, 100);
        }
      },

      setUserChannels: (channels: Channel[]) => {
        set({ userChannels: channels }, false, "setUserChannels");
      },

      addChannel: (channel: Channel) => {
        const { userChannels } = get();
        const exists = userChannels.some((c) => c.id === channel.id);

        if (!exists) {
          set(
            { userChannels: [...userChannels, channel] },
            false,
            "addChannel",
          );
        }
      },

      removeChannel: (channelId: string) => {
        const { userChannels, currentChannel } = get();
        const filteredChannels = userChannels.filter((c) => c.id !== channelId);

        set(
          {
            userChannels: filteredChannels,
            // 如果移除的是当前频道，清除当前频道
            currentChannel:
              currentChannel?.id === channelId ? null : currentChannel,
          },
          false,
          "removeChannel",
        );
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, "setLoading");
      },

      setError: (error: string | null) => {
        set({ error }, false, "setError");
      },

      // 异步操作
      createChannel: async (channelData) => {
        const { setLoading, setError, setCurrentChannel, addChannel } = get();

        try {
          setLoading(true);
          setError(null);

          const channel = await databaseService.createChannel(channelData);
          setCurrentChannel(channel);
          addChannel(channel);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "频道创建失败";
          setError(errorMessage);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      loadUserChannels: async (userId: string) => {
        const { setLoading, setError, setUserChannels } = get();

        try {
          setLoading(true);
          setError(null);

          const channels = await databaseService.getChannelsByUser(userId);
          setUserChannels(channels);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "频道加载失败";
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },

      switchChannel: async (channelId: string) => {
        const { userChannels, setCurrentChannel, setError } = get();

        try {
          // 查找频道
          const channel = userChannels.find((c) => c.id === channelId);

          if (!channel) {
            throw new Error("频道不存在");
          }

          // 更新数据库会话
          await databaseService.updateUserSession({
            currentChannelId: channelId,
          });

          // 更新当前频道
          setCurrentChannel(channel);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "频道切换失败";
          setError(errorMessage);
          throw error;
        }
      },

      updateChannel: async (channelId: string, updates: Partial<Channel>) => {
        const { setLoading, setError, userChannels, setCurrentChannel } = get();

        try {
          setLoading(true);
          setError(null);

          const updatedChannel = await databaseService.updateChannel(
            channelId,
            updates,
          );

          // 更新频道列表
          const updatedChannels = userChannels.map((c) =>
            c.id === channelId ? updatedChannel : c,
          );

          set({ userChannels: updatedChannels }, false, "updateChannel");

          // 如果更新的是当前频道，也更新当前频道
          if (get().currentChannel?.id === channelId) {
            setCurrentChannel(updatedChannel);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "频道更新失败";
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
            userChannels: [],
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

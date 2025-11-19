/**
 * 动态频道画板页面
 * 支持频道ID参数和路由守卫
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Board from "@/components/Board";
import { useUserStore } from "@/stores/user-store";
import { useChannelStore } from "@/stores/channel-store";
import { databaseService } from "@/database/database-service";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params["channel-id"] as string;

  const { currentUser, loadCurrentUser } = useUserStore();
  const { setCurrentChannel, loadUserChannels } = useChannelStore();

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const validateAndInitialize = async () => {
      try {
        setIsValidating(true);
        setValidationError(null);

        // 检查频道ID格式
        if (!channelId || !/^[a-zA-Z0-9]+$/.test(channelId)) {
          setValidationError("无效的频道ID格式");
          router.push("/");
          return;
        }

        // 加载当前用户
        if (!currentUser) {
          await loadCurrentUser();
        }

        // 如果没有用户，重定向到首页
        const session = await databaseService.getUserSession();
        if (!session.currentUserId) {
          router.push("/");
          return;
        }

        // 加载用户频道
        await loadUserChannels(session.currentUserId);

        // 检查频道是否存在且属于当前用户
        const channel = await databaseService.getChannel(channelId);
        if (!channel) {
          setValidationError("频道不存在");
          router.push("/");
          return;
        }

        if (channel.userId !== session.currentUserId) {
          setValidationError("您没有访问此频道的权限");
          router.push("/");
          return;
        }

        // 设置当前频道
        setCurrentChannel(channel);

        // 更新会话中的当前频道
        await databaseService.updateUserSession({
          currentChannelId: channelId,
        });
      } catch (error) {
        console.error("频道验证失败:", error);
        setValidationError("频道验证失败");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } finally {
        setIsValidating(false);
      }
    };

    validateAndInitialize();
  }, [
    channelId,
    currentUser,
    router,
    loadCurrentUser,
    setCurrentChannel,
    loadUserChannels,
  ]);

  // 显示验证状态
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证频道...</p>
        </div>
      </div>
    );
  }

  // 显示验证错误
  if (validationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">访问受限</h2>
          <p className="text-gray-600 mb-4">{validationError}</p>
          <p className="text-sm text-gray-500">正在重定向到首页...</p>
        </div>
      </div>
    );
  }

  // 显示画板
  return <Board />;
}

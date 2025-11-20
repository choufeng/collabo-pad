/**
 * 动态频道画板页面
 * 支持频道ID参数和路由守卫
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Board from "@/components/Board";
import { useUserStore } from "@/stores/user-store";
import { userDataService } from "@/database/user-data-service";
import { useSSETopics } from "@/hooks/use-sse-topics";
import { topicsToFlowElements } from "@/utils/topic-to-node";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params["channel-id"] as string;

  const { currentUser, loadCurrentUser } = useUserStore();

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 使用 SSE Hook 获取实时主题数据
  const {
    topics,
    connectionStatus,
    error: sseError,
    connect,
    disconnect,
    clearError,
  } = useSSETopics({
    channelId,
    maxTopics: 100,
  });

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
        const currentUserData = await userDataService.getCurrentUser();
        if (!currentUserData) {
          router.push("/");
          return;
        }

        // 简化的验证完成，直接显示画板
      } catch (error) {
        console.error("验证失败:", error);
        setValidationError("验证失败");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } finally {
        setIsValidating(false);
      }
    };

    validateAndInitialize();
  }, [channelId, currentUser, router, loadCurrentUser]);

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
  const { nodes, edges } = topicsToFlowElements(topics);

  return (
    <Board
      initialNodes={nodes}
      initialEdges={edges}
      channelId={channelId}
      connectionStatus={connectionStatus}
      sseError={sseError}
      onSSEErrorClear={clearError}
      user={
        currentUser
          ? {
              id: currentUser.id,
              name: currentUser.username,
            }
          : undefined
      }
      channel={{
        id: channelId,
      }}
    />
  );
}

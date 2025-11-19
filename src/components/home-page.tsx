/**
 * 首页面组件
 * 提供用户登录和频道选择功能
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "../stores/user-store";
import { userDataService } from "../database/user-data-service";

// 表单数据接口
interface HomeFormData {
  username: string;
  channelId: string;
}

// 表单错误接口
interface FormErrors {
  username?: string;
  channelId?: string;
}

export function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentUser,
    isLoading: userLoading,
    error: userError,
    createOrGetUser,
  } = useUserStore();

  // 表单状态
  const [formData, setFormData] = useState<HomeFormData>({
    username: "",
    channelId: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 自动填充表单数据
  useEffect(() => {
    const initializeFormData = async () => {
      const urlChannelId = searchParams?.get("channel");

      // 初始化表单数据
      const initialFormData: HomeFormData = {
        username: "",
        channelId: urlChannelId || "",
      };

      // 尝试获取最新Username
      try {
        const latestUsers = await userDataService.getLatestUsers(1);
        if (latestUsers.length > 0) {
          initialFormData.username = latestUsers[0].username;
        }
      } catch (error) {
        console.error("获取最新用户失败:", error);
        // 优雅降级，不影响表单初始化
      }

      setFormData(initialFormData);
    };

    initializeFormData();
  }, [searchParams]);

  // 检查是否已有用户登录，如果有则跳转到画板
  useEffect(() => {
    if (currentUser) {
      // TODO: 从会话中获取当前Channel ID并跳转
      // router.push('/board/default');
    }
  }, [currentUser, router]);

  // 表单验证
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // 验证Username
    if (!formData.username.trim()) {
      errors.username = "Username cannot be empty";
    } else if (formData.username.length > 100) {
      errors.username = "Username cannot exceed 100 characters";
    }

    // 验证Channel ID
    if (!formData.channelId.trim()) {
      errors.channelId = "Channel ID cannot be empty";
    } else if (formData.channelId.length > 50) {
      errors.channelId = "Channel ID cannot exceed 50 characters";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.channelId)) {
      errors.channelId = "Channel ID can only contain letters and numbers";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理输入变化
  const handleInputChange =
    (field: keyof HomeFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // 清除对应字段的错误
      if (formErrors[field]) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 创建或获取用户（新的简化API）
      await createOrGetUser(formData.username.trim());

      // 直接跳转到画板页面，使用URL中的Channel ID
      router.push(`/${formData.channelId.trim()}`);
    } catch (error) {
      console.error("登录失败:", error);
      // 错误已经在状态管理中处理
    } finally {
      setIsSubmitting(false);
    }
  };

  // 计算加载状态
  const isLoading = userLoading || isSubmitting;
  const hasError = userError;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Collaborative Whiteboard
          </h1>
          <p className="text-gray-600">
            Enter username and channel ID to start collaboration
          </p>
        </div>

        {/* 错误提示 */}
        {hasError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{userError}</p>
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username输入 */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleInputChange("username")}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.username ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter username"
              maxLength={100}
            />
            {formErrors.username && (
              <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
            )}
          </div>

          {/* Channel ID输入 */}
          <div>
            <label
              htmlFor="channelId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Channel ID
            </label>
            <input
              type="text"
              id="channelId"
              value={formData.channelId}
              onChange={handleInputChange("channelId")}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.channelId ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter channel ID (letters and numbers)"
              maxLength={50}
            />
            {formErrors.channelId && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.channelId}
              </p>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processing..." : "Enter Whiteboard"}
          </button>
        </form>

        {/* 帮助信息 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Usage:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Username: Any non-empty characters, max 100 length</li>
            <li>• Channel ID: Letters and numbers only, case sensitive</li>
            <li>• Same username will reuse existing user</li>
            <li>• Same channel ID will enter existing channel</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

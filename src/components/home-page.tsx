/**
 * 首页面组件
 * 提供用户登录和频道选择功能
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../stores/user-store";
import { useChannelStore } from "../stores/channel-store";

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
  const {
    currentUser,
    isLoading: userLoading,
    error: userError,
    createOrUpdateUser,
  } = useUserStore();

  const {
    isLoading: channelLoading,
    error: channelError,
    createChannel,
  } = useChannelStore();

  // 表单状态
  const [formData, setFormData] = useState<HomeFormData>({
    username: "",
    channelId: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 检查是否已有用户登录，如果有则跳转到画板
  useEffect(() => {
    if (currentUser) {
      // TODO: 从会话中获取当前频道ID并跳转
      // router.push('/board/default');
    }
  }, [currentUser, router]);

  // 表单验证
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // 验证用户名
    if (!formData.username.trim()) {
      errors.username = "用户名不能为空";
    } else if (formData.username.length > 100) {
      errors.username = "用户名长度不能超过100个字符";
    }

    // 验证频道ID
    if (!formData.channelId.trim()) {
      errors.channelId = "频道ID不能为空";
    } else if (formData.channelId.length > 50) {
      errors.channelId = "频道ID长度不能超过50个字符";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.channelId)) {
      errors.channelId = "频道ID只能包含字母和数字";
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
      // 创建用户
      const user = await createOrUpdateUser({
        username: formData.username.trim(),
      });

      // 创建频道
      const channel = await createChannel({
        id: formData.channelId.trim(),
        userId: user.id,
      });

      // 跳转到画板页面
      router.push(`/board/${channel.id}`);
    } catch (error) {
      console.error("登录失败:", error);
      // 错误已经在状态管理中处理
    } finally {
      setIsSubmitting(false);
    }
  };

  // 计算加载状态
  const isLoading = userLoading || channelLoading || isSubmitting;
  const hasError = userError || channelError;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">协作画板</h1>
          <p className="text-gray-600">输入用户名和频道ID开始协作</p>
        </div>

        {/* 错误提示 */}
        {hasError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{userError || channelError}</p>
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 用户名输入 */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              用户名
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
              placeholder="请输入用户名"
              maxLength={100}
            />
            {formErrors.username && (
              <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
            )}
          </div>

          {/* 频道ID输入 */}
          <div>
            <label
              htmlFor="channelId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              频道ID
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
              placeholder="请输入频道ID（字母和数字）"
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
            {isLoading ? "正在处理..." : "进入画板"}
          </button>
        </form>

        {/* 帮助信息 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">使用说明：</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 用户名：任意非空字符，长度不超过100</li>
            <li>• 频道ID：只能包含字母和数字，区分大小写</li>
            <li>• 相同用户名会复用已存在的用户</li>
            <li>• 相同频道ID会进入已存在的频道</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

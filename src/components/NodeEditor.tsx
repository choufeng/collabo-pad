"use client";

import React, { useState, useEffect } from "react";
import { SidebarMode, NodeData } from "./RightSidebar";
import { createTopicAPI } from "@/lib/topicApi";
import type { CreateTopicRequest } from "@/types/redis-stream";

// 主题详情显示组件的 Props 接口
interface TopicDetailsDisplayProps {
  initialData?: NodeData;
  onCreateChildNode?: (parentId: string, content: string) => void;
  selectedNodeId?: string;
  user?: { id: string; name: string };
  channel?: { id: string };
}

// 主题详情显示组件
const TopicDetailsDisplay: React.FC<TopicDetailsDisplayProps> = ({
  initialData,
  onCreateChildNode,
  selectedNodeId,
  user,
  channel,
}) => {
  // 子节点表单状态
  const [childNodeContent, setChildNodeContent] = useState("");
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [childNodeErrors, setChildNodeErrors] = useState<
    Record<string, string>
  >({});

  // 格式化时间戳
  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return "未知时间";
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  // 子节点表单处理函数
  const handleChildNodeInputChange = (value: string) => {
    setChildNodeContent(value);

    // 清除该字段的错误信息
    if (childNodeErrors.content) {
      setChildNodeErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.content;
        return newErrors;
      });
    }
  };

  const validateChildNodeForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!childNodeContent || !childNodeContent.trim()) {
      newErrors.content = "Child topic content cannot be empty";
    }

    if (childNodeContent && childNodeContent.length > 500) {
      newErrors.content = "Child topic content cannot exceed 500 characters";
    }

    setChildNodeErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateChildNode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateChildNodeForm()) {
      return;
    }

    setIsCreatingChild(true);

    // 调试信息
    console.log("NodeEditor handleCreateChildNode - 调试信息:");
    console.log("  selectedNodeId:", selectedNodeId);
    console.log("  childNodeContent:", childNodeContent);
    console.log("  user:", user);
    console.log("  channel:", channel);

    try {
      if (user && channel) {
        console.log("执行API创建子主题逻辑");
        // 调用API创建子主题
        const requestData: CreateTopicRequest = {
          parent_id: selectedNodeId,
          channel_id: channel.id,
          content: childNodeContent.trim(),
          user_id: user.id,
          user_name: user.name,
        };

        console.log("发送子主题API请求:", requestData);

        const response = await createTopicAPI(requestData);

        console.log("子主题API响应:", response);

        if (response.success) {
          // API调用成功，调用原有回调（如果存在）
          if (onCreateChildNode && selectedNodeId) {
            onCreateChildNode(selectedNodeId, childNodeContent.trim());
          }
          setChildNodeContent(""); // 清空表单
          setChildNodeErrors({});
        } else {
          throw new Error(response.message || "Failed to create child topic");
        }
      } else {
        console.log("执行回退逻辑 - 条件不满足");
        console.log("  !!user:", !!user);
        console.log("  !!channel:", !!channel);
        console.log("  !!onCreateChildNode:", !!onCreateChildNode);

        if (onCreateChildNode && selectedNodeId) {
          // 回退到原有逻辑（兼容性）
          onCreateChildNode(selectedNodeId, childNodeContent.trim());
          setChildNodeContent(""); // 清空表单
          setChildNodeErrors({});
        } else {
          throw new Error("Missing required data for child topic creation");
        }
      }
    } catch (error) {
      console.error("Failed to create child node:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create child topic";
      setChildNodeErrors({
        submit: errorMessage,
      });
    } finally {
      setIsCreatingChild(false);
    }
  };

  if (!initialData) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2">No topic data available</p>
        <p className="text-sm">Please select a valid topic to view details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 主题详情区域 */}
      <div className="space-y-6">
        {/* 用户信息头部 */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {(initialData.user_name || initialData.creator || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {initialData.user_name || initialData.creator || "未知用户"}
              </h3>
              <p className="text-sm text-gray-500">
                {formatTimestamp(initialData.timestamp)}
              </p>
            </div>
          </div>
        </div>

        {/* 主题内容 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Topic Content
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {initialData.content || "No content available"}
            </div>
          </div>
        </div>

        {/* 元数据信息 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Topic Information
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Topic ID:
              </span>
              <span className="text-sm text-gray-800 font-mono">
                {initialData.topicId || selectedNodeId || "Unknown"}
              </span>
            </div>
            {initialData.level !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Level:
                </span>
                <span className="text-sm text-gray-800">
                  {initialData.level === 0
                    ? "Root Topic"
                    : `Level ${initialData.level}`}
                </span>
              </div>
            )}
            {initialData.parentId && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Parent Topic:
                </span>
                <span className="text-sm text-gray-800 font-mono">
                  {initialData.parentId}
                </span>
              </div>
            )}
            {initialData.childIds && initialData.childIds.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Child Topics:
                </span>
                <span className="text-sm text-gray-800">
                  {initialData.childIds.length}{" "}
                  {initialData.childIds.length === 1 ? "topic" : "topics"}
                </span>
              </div>
            )}
            {initialData.tags && initialData.tags.length > 0 && (
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-600">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {initialData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 子主题创建区域 */}
      {onCreateChildNode && (
        <>
          {/* 分割线 */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* 子主题创建表单 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 8h8"
                />
              </svg>
              Add Child Topic
            </h4>
            <div className="relative">
              <textarea
                value={childNodeContent}
                onChange={(e) => handleChildNodeInputChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-vertical ${
                  childNodeErrors.content
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="Enter child topic content..."
                rows={4}
                maxLength={500}
                disabled={isCreatingChild}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {childNodeContent?.length || 0}/500
              </div>
            </div>
            {childNodeErrors.content && (
              <div className="flex items-center mt-1 text-red-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm">{childNodeErrors.content}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleCreateChildNode}
              disabled={isCreatingChild || !childNodeContent.trim()}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-400 disabled:to-green-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isCreatingChild ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth={4}
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                "Create Child Topic"
              )}
            </button>
            {childNodeErrors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-800">
                    {childNodeErrors.submit}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

interface NodeEditorProps {
  mode: SidebarMode;
  selectedNodeId?: string;
  sourceNodeId?: string;
  initialData?: NodeData; // 新增：用于编辑模式的初始数据
  onSave: (nodeId: string | NodeData, data?: NodeData) => void;
  onCancel: () => void;
  onCreateChildNode?: (parentId: string, content: string) => void; // 新增：创建子节点的回调
  user?: { id: string; name: string }; // 新增：用户信息
  channel?: { id: string }; // 新增：频道信息
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  mode,
  selectedNodeId,
  sourceNodeId,
  initialData,
  onSave,
  onCancel,
  onCreateChildNode,
  user,
  channel,
}) => {
  // 创建模式的状态管理
  const [formData, setFormData] = useState<NodeData>({
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 只在创建模式和连接模式下管理表单数据
  useEffect(() => {
    if (mode === "create" || mode === "connection") {
      // 创建模式重置表单
      setFormData({
        content: "",
      });
    }
  }, [mode]);

  const handleInputChange = (field: keyof NodeData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 清除该字段的错误信息
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.content.trim()) {
      newErrors.content = "Topic content cannot be empty";
    }

    if (formData.content.length > 500) {
      newErrors.content = "Topic content cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // 调试信息
    console.log("NodeEditor handleSubmit - 调试信息:");
    console.log("  mode:", mode);
    console.log("  user:", user);
    console.log("  channel:", channel);
    console.log("  formData:", formData);
    console.log("  selectedNodeId:", selectedNodeId);

    try {
      if (mode === "edit" && selectedNodeId && onSave) {
        console.log("执行编辑模式逻辑");
        // 编辑模式：更新现有节点
        onSave(selectedNodeId, formData);
      } else if (mode === "create" && user && channel) {
        console.log("执行API创建模式逻辑");
        // 创建模式：调用API创建新主题
        const requestData: CreateTopicRequest = {
          channel_id: channel.id,
          content: formData.content.trim(),
          user_id: user.id,
          user_name: user.name,
        };

        console.log("发送API请求:", requestData);

        const response = await createTopicAPI(requestData);

        console.log("API响应:", response);

        if (response.success) {
          // API调用成功，调用onSave回调
          onSave(formData);
          // 清空表单
          setFormData({ content: "" });
        } else {
          throw new Error(response.message || "Failed to create topic");
        }
      } else {
        console.log("执行回退逻辑 - 条件不满足");
        console.log("  mode === 'create':", mode === "create");
        console.log("  !!user:", !!user);
        console.log("  !!channel:", !!channel);
        console.log("  !!onSave:", !!onSave);

        if (onSave) {
          // 回退到原有逻辑（兼容性）
          onSave(formData);
        }
      }
    } catch (error) {
      console.error("创建主题失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create topic";
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "create":
        return "Create Topic";
      case "edit":
        return "Save Changes";
      case "connection":
        return "Create and Connect";
      default:
        return "Save";
    }
  };

  // 编辑模式：显示主题详情
  if (mode === "edit") {
    return (
      <TopicDetailsDisplay
        initialData={initialData}
        onCreateChildNode={onCreateChildNode}
        selectedNodeId={selectedNodeId}
        user={user}
        channel={channel}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 主表单区域 */}
      <div className="space-y-4">
        {/* 节点内容 */}
        <div className="space-y-2">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Topic Content <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-vertical ${
                errors.content
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              placeholder="Enter topic content"
              rows={6}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {formData.content?.length || 0}/500
            </div>
          </div>
          {errors.content && (
            <div className="flex items-center mt-1 text-red-600">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm">{errors.content}</p>
            </div>
          )}
        </div>

        {/* 连接模式提示 */}
        {mode === "connection" && sourceNodeId && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <p className="text-sm text-green-800 font-medium">
                Will create a new topic and connect to source topic
              </p>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* 主表单提交按钮 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:shadow-none"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </div>
            ) : (
              getSubmitButtonText()
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default NodeEditor;

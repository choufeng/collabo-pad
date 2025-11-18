"use client";

import React, { useState, useEffect } from "react";
import { SidebarMode, NodeData } from "./RightSidebar";

interface NodeEditorProps {
  mode: SidebarMode;
  selectedNodeId?: string;
  sourceNodeId?: string;
  initialData?: NodeData; // 新增：用于编辑模式的初始数据
  onSave:
    | ((data: NodeData) => void)
    | ((nodeId: string, data: NodeData) => void);
  onCancel: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  mode,
  selectedNodeId,
  sourceNodeId,
  initialData,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<NodeData>({
    label: "",
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 如果是编辑模式，需要加载现有节点数据
  useEffect(() => {
    if (mode === "edit" && selectedNodeId && initialData) {
      // 编辑模式：使用传入的初始数据
      setFormData({
        label: initialData.label || "",
        content: initialData.content || "",
      });
    } else if (mode === "create" || mode === "connection") {
      // 创建模式重置表单
      setFormData({
        label: "",
        content: "",
      });
    }
  }, [mode, selectedNodeId, initialData]);

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

    if (!formData.label.trim()) {
      newErrors.label = "节点标题不能为空";
    }

    if (formData.label.trim().length > 50) {
      newErrors.label = "节点标题不能超过50个字符";
    }

    if (formData.content && formData.content.length > 500) {
      newErrors.content = "节点内容不能超过500个字符";
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

    try {
      if (mode === "edit" && selectedNodeId && onSave) {
        // 编辑模式：更新现有节点
        onSave(selectedNodeId, formData);
      } else {
        // 创建模式：创建新节点
        onSave(formData);
      }
    } catch (error) {
      console.error("保存节点失败:", error);
      setErrors({ submit: "保存失败，请重试" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "create":
        return "创建节点";
      case "edit":
        return "保存修改";
      case "connection":
        return "创建并连接";
      default:
        return "保存";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 节点标题 */}
      <div className="space-y-2">
        <label
          htmlFor="label"
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
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          节点标题 <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="label"
            value={formData.label}
            onChange={(e) => handleInputChange("label", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pl-10 ${
              errors.label
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            placeholder="请输入节点标题"
            maxLength={50}
            disabled={isSubmitting}
          />
          <svg
            className="absolute left-3 top-3.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </div>
        {errors.label && (
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
            <p className="text-sm">{errors.label}</p>
          </div>
        )}
      </div>

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
          节点内容
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
            placeholder="请输入节点内容（可选）"
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
              将创建一个新节点并连接到源节点
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

      {/* 操作按钮 */}
      <div className="flex space-x-3 pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:shadow-none"
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
              保存中...
            </div>
          ) : (
            getSubmitButtonText()
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 disabled:from-gray-50 disabled:to-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border border-gray-300"
        >
          取消
        </button>
      </div>
    </form>
  );
};

export default NodeEditor;

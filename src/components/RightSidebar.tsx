"use client";

import React, { useEffect } from "react";
import NodeEditor from "./NodeEditor";

export type SidebarMode = "create" | "edit" | "connection" | null;

interface RightSidebarProps {
  isOpen: boolean;
  mode: SidebarMode;
  selectedNodeId?: string;
  sourceNodeId?: string; // 用于连接线模式
  initialData?: NodeData; // 编辑模式的初始数据
  onClose: () => void;
  onSaveNode: (data: NodeData) => void;
  onUpdateNode: (nodeId: string, data: NodeData) => void;
}

export interface NodeData {
  content: string;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  mode,
  selectedNodeId,
  sourceNodeId,
  initialData,
  onClose,
  onSaveNode,
  onUpdateNode,
}) => {
  // ESC 键关闭边栏
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "创建新节点";
      case "edit":
        return "编辑节点";
      case "connection":
        return "创建连接节点";
      default:
        return "节点编辑";
    }
  };

  return (
    <>
      {/* 边栏 */}
      <div
        className={`fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 边栏头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            {mode === "create" && (
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
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
              </svg>
            )}
            {mode === "edit" && (
              <svg
                className="w-5 h-5 mr-2 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            )}
            {mode === "connection" && (
              <svg
                className="w-5 h-5 mr-2 text-green-600"
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
            )}
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-70 rounded-lg transition-all duration-200 group"
            aria-label="关闭边栏"
          >
            <svg
              className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 边栏内容 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <NodeEditor
              mode={mode}
              selectedNodeId={selectedNodeId}
              sourceNodeId={sourceNodeId}
              initialData={initialData}
              onSave={mode === "edit" ? onUpdateNode : onSaveNode}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default RightSidebar;

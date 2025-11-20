"use client";

import React, { useEffect } from "react";
import NodeEditor from "./NodeEditor";

export type SidebarMode =
  | "create"
  | "edit"
  | "connection"
  | "child-comment"
  | null;

interface RightSidebarProps {
  isOpen: boolean;
  mode: SidebarMode;
  selectedNodeId?: string;
  sourceNodeId?: string; // 用于连接线模式
  parentNodeData?: NodeData; // 子评论模式的父节点数据
  initialData?: NodeData; // 编辑模式的初始数据
  onClose: () => void;
  onSaveNode: (data: NodeData) => void;
  onUpdateNode: (nodeId: string, data: NodeData) => void;
  onCreateChildNode?: (parentId: string, content: string) => void; // 创建子节点的回调
  user?: {
    id: string;
    name: string;
  };
  channel?: {
    id: string;
  };
}

export interface NodeData {
  content: string;
  parentId?: string; // 父节点ID
  level?: number; // 节点层级，0为顶级节点
  childIds?: string[]; // 子节点ID列表
  creator?: string; // 节点创建者用户名
  user_id?: string; // 用户ID
  user_name?: string; // 用户名（与 creator 兼容）
  timestamp?: number; // 创建时间戳
  topicId?: string; // 主题ID
  tags?: string[]; // 标签
  metadata?: Record<string, any>; // 其他元数据
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  mode,
  selectedNodeId,
  sourceNodeId,
  parentNodeData,
  initialData,
  onClose,
  onSaveNode,
  onUpdateNode,
  onCreateChildNode,
  user,
  channel,
}) => {
  // 调试信息
  console.log("RightSidebar - 调试信息:");
  console.log("  mode:", mode);
  console.log("  user:", user);
  console.log("  channel:", channel);
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
        return "Create New Topic";
      case "edit":
        return "Topic Details";
      case "connection":
        return "Create Connected Topic";
      case "child-comment":
        return "Add Child Comment";
      default:
        return "Topic Editor";
    }
  };

  return (
    <>
      {/* 边栏 */}
      <div
        data-testid="right-sidebar"
        data-mode={mode}
        data-node-data={JSON.stringify(initialData || {})}
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
            {mode === "child-comment" && (
              <svg
                className="w-5 h-5 mr-2 text-purple-600"
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
            )}
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-70 rounded-lg transition-all duration-200 group"
            aria-label="Close sidebar"
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
              user={user}
              channel={channel}
              onSave={(nodeIdOrData, data) => {
                if (typeof nodeIdOrData === "string" && data) {
                  // 编辑模式：调用 onUpdateNode
                  onUpdateNode(nodeIdOrData, data);
                } else {
                  // 创建模式：调用 onSaveNode
                  onSaveNode(nodeIdOrData as NodeData);
                }
              }}
              onCancel={onClose}
              onCreateChildNode={onCreateChildNode}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default RightSidebar;

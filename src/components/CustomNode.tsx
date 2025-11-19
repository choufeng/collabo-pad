"use client";

import React, { memo, useCallback } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ExtendedNode, ExtendedNodeData } from "@/utils/node-hierarchy";

interface CustomNodeProps extends NodeProps {
  data: ExtendedNodeData &
    Record<string, unknown> & {
      label: string;
      content: string;
      parentId?: string;
      level?: number;
      childIds?: string[];
    };
  onAddChild?: (nodeId: string) => void;
}

/**
 * 自定义节点组件
 * 支持层级化显示和"+"按钮功能
 */
const CustomNode: React.FC<CustomNodeProps> = memo(
  ({ id, data, selected, onAddChild }) => {
    // 计算节点样式
    const getNodeStyle = useCallback(() => {
      const level = data.level || 0;
      const isChildNode = level > 0;

      if (isChildNode) {
        // 子节点样式：较小尺寸，不同颜色
        return {
          padding: "12px 16px",
          fontSize: "14px",
          minWidth: "180px",
          maxWidth: "240px",
          backgroundColor: getChildNodeBackgroundColor(level),
          borderColor: getChildNodeBorderColor(level),
          transform: `scale(${getChildNodeScale(level)})`,
        };
      } else {
        // 父节点样式：标准尺寸
        return {
          padding: "16px 20px",
          fontSize: "16px",
          minWidth: "220px",
          maxWidth: "300px",
          backgroundColor: "#3B82F6",
          borderColor: "#2563EB",
        };
      }
    }, [data.level]);

    // 获取子节点背景色
    const getChildNodeBackgroundColor = (level: number): string => {
      const colors = [
        "#10B981", // 绿色 - 层级1
        "#F59E0B", // 橙色 - 层级2
        "#EF4444", // 红色 - 层级3
        "#8B5CF6", // 紫色 - 层级4
        "#EC4899", // 粉色 - 层级5
      ];
      return colors[level - 1] || colors[colors.length - 1];
    };

    // 获取子节点边框色
    const getChildNodeBorderColor = (level: number): string => {
      const colors = [
        "#059669", // 深绿色 - 层级1
        "#D97706", // 深橙色 - 层级2
        "#DC2626", // 深红色 - 层级3
        "#7C3AED", // 深紫色 - 层级4
        "#DB2777", // 深粉色 - 层级5
      ];
      return colors[level - 1] || colors[colors.length - 1];
    };

    // 获取子节点缩放比例
    const getChildNodeScale = (level: number): number => {
      return Math.max(0.7, 1 - level * 0.1); // 每层级缩小10%，最小70%
    };

    // 处理"+"按钮点击
    const handleAddChildClick = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation(); // 防止触发节点点击事件
        if (onAddChild) {
          onAddChild(id);
        }
      },
      [id, onAddChild],
    );

    // 获取"+"按钮样式
    const getAddButtonStyle = useCallback(() => {
      const level = data.level || 0;
      const isChildNode = level > 0;

      return {
        width: isChildNode ? "24px" : "28px",
        height: isChildNode ? "24px" : "28px",
        backgroundColor: "#ffffff",
        borderColor: "#d1d5db",
        color: "#6b7280",
        fontSize: isChildNode ? "14px" : "16px",
      };
    }, [data.level]);

    return (
      <div
        data-testid="custom-node"
        className={`relative border-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg ${
          selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
        }`}
        style={getNodeStyle()}
      >
        {/* 连接点 */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />

        {/* 节点内容 */}
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-2">
            <div className="text-white font-medium truncate">{data.label}</div>
            {data.content && data.content !== data.label && (
              <div className="text-white/80 text-sm mt-1 line-clamp-2">
                {data.content}
              </div>
            )}
          </div>

          {/* "+" 添加子节点按钮 */}
          <button
            onClick={handleAddChildClick}
            className="flex items-center justify-center rounded-full border hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 group"
            style={getAddButtonStyle()}
            title="Add child comment"
            aria-label="Add child comment"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
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
          </button>
        </div>

        {/* 子节点数量指示器 */}
        {data.childIds && data.childIds.length > 0 && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {data.childIds.length}
          </div>
        )}

        {/* 层级指示器（可选，用于调试） */}
        {process.env.NODE_ENV === "development" && data.level !== undefined && (
          <div className="absolute -top-2 -left-2 bg-gray-800 text-white text-xs px-1 rounded">
            L{data.level}
          </div>
        )}
      </div>
    );
  },
);

CustomNode.displayName = "CustomNode";

export default CustomNode;

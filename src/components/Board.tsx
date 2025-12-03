"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  OnConnectStart,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";

import type { Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SidebarMode, NodeData } from "@/types/node";
import CustomNode from "./CustomNode";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";
import {
  ExtendedNode,
  createChildNodeData,
  updateParentChildRelation,
  createParentChildEdge,
} from "@/utils/node-hierarchy";
import type { TopicNodeData } from "@/utils/topic-to-node";
import { SideTrowser } from "./SideTrowser";
import { useSideTrowserStore } from "@/stores/side-trowser-store";
import { removeTopicPrefix } from "@/utils/node-utils";
import { useLongPress } from "@/hooks/useLongPress";
import { isTouchDevice } from "@/utils/device-detection";

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Board 组件 Props 接口
export interface BoardProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  channelId?: string;
  connectionStatus?: "disconnected" | "connecting" | "connected" | "error";
  sseError?: string | null;
  onSSEErrorClear?: () => void;
  user?: {
    id: string;
    name: string;
  };
  channel?: {
    id: string;
  };
}

// 注册自定义节点类型
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// 内部组件，使用 ReactFlow context
function BoardWithProvider({
  initialNodes = [],
  initialEdges = [],
  channelId,
  connectionStatus = "disconnected",
  sseError = null,
  onSSEErrorClear,
  user,
  channel,
}: BoardProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);

  // ReactFlow 实例，用于坐标转换
  const { getViewport, screenToFlowPosition } = useReactFlow();
  const {
    open: openSideTrowser,
    updateForm,
    setSelectedNode,
  } = useSideTrowserStore();

  // 同步外部数据变化到内部状态
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // 侧边栏状态管理
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [connectionSource, setConnectionSource] = useState<string>();
  const [initialNodeData, setInitialNodeData] = useState<NodeData>();

  // 子评论相关状态
  const [parentNodeData, setParentNodeData] = useState<NodeData>();

  // 拖动位置更新相关状态
  const [savingNodes, setSavingNodes] = useState<Set<string>>(new Set());
  const saveTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 右键菜单相关状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    menuItems?: ContextMenuItem[];
  }>({
    visible: false,
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
    menuItems: [],
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // 保存节点位置到数据库
  const saveNodePosition = useCallback(
    async (nodeId: string, x: number, y: number) => {
      const topicId = removeTopicPrefix(nodeId);

      // 添加到保存状态
      setSavingNodes((prev) => new Set([...prev, nodeId]));

      try {
        const response = await fetch(`/api/topics/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: topicId,
            x: Math.round(x),
            y: Math.round(y),
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log(`节点 ${topicId} 位置保存成功: (${x}, ${y})`);
        } else {
          console.error(`节点 ${topicId} 位置保存失败:`, result.message);
        }
      } catch (error) {
        console.error(`节点 ${topicId} 位置保存错误:`, error);
      } finally {
        // 从保存状态中移除
        setSavingNodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }
    },
    [],
  );

  // 防抖保存位置
  const debouncedSavePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      // 清除之前的定时器
      const existingTimeout = saveTimeoutRef.current.get(nodeId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // 设置新的定时器
      const timeout = setTimeout(() => {
        saveNodePosition(nodeId, x, y);
        saveTimeoutRef.current.delete(nodeId);
      }, 300); // 300ms 防抖

      saveTimeoutRef.current.set(nodeId, timeout);
    },
    [saveNodePosition],
  );

  // 节点拖动结束
  const onNodeDragEnd = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // 获取节点数据
      const nodeData = node.data as TopicNodeData;
      if (!nodeData.topic_id) return;

      // 检查位置是否发生了实际变化
      const currentX = node.position.x;
      const currentY = node.position.y;
      const originalX = nodeData.x;
      const originalY = nodeData.y;

      const hasPositionChanged =
        originalX === undefined ||
        Math.abs(currentX - originalX) > 1 ||
        originalY === undefined ||
        Math.abs(currentY - originalY) > 1;

      if (hasPositionChanged) {
        console.log(
          `节点 ${node.id} 位置发生变化: (${originalX}, ${originalY}) -> (${currentX}, ${currentY})`,
        );
        debouncedSavePosition(node.id, currentX, currentY);
      }
    },
    [debouncedSavePosition],
  );

  const openCreateSidebar = useCallback(() => {
    openSideTrowser();
  }, [openSideTrowser]);

  // 更新节点
  const handleUpdateNode = useCallback(
    (nodeId: string, data: NodeData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label:
                    data.content.substring(0, 30) +
                    (data.content.length > 30 ? "..." : ""),
                  content: data.content,
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  // 节点点击事件
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const currentTopicId = removeTopicPrefix(node.id);
      console.log("当前节点ID:", node.id, "Topic ID:", currentTopicId);
      console.log(
        "所有节点的parent_id信息:",
        nodes.map((n) => ({
          nodeId: n.id,
          topic_id: removeTopicPrefix(n.id),
          parent_id: (n.data as TopicNodeData).parent_id,
          rawData: n.data,
        })),
      );

      const childNodes = nodes.filter(
        (n) => (n.data as TopicNodeData).parent_id === currentTopicId,
      );
      console.log("节点点击 - 子节点数量:", childNodes.length);

      // 设置选中的节点信息到 store
      setSelectedNode({
        id: node.id,
        type: node.type || "custom",
        data: node.data,
        position: node.position,
      });

      // 计算新子节点位置
      const childNodeData = createChildNodeData(
        node as ExtendedNode,
        "",
        childNodes as ExtendedNode[],
        user?.name,
      );
      updateForm({
        parent_id: removeTopicPrefix(node.id),
        x: childNodeData.position.x,
        y: childNodeData.position.y,
      });
      openSideTrowser();
    },
    [nodes, openSideTrowser, updateForm, setSelectedNode, user],
  );

  // 连接开始事件
  const onConnectStart: OnConnectStart = useCallback((event, { nodeId }) => {
    setConnectionSource(nodeId || undefined);
  }, []);

  // 连接结束事件（在空白区域结束）
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // 获取坐标位置（支持鼠标和触摸事件）
      const clientX =
        "touches" in event ? event.touches[0]?.clientX || 0 : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0]?.clientY || 0 : event.clientY;

      // 检查是否在空白区域结束连接
      const reactFlowBounds = (
        event.target as HTMLElement
      ).getBoundingClientRect();
      const isOutOfBounds =
        clientX < reactFlowBounds.left ||
        clientX > reactFlowBounds.right ||
        clientY < reactFlowBounds.top ||
        clientY > reactFlowBounds.bottom;

      if (isOutOfBounds && connectionSource) {
      }
    },
    [connectionSource],
  );

  // 右键事件处理函数
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault(); // 阻止浏览器默认右键菜单

      // 获取点击位置相对于页面的坐标
      const clickX = event.clientX;
      const clickY = event.clientY;

      // 将屏幕坐标转换为画布坐标
      const canvasPosition = screenToFlowPosition({ x: clickX, y: clickY });

      // 检查是否点击在节点上
      const target = event.target as HTMLElement;
      const isNode = target.closest(".react-flow__node");

      // 构建菜单项
      const menuItems: ContextMenuItem[] = [
        {
          id: "add-topic",
          label: "Add Topic",
          onClick: () => {
            console.log(
              "添加主题，位置（画布坐标）at menuItem:",
              canvasPosition,
            );
            // 清空选中的节点信息，只显示创建表单
            setSelectedNode(null);
            updateForm({
              parent_id: undefined,
              x: canvasPosition.x,
              y: canvasPosition.y,
            });
            console.log("右键菜单调用updateForm后，立即打开侧边栏...");
            openSideTrowser();
          },
        },
      ];

      // 显示右键菜单
      if (!isNode) {
        setContextMenu({
          visible: true,
          x: clickX,
          y: clickY,
          canvasX: canvasPosition.x,
          canvasY: canvasPosition.y,
          menuItems,
        });
      }
    },
    [screenToFlowPosition, openSideTrowser, setSelectedNode, updateForm],
  );

  // 检查是否为触摸设备
  const isTouchEnabled = isTouchDevice();

  // 处理长按显示右键菜单的函数
  const handleLongPressContextMenu = useCallback(
    (event: { clientX: number; clientY: number }) => {
      // 获取点击位置
      const clickX = event.clientX;
      const clickY = event.clientY;

      // 将屏幕坐标转换为画布坐标
      const canvasPosition = screenToFlowPosition({ x: clickX, y: clickY });

      // 构建菜单项（与右键菜单相同）
      const menuItems: ContextMenuItem[] = [
        {
          id: "add-topic",
          label: "Add Topic",
          onClick: () => {
            console.log("长按添加主题，位置（画布坐标）:", canvasPosition);
            // 清空选中的节点信息，只显示创建表单
            setSelectedNode(null);
            updateForm({
              parent_id: undefined,
              x: canvasPosition.x,
              y: canvasPosition.y,
            });
            console.log("长按菜单调用updateForm后，立即打开侧边栏...");
            openSideTrowser();
          },
        },
      ];

      // 显示右键菜单
      setContextMenu({
        visible: true,
        x: clickX,
        y: clickY,
        canvasX: canvasPosition.x,
        canvasY: canvasPosition.y,
        menuItems,
      });
    },
    [screenToFlowPosition, openSideTrowser, setSelectedNode, updateForm],
  );

  // 双击处理 - 用于在触摸设备上触发右键菜单
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      const currentTime = Date.now();
      const clickPosition = { x: event.clientX, y: event.clientY };

      // 检查是否为双击（时间间隔 < 300ms，位置距离 < 10px）
      const timeDiff = currentTime - lastClickTimeRef.current;
      const distance = Math.sqrt(
        Math.pow(clickPosition.x - lastClickPositionRef.current.x, 2) +
          Math.pow(clickPosition.y - lastClickPositionRef.current.y, 2),
      );

      // 如果是双击且在触摸设备上，打开右键菜单
      if (isTouchEnabled && timeDiff < 300 && distance < 10) {
        console.log("[Board] Double click detected, opening context menu");
        event.preventDefault();
        event.stopPropagation();

        // 调用长按处理函数的逻辑
        handleLongPressContextMenu({
          clientX: event.clientX,
          clientY: event.clientY,
        });

        return;
      }

      // 更新上次点击信息
      lastClickTimeRef.current = currentTime;
      lastClickPositionRef.current = clickPosition;
    },
    [handleLongPressContextMenu, isTouchEnabled],
  );

  // 长按手势处理
  const longPressHandlers = useLongPress({
    onLongPress: handleLongPressContextMenu,
    delay: 500,
    hapticFeedback: true,
    moveThreshold: 10,
  });

  // 添加调试日志
  useEffect(() => {
    console.log("[Board] Touch device detected:", isTouchEnabled);
  }, [isTouchEnabled]);

  // 添加全局触摸事件监听器作为备选方案
  useEffect(() => {
    if (!isTouchEnabled) return;

    const handleGlobalTouchStart = (e: TouchEvent) => {
      console.log("[Board] Global touch start detected:", {
        target: e.target,
        touches: e.touches.length,
      });

      // 检查是否在ReactFlow区域内
      const reactFlowElement = document.querySelector(".react-flow");
      const target = e.target as unknown as Node;
      if (
        reactFlowElement &&
        target &&
        (reactFlowElement as any).contains(target)
      ) {
        console.log("[Board] Touch inside ReactFlow, calling handler");
        longPressHandlers.onTouchStart(e);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      longPressHandlers.onTouchMove(e);
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      longPressHandlers.onTouchEnd();
    };

    // 使用被动监听器来提高性能
    document.addEventListener("touchstart", handleGlobalTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: true,
    });
    document.addEventListener("touchend", handleGlobalTouchEnd, {
      passive: true,
    });

    return () => {
      document.removeEventListener("touchstart", handleGlobalTouchStart);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isTouchEnabled, longPressHandlers]);

  // 触摸事件适配器，将React.TouchEvent转换为原生TouchEvent
  const touchStartHandler = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      console.log("[Board] Touch start handler called:", {
        isTouchEnabled,
        hasHandler: !!longPressHandlers.onTouchStart,
        touches: event.nativeEvent.touches.length,
      });

      if (isTouchEnabled && longPressHandlers.onTouchStart) {
        // 阻止ReactFlow的默认触摸行为
        event.preventDefault();
        const nativeEvent = event.nativeEvent;
        console.log("[Board] Calling longPressHandlers.onTouchStart");
        longPressHandlers.onTouchStart(nativeEvent);
      } else {
        console.log("[Board] Touch start handler - conditions not met:", {
          isTouchEnabled,
          hasHandler: !!longPressHandlers.onTouchStart,
        });
      }
    },
    [isTouchEnabled, longPressHandlers.onTouchStart],
  );

  const touchMoveHandler = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (isTouchEnabled && longPressHandlers.onTouchMove) {
        const nativeEvent = event.nativeEvent;
        longPressHandlers.onTouchMove(nativeEvent);
      }
    },
    [isTouchEnabled, longPressHandlers.onTouchMove],
  );

  const touchEndHandler = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (isTouchEnabled && longPressHandlers.onTouchEnd) {
        const nativeEvent = event.nativeEvent;
        longPressHandlers.onTouchEnd();
      }
    },
    [isTouchEnabled, longPressHandlers.onTouchEnd],
  );

  // 关闭右键菜单的函数
  const closeContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      canvasX: 0,
      canvasY: 0,
    });
  }, []);

  return (
    <div className="w-screen h-screen relative">
      {/* SSE 连接状态指示器 */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            connectionStatus === "connected"
              ? "bg-green-100 text-green-800"
              : connectionStatus === "connecting"
                ? "bg-yellow-100 text-yellow-800"
                : connectionStatus === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
          }`}
        >
          {connectionStatus === "connected"
            ? "SSE 已连接"
            : connectionStatus === "connecting"
              ? "SSE 连接中..."
              : connectionStatus === "error"
                ? "SSE 错误"
                : "SSE 未连接"}
        </div>
        <div className="flex items-center space-x-2">
          {channelId && (
            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
              频道: {channelId}
            </span>
          )}
          {user && (
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span
                className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow max-w-32 md:max-w-none truncate"
                title={user.name}
              >
                {user.name}
              </span>
            </div>
          )}
        </div>
        {savingNodes.size > 0 && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded shadow animate-pulse">
            正在保存 {savingNodes.size} 个节点位置...
          </span>
        )}
      </div>

      {/* SSE 错误提示 */}
      {sseError && (
        <div className="absolute top-16 left-4 z-10 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">连接错误</h4>
                <p className="text-xs text-red-600 mt-1">{sseError}</p>
              </div>
              {onSSEErrorClear && (
                <button
                  onClick={onSSEErrorClear}
                  className="ml-2 text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDragEnd}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onContextMenu={handleContextMenu}
        onPaneClick={handlePaneClick}
        onTouchStart={isTouchEnabled ? touchStartHandler : undefined}
        onTouchMove={isTouchEnabled ? touchMoveHandler : undefined}
        onTouchEnd={isTouchEnabled ? touchEndHandler : undefined}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <SideTrowser />

      {/* 右键上下文菜单 */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        items={contextMenu.menuItems || []}
        onClose={closeContextMenu}
      />
    </div>
  );
}

// 主要的 Board 组件，包装 ReactFlowProvider
export default function Board(props: BoardProps) {
  return (
    <ReactFlowProvider>
      <BoardWithProvider {...props} />
    </ReactFlowProvider>
  );
}

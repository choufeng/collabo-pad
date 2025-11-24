"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Node,
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
import "@xyflow/react/dist/style.css";
import RightSidebar, { SidebarMode, NodeData } from "./RightSidebar";
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
        "所有节点的parentId信息:",
        nodes.map((n) => ({
          nodeId: n.id,
          topicId: removeTopicPrefix(n.id),
          parentId: (n.data as TopicNodeData).parentId,
          rawData: n.data,
        })),
      );

      const childNodes = nodes.filter(
        (n) => (n.data as TopicNodeData).parentId === currentTopicId,
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
            updateForm({
              parent_id: undefined,
              x: canvasPosition.x,
              y: canvasPosition.y,
            });
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
    [screenToFlowPosition],
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
        {channelId && (
          <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
            频道: {channelId}
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
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onContextMenu={handleContextMenu}
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

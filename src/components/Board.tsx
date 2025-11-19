"use client";

import { useState, useCallback } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import RightSidebar, { SidebarMode, NodeData } from "./RightSidebar";

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function Board() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);

  // 侧边栏状态管理
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [connectionSource, setConnectionSource] = useState<string>();
  const [initialNodeData, setInitialNodeData] = useState<NodeData>();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // 打开侧边栏的通用函数
  const openSidebar = useCallback(
    (
      mode: SidebarMode,
      nodeId?: string,
      sourceId?: string,
      initialData?: NodeData,
    ) => {
      setSidebarMode(mode);
      setSelectedNodeId(nodeId);
      setConnectionSource(sourceId);
      setInitialNodeData(initialData);
      setSidebarOpen(true);
    },
    [],
  );

  // 关闭侧边栏
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSidebarMode(null);
    setSelectedNodeId(undefined);
    setConnectionSource(undefined);
    setInitialNodeData(undefined);
  }, []);

  // 创建节点（旧版本，现在改为打开侧边栏）
  const openCreateSidebar = useCallback(() => {
    openSidebar("create");
  }, [openSidebar]);

  // 保存新节点
  const handleSaveNode = useCallback(
    (data: NodeData) => {
      const newNode: Node = {
        id: `node-${nodeId}`,
        type: "default",
        position: {
          x: Math.random() * 400 + 100, // 稍微偏移避免重叠
          y: Math.random() * 400 + 100,
        },
        data: {
          label:
            data.content.substring(0, 30) +
            (data.content.length > 30 ? "..." : ""),
          content: data.content,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeId((id) => id + 1);

      // 如果是连接模式，创建连接
      if (sidebarMode === "connection" && connectionSource) {
        const newEdge: Edge = {
          id: `edge-${connectionSource}-${newNode.id}`,
          source: connectionSource,
          target: newNode.id,
          type: "smoothstep",
        };
        setEdges((eds) => eds.concat(newEdge));
      }

      closeSidebar();
    },
    [nodeId, setNodes, setEdges, sidebarMode, connectionSource, closeSidebar],
  );

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
      closeSidebar();
    },
    [setNodes, closeSidebar],
  );

  // 节点点击事件
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      openSidebar("edit", node.id, undefined, {
        content: node.data.content as string,
      });
    },
    [openSidebar],
  );

  // 连接开始事件
  const onConnectStart: OnConnectStart = useCallback((event, { nodeId }) => {
    setConnectionSource(nodeId);
  }, []);

  // 连接结束事件（在空白区域结束）
  const onConnectEnd = useCallback(
    (event) => {
      // 检查是否在空白区域结束连接
      const reactFlowBounds = (
        event.target as HTMLElement
      ).getBoundingClientRect();
      const isOutOfBounds =
        event.clientX < reactFlowBounds.left ||
        event.clientX > reactFlowBounds.right ||
        event.clientY < reactFlowBounds.top ||
        event.clientY > reactFlowBounds.bottom;

      if (isOutOfBounds && connectionSource) {
        openSidebar("connection", undefined, connectionSource);
      }
    },
    [connectionSource, openSidebar],
  );

  return (
    <div className="w-screen h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <button
        type="button"
        onClick={openCreateSidebar}
        tabIndex={0}
        className="absolute top-4 right-4 z-10 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-lg transition-colors duration-200"
      >
        Add Topic
      </button>

      <RightSidebar
        isOpen={sidebarOpen}
        mode={sidebarMode}
        selectedNodeId={selectedNodeId}
        sourceNodeId={connectionSource}
        initialData={initialNodeData}
        onClose={closeSidebar}
        onSaveNode={handleSaveNode}
        onUpdateNode={handleUpdateNode}
      />
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import RightSidebar, { SidebarMode, NodeData } from "./RightSidebar";
import CustomNode from "./CustomNode";
import {
  ExtendedNode,
  createChildNodeData,
  updateParentChildRelation,
  createParentChildEdge,
} from "@/utils/node-hierarchy";

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// 注册自定义节点类型
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

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

  // 子评论相关状态
  const [parentNodeData, setParentNodeData] = useState<NodeData>();

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
      parentData?: NodeData,
    ) => {
      setSidebarMode(mode);
      setSelectedNodeId(nodeId);
      setConnectionSource(sourceId);
      setInitialNodeData(initialData);
      setParentNodeData(parentData);
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
    setParentNodeData(undefined);
  }, []);

  // 创建节点（旧版本，现在改为打开侧边栏）
  const openCreateSidebar = useCallback(() => {
    openSidebar("create");
  }, [openSidebar]);

  // 处理"+"按钮点击，打开子评论创建侧边栏
  const handleAddChildNode = useCallback(
    (parentNodeId: string) => {
      const parentNode = nodes.find((node) => node.id === parentNodeId);
      if (!parentNode) return;

      // 获取父节点数据
      const parentData: NodeData = {
        content: parentNode.data.content as string,
        parentId: parentNode.data.parentId as string | undefined,
        level: parentNode.data.level as number | undefined,
        childIds: parentNode.data.childIds as string[] | undefined,
      };

      // 打开子评论创建侧边栏
      openSidebar("child-comment", undefined, undefined, undefined, parentData);
    },
    [nodes, openSidebar],
  );

  // 保存新节点
  const handleSaveNode = useCallback(
    (data: NodeData) => {
      let newNode: Node;

      if (sidebarMode === "child-comment" && parentNodeData) {
        // 子评论模式：创建子节点
        const parentNode = nodes.find(
          (node) => node.data.content === parentNodeData.content,
        );

        if (!parentNode) {
          console.error("父节点未找到");
          return;
        }

        // 创建子节点数据
        const childNodeData = createChildNodeData(
          parentNode as ExtendedNode,
          data.content,
          nodes as ExtendedNode[],
        );

        newNode = {
          id: `node-${nodeId}`,
          type: "custom",
          position: childNodeData.position,
          data: {
            ...childNodeData.data,
            onAddChild: handleAddChildNode, // 传递回调函数
          },
        };

        // 更新父子节点关系
        const updatedNodes = updateParentChildRelation(
          parentNode as ExtendedNode,
          newNode as ExtendedNode,
          nodes as ExtendedNode[],
        );

        setNodes(updatedNodes);

        // 创建父子连接线
        const parentChildEdge = createParentChildEdge(
          parentNode as ExtendedNode,
          newNode as ExtendedNode,
          edges,
        );
        setEdges((eds) => eds.concat(parentChildEdge));
      } else {
        // 普通创建模式
        newNode = {
          id: `node-${nodeId}`,
          type: "custom",
          position: {
            x: Math.random() * 400 + 100, // 稍微偏移避免重叠
            y: Math.random() * 400 + 100,
          },
          data: {
            label:
              data.content.substring(0, 30) +
              (data.content.length > 30 ? "..." : ""),
            content: data.content,
            level: 0, // 顶级节点
            onAddChild: handleAddChildNode, // 传递回调函数
          },
        };

        setNodes((nds) => nds.concat(newNode));

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
      }

      setNodeId((id) => id + 1);
      closeSidebar();
    },
    [
      nodeId,
      nodes,
      edges,
      sidebarMode,
      connectionSource,
      parentNodeData,
      setNodes,
      setEdges,
      closeSidebar,
      handleAddChildNode,
    ],
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

  // 创建子节点
  const handleCreateChildNode = useCallback(
    async (parentId: string, content: string) => {
      const parentNode = nodes.find((node) => node.id === parentId);
      if (!parentNode) {
        throw new Error("Parent node not found");
      }

      // 创建子节点数据
      const childNodeData = createChildNodeData(
        parentNode as ExtendedNode,
        content,
        nodes as ExtendedNode[],
        "currentUser", // 可以从用户上下文获取
      );

      const newNode: Node = {
        id: `node-${nodeId}`,
        type: "custom",
        position: childNodeData.position,
        data: {
          ...childNodeData.data,
          onAddChild: handleAddChildNode,
        },
      };

      // 更新父子节点关系
      const updatedNodes = updateParentChildRelation(
        parentNode as ExtendedNode,
        newNode as ExtendedNode,
        nodes as ExtendedNode[],
      );

      // 创建连接线
      const newEdge = createParentChildEdge(parentId, newNode.id);

      // 更新状态
      setNodes(updatedNodes);
      setEdges((eds) => [...eds, newEdge]);
      setNodeId((id) => id + 1);
    },
    [nodes, handleAddChildNode, setNodes, setEdges],
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
        nodeTypes={nodeTypes}
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
        parentNodeData={parentNodeData}
        onClose={closeSidebar}
        onSaveNode={handleSaveNode}
        onUpdateNode={handleUpdateNode}
        onCreateChildNode={handleCreateChildNode}
      />
    </div>
  );
}

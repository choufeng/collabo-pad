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

// Board component Props interface
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

// Register custom node types
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// Internal component, using ReactFlow context
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

  // ReactFlow instance for coordinate conversion
  const { getViewport, screenToFlowPosition } = useReactFlow();
  const {
    open: openSideTrowser,
    updateForm,
    setSelectedNode,
  } = useSideTrowserStore();

  // Sync external data changes to internal state
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Sidebar state management
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [connectionSource, setConnectionSource] = useState<string>();
  const [initialNodeData, setInitialNodeData] = useState<NodeData>();

  // Child comment related state
  const [parentNodeData, setParentNodeData] = useState<NodeData>();

  // Drag position update related state
  const [savingNodes, setSavingNodes] = useState<Set<string>>(new Set());
  const saveTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Context menu related state
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

  // Save node position to database
  const saveNodePosition = useCallback(
    async (nodeId: string, x: number, y: number) => {
      const topicId = removeTopicPrefix(nodeId);

      // Add to saving state
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
          console.log(
            `Node ${topicId} position saved successfully: (${x}, ${y})`,
          );
        } else {
          console.error(
            `Failed to save node ${topicId} position:`,
            result.message,
          );
        }
      } catch (error) {
        console.error(`Error saving node ${topicId} position:`, error);
      } finally {
        // Remove from saving state
        setSavingNodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }
    },
    [],
  );

  // Debounced save position
  const debouncedSavePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      // Clear previous timer
      const existingTimeout = saveTimeoutRef.current.get(nodeId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timer
      const timeout = setTimeout(() => {
        saveNodePosition(nodeId, x, y);
        saveTimeoutRef.current.delete(nodeId);
      }, 300); // 300ms debounce

      saveTimeoutRef.current.set(nodeId, timeout);
    },
    [saveNodePosition],
  );

  // Node drag end
  const onNodeDragEnd = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Get node data
      const nodeData = node.data as TopicNodeData;
      if (!nodeData.topic_id) return;

      // Check if position actually changed
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
          `Node ${node.id} position changed: (${originalX}, ${originalY}) -> (${currentX}, ${currentY})`,
        );
        debouncedSavePosition(node.id, currentX, currentY);
      }
    },
    [debouncedSavePosition],
  );

  const openCreateSidebar = useCallback(() => {
    openSideTrowser();
  }, [openSideTrowser]);

  // Update node
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

  // Node click event
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const currentTopicId = removeTopicPrefix(node.id);
      console.log("Current node ID:", node.id, "Topic ID:", currentTopicId);
      console.log(
        "All nodes parent_id info:",
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
      console.log("Node clicked - child node count:", childNodes.length);

      // Set selected node info to store
      setSelectedNode({
        id: node.id,
        type: node.type || "custom",
        data: node.data,
        position: node.position,
      });

      // Calculate new child node position
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

  // Connection start event
  const onConnectStart: OnConnectStart = useCallback((event, { nodeId }) => {
    setConnectionSource(nodeId || undefined);
  }, []);

  // Connection end event (ends in empty area)
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // Get coordinate position (supports mouse and touch events)
      const clientX =
        "touches" in event ? event.touches[0]?.clientX || 0 : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0]?.clientY || 0 : event.clientY;

      // Check if connection ends in empty area
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

  // Right-click event handler
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault(); // Prevent browser default context menu

      // Get click position relative to page
      const clickX = event.clientX;
      const clickY = event.clientY;

      // Convert screen coordinates to canvas coordinates
      const canvasPosition = screenToFlowPosition({ x: clickX, y: clickY });

      // Check if clicked on node
      const target = event.target as HTMLElement;
      const isNode = target.closest(".react-flow__node");

      // Build menu items
      const menuItems: ContextMenuItem[] = [
        {
          id: "add-topic",
          label: "Add Topic",
          onClick: () => {
            console.log(
              "Add topic at position (canvas coordinates) at menuItem:",
              canvasPosition,
            );
            // Clear selected node info, only show create form
            setSelectedNode(null);
            updateForm({
              parent_id: undefined,
              x: canvasPosition.x,
              y: canvasPosition.y,
            });
            console.log(
              "After right-click menu calls updateForm, opening sidebar...",
            );
            openSideTrowser();
          },
        },
      ];

      // Show context menu
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

  // Check if touch device
  const isTouchEnabled = isTouchDevice();

  // Handle long press to show context menu
  const handleLongPressContextMenu = useCallback(
    (event: { clientX: number; clientY: number }) => {
      // Get click position
      const clickX = event.clientX;
      const clickY = event.clientY;

      // Convert screen coordinates to canvas coordinates
      const canvasPosition = screenToFlowPosition({ x: clickX, y: clickY });

      // Build menu items (same as right-click menu)
      const menuItems: ContextMenuItem[] = [
        {
          id: "add-topic",
          label: "Add Topic",
          onClick: () => {
            console.log(
              "Long press add topic at position (canvas coordinates):",
              canvasPosition,
            );
            // Clear selected node info, only show create form
            setSelectedNode(null);
            updateForm({
              parent_id: undefined,
              x: canvasPosition.x,
              y: canvasPosition.y,
            });
            console.log(
              "After long press menu calls updateForm, opening sidebar...",
            );
            openSideTrowser();
          },
        },
      ];

      // Show context menu
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

  // Double click handling - to trigger context menu on touch devices
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      const currentTime = Date.now();
      const clickPosition = { x: event.clientX, y: event.clientY };

      // Check if double click (time interval < 300ms, position distance < 10px)
      const timeDiff = currentTime - lastClickTimeRef.current;
      const distance = Math.sqrt(
        Math.pow(clickPosition.x - lastClickPositionRef.current.x, 2) +
          Math.pow(clickPosition.y - lastClickPositionRef.current.y, 2),
      );

      // If double click and on touch device, open context menu
      if (isTouchEnabled && timeDiff < 300 && distance < 10) {
        console.log("[Board] Double click detected, opening context menu");
        event.preventDefault();
        event.stopPropagation();

        // Call long press handler logic
        handleLongPressContextMenu({
          clientX: event.clientX,
          clientY: event.clientY,
        });

        return;
      }

      // Update last click info
      lastClickTimeRef.current = currentTime;
      lastClickPositionRef.current = clickPosition;
    },
    [handleLongPressContextMenu, isTouchEnabled],
  );

  // Long press gesture handling
  const longPressHandlers = useLongPress({
    onLongPress: handleLongPressContextMenu,
    delay: 500,
    hapticFeedback: true,
    moveThreshold: 10,
  });

  // Add debug logs
  useEffect(() => {
    console.log("[Board] Touch device detected:", isTouchEnabled);
  }, [isTouchEnabled]);

  // Add global touch event listeners as fallback
  useEffect(() => {
    if (!isTouchEnabled) return;

    const handleGlobalTouchStart = (e: TouchEvent) => {
      console.log("[Board] Global touch start detected:", {
        target: e.target,
        touches: e.touches.length,
      });

      // Check if within ReactFlow area
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

    // Use passive listeners for better performance
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

  // Touch event adapter, convert React.TouchEvent to native TouchEvent
  const touchStartHandler = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      console.log("[Board] Touch start handler called:", {
        isTouchEnabled,
        hasHandler: !!longPressHandlers.onTouchStart,
        touches: event.nativeEvent.touches.length,
      });

      if (isTouchEnabled && longPressHandlers.onTouchStart) {
        // Prevent ReactFlow default touch behavior
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

  // Close context menu function
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
      {/* SSE Connection Status Indicator */}
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
            ? "SSE Connected"
            : connectionStatus === "connecting"
              ? "SSE Connecting..."
              : connectionStatus === "error"
                ? "SSE Error"
                : "SSE Disconnected"}
        </div>
        <div className="flex items-center space-x-2">
          {channelId && (
            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
              Channel: {channelId}
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
            Saving {savingNodes.size} node positions...
          </span>
        )}
      </div>

      {/* SSE Error Display */}
      {sseError && (
        <div className="absolute top-16 left-4 z-10 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">
                  Connection Error
                </h4>
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

      {/* Context Menu */}
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

// Main Board component, wrapped with ReactFlowProvider
export default function Board(props: BoardProps) {
  return (
    <ReactFlowProvider>
      <BoardWithProvider {...props} />
    </ReactFlowProvider>
  );
}

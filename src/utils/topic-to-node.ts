/**
 * Topic 到 ReactFlow 节点的数据转换工具
 */

import { Node, Edge, Position } from "@xyflow/react";
import type { Topic } from "@/types/redis-stream";
import { ExtendedNode } from "./node-hierarchy";

/**
 * 安全转换坐标值为数字
 */
function safeParseCoordinate(value: any): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return isNaN(value) ? undefined : value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

// 节点数据接口
export interface TopicNodeData extends Record<string, unknown> {
  label: string;
  content: string;
  translated_content?: string;
  level: number;
  parent_id?: string;
  child_ids?: string[];
  topic_id: string;
  user_id: string;
  user_name: string;
  timestamp: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  onAddChild?: (parentId: string) => void;
}

// 转换选项
export interface TopicToNodeOptions {
  maxLabelLength?: number;
  defaultPosition?: { x: number; y: number };
  spacing?: { x: number; y: number };
  levels?: { [key: number]: { x: number; y: number } };
}

// 默认选项
const DEFAULT_OPTIONS: Required<TopicToNodeOptions> = {
  maxLabelLength: 30,
  defaultPosition: { x: 100, y: 100 },
  spacing: { x: 200, y: 150 },
  levels: {
    0: { x: 100, y: 100 }, // 根节点
    1: { x: 300, y: 200 }, // 第一层子节点
    2: { x: 500, y: 300 }, // 第二层子节点
    3: { x: 700, y: 400 }, // 第三层子节点
  },
};

/**
 * 将单个 Topic 转换为 ReactFlow Node
 */
export function topicToNode(
  topic: Topic,
  options: Partial<TopicToNodeOptions> = {},
  onAddChild?: (parentId: string) => void,
): Node<TopicNodeData> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 计算节点层级
  const level = calculateNodeLevel(topic);

  // 计算节点位置
  const position = calculateNodePosition(topic, level, opts);

  // 生成节点标签
  const label = generateNodeLabel(topic.content, opts.maxLabelLength);

  // 安全解析坐标值
  const x = safeParseCoordinate(topic.x);
  const y = safeParseCoordinate(topic.y);

  // 创建扩展的 metadata，包含坐标信息以便后续检测
  const extendedMetadata = {
    ...topic.metadata,
    hasStoredCoordinates: x !== undefined && y !== undefined,
    x: x,
    y: y,
  };

  return {
    id: `topic-${topic.id}`,
    type: "custom",
    position,
    data: {
      label,
      content: topic.content,
      translated_content: topic.translated_content,
      level,
      parent_id: topic.parent_id,
      topic_id: topic.id,
      user_id: topic.user_id,
      user_name: topic.user_name,
      timestamp: topic.timestamp,
      x: x,
      y: y,
      w: safeParseCoordinate(topic.w),
      h: safeParseCoordinate(topic.h),
      tags: topic.tags,
      metadata: extendedMetadata,
      onAddChild,
    } as TopicNodeData,
  };
}

/**
 * 将 Topic 数组转换为 ReactFlow Nodes 和 Edges
 */
export function topicsToFlowElements(
  topics: Topic[],
  options: Partial<TopicToNodeOptions> = {},
  onAddChild?: (parentId: string) => void,
): { nodes: Node<TopicNodeData>[]; edges: Edge[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const nodes: Node<TopicNodeData>[] = [];
  const edges: Edge[] = [];

  // 按 parent_id 分组
  const topicMap = new Map<string, Topic>();
  const childrenMap = new Map<string, Topic[]>();

  topics.forEach((topic) => {
    topicMap.set(topic.id, topic);

    const parentId = topic.parent_id || "root";
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(topic);
  });

  // 生成节点和边
  topics.forEach((topic) => {
    // 创建节点
    const node = topicToNode(topic, opts, onAddChild);
    nodes.push(node);

    // 创建父子关系的边
    if (topic.parent_id) {
      const edge = createParentChildEdge(
        topic.parent_id,
        topic.id,
        topic,
        childrenMap,
      );
      edges.push(edge);
    }
  });

  // 优化节点位置，避免重叠
  optimizeNodePositions(nodes, childrenMap, opts);

  // 优化连接线路径，避免交叉
  const optimizedEdges = optimizeEdgePaths(edges);

  return { nodes, edges: optimizedEdges };
}

/**
 * 计算节点层级
 */
function calculateNodeLevel(topic: Topic): number {
  // 简单的层级计算，可以根据需要扩展
  if (!topic.parent_id) return 0;

  // 这里可以递归计算父节点层级，但为了性能考虑，暂时基于 parent_id 存在判断
  return 1;
}

/**
 * 计算节点位置
 */
function calculateNodePosition(
  topic: Topic,
  level: number,
  options: Required<TopicToNodeOptions>,
): { x: number; y: number } {
  // 如果主题有存储的坐标信息，优先使用
  const x = safeParseCoordinate(topic.x);
  const y = safeParseCoordinate(topic.y);

  if (x !== undefined && y !== undefined) {
    return {
      x: x,
      y: y,
    };
  }

  // 否则基于层级的基础位置计算（向后兼容）
  const basePosition = options.levels[level] || options.defaultPosition;

  // 基于时间戳的随机偏移，避免节点完全重叠
  const timeOffset = (topic.timestamp % 1000) / 10;

  return {
    x: basePosition.x + timeOffset,
    y: basePosition.y + level * options.spacing.y,
  };
}

/**
 * 生成节点标签
 */
function generateNodeLabel(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

/**
 * 优化节点位置，避免重叠
 * 只对没有坐标的节点进行位置优化，保持已有坐标节点的位置不变
 */
function optimizeNodePositions(
  nodes: Node<TopicNodeData>[],
  childrenMap: Map<string, Topic[]>,
  options: Required<TopicToNodeOptions>,
): void {
  // 分离有坐标和无坐标的节点
  const nodesWithCoordinates: Node<TopicNodeData>[] = [];
  const nodesWithoutCoordinates: Node<TopicNodeData>[] = [];

  nodes.forEach((node) => {
    // 检查节点是否有存储的坐标数据
    const hasStoredCoordinates =
      node.data.metadata?.hasStoredCoordinates === true;

    // 如果有明确的坐标标记，或者坐标信息存在于 metadata 中
    const hasCoordinates =
      hasStoredCoordinates ||
      (node.data.metadata?.x !== undefined &&
        node.data.metadata?.y !== undefined &&
        !isNaN(Number(node.data.metadata.x)) &&
        !isNaN(Number(node.data.metadata.y)));

    if (hasCoordinates) {
      nodesWithCoordinates.push(node);
    } else {
      nodesWithoutCoordinates.push(node);
    }
  });

  // 按层级分组无坐标的节点
  const levelGroups = new Map<number, Node<TopicNodeData>[]>();

  nodesWithoutCoordinates.forEach((node) => {
    const level = node.data.level;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  // 对每个层级的无坐标节点进行位置优化
  levelGroups.forEach((levelNodes, level) => {
    const baseY = (options.levels[level]?.y || options.defaultPosition.y) + 100;

    levelNodes.forEach((node, index) => {
      const baseX = options.levels[level]?.x || options.defaultPosition.x;
      const offsetX = index * options.spacing.x;

      node.position = {
        x: baseX + offsetX,
        y: baseY + (index % 3) * 50, // 每3个节点稍微错开Y位置
      };
    });
  });

  // 可选：检测有坐标节点之间的重叠，并进行微调
  adjustOverlappingNodes(nodesWithCoordinates, options);
}

/**
 * 调整有坐标节点之间的重叠
 */
function adjustOverlappingNodes(
  nodes: Node<TopicNodeData>[], // eslint-disable-line @typescript-eslint/no-unused-vars
  _options: Required<TopicToNodeOptions>, // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
  const minDistance = 50; // 最小节点间距

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i];
      const node2 = nodes[j];

      const distance = Math.sqrt(
        Math.pow(node1.position.x - node2.position.x, 2) +
          Math.pow(node1.position.y - node2.position.y, 2),
      );

      // 如果节点距离太近，轻微调整第二个节点的位置
      if (distance < minDistance) {
        const angle = Math.atan2(
          node2.position.y - node1.position.y,
          node2.position.x - node1.position.x,
        );

        const adjustment = minDistance - distance;
        node2.position.x += Math.cos(angle) * adjustment;
        node2.position.y += Math.sin(angle) * adjustment;
      }
    }
  }
}

/**
 * 从 ReactFlow 节点提取 Topic 数据
 */
export function nodeToTopic(node: Node<TopicNodeData>): Topic {
  const data = node.data;
  return {
    id: data.topic_id,
    parent_id: data.parent_id,
    channel_id: "", // 需要从外部传入
    content: data.content,
    user_id: data.user_id,
    user_name: data.user_name,
    timestamp: data.timestamp,
    tags: data.tags,
    metadata: data.metadata,
  };
}

/**
 * 创建父子节点的连接线
 */
export function createParentChildEdge(
  parentId: string,
  childId: string,
  childTopic: Topic,
  childrenMap: Map<string, Topic[]>,
): Edge {
  // 计算连接线层级，用于样式区分
  const edgeLevel = calculateEdgeLevel(childTopic);

  // 获取同级子节点数量，用于路径规划
  const siblings = childrenMap.get(parentId) || [];
  const siblingIndex = siblings.findIndex((topic) => topic.id === childId);

  // 生成连接线样式
  const edgeStyle = generateEdgeStyle(edgeLevel, siblingIndex, siblings.length);

  return {
    id: `edge-${parentId}-${childId}`,
    source: `topic-${parentId}`,
    target: `topic-${childId}`,
    type: "smoothstep",
    animated: false,
    style: edgeStyle,
    // 添加路径偏移参数以避免重叠
    data: {
      edgeLevel,
      siblingIndex,
      totalSiblings: siblings.length,
    },
  };
}

/**
 * 计算连接线层级
 */
function calculateEdgeLevel(topic: Topic): number {
  if (!topic.parent_id) return 0;
  return 1; // 简化版，暂时只支持两层
}

/**
 * 生成连接线样式
 */
function generateEdgeStyle(
  level: number,
  siblingIndex: number,
  _totalSiblings: number,
): React.CSSProperties {
  const baseColors = [
    "#3B82F6", // 蓝色 - 层级0（实际上不会有）
    "#10B981", // 绿色 - 层级1
    "#F59E0B", // 橙色 - 层级2
    "#EF4444", // 红色 - 层级3
  ];

  const color = baseColors[Math.min(level, baseColors.length - 1)];

  // 根据同级子节点数量计算偏移，避免连接线重叠
  const offset = siblingIndex > 0 ? siblingIndex * 8 : 0;

  return {
    stroke: color,
    strokeWidth: 2,
    opacity: Math.max(0.7, 1 - level * 0.1), // 层级越深透明度越高
    // 添加轻微的曲线偏移
    transform: `translateY(${offset}px)`,
  };
}

/**
 * 优化连接线路径，避免交叉
 */
export function optimizeEdgePaths(edges: Edge[]): Edge[] {
  // 简单的路径优化算法
  return edges.map((edge) => {
    const siblingEdges = edges.filter(
      (e) => e.source === edge.source && e.id !== edge.id,
    );

    if (siblingEdges.length === 0) return edge;

    // 根据目标节点的Y位置重新排序连接线
    const sortedEdges = [edge, ...siblingEdges].sort((a, b) => {
      const aTargetY = parseInt(a.target.split("-")[1]) || 0;
      const bTargetY = parseInt(b.target.split("-")[1]) || 0;
      return aTargetY - bTargetY;
    });

    const currentIndex = sortedEdges.findIndex((e) => e.id === edge.id);
    const offset = currentIndex * 12; // 每条连接线偏移12px

    return {
      ...edge,
      style: {
        ...edge.style,
        transform: `translateY(${offset}px)`,
      },
    };
  });
}

/**
 * 更新现有节点数据
 */
export function updateNodeData(
  node: Node<TopicNodeData>,
  updates: Partial<TopicNodeData>,
): Node<TopicNodeData> {
  return {
    ...node,
    data: {
      ...node.data,
      ...updates,
    },
  };
}

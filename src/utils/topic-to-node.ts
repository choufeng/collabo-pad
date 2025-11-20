/**
 * Topic 到 ReactFlow 节点的数据转换工具
 */

import { Node, Edge, Position } from "@xyflow/react";
import type { Topic } from "@/types/redis-stream";
import { ExtendedNode } from "./node-hierarchy";

// 节点数据接口
export interface TopicNodeData extends Record<string, unknown> {
  label: string;
  content: string;
  level: number;
  parentId?: string;
  childIds?: string[];
  topicId: string;
  user_id: string;
  user_name: string;
  timestamp: number;
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

  return {
    id: `topic-${topic.id}`,
    type: "custom",
    position,
    data: {
      label,
      content: topic.content,
      level,
      parentId: topic.parent_id,
      topicId: topic.id,
      user_id: topic.user_id,
      user_name: topic.user_name,
      timestamp: topic.timestamp,
      tags: topic.tags,
      metadata: topic.metadata,
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
      const edge: Edge = {
        id: `edge-${topic.parent_id}-${topic.id}`,
        source: `topic-${topic.parent_id}`,
        target: `topic-${topic.id}`,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
      };
      edges.push(edge);
    }
  });

  // 优化节点位置，避免重叠
  optimizeNodePositions(nodes, childrenMap, opts);

  return { nodes, edges };
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
  // 基于层级的基础位置
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
 */
function optimizeNodePositions(
  nodes: Node<TopicNodeData>[],
  childrenMap: Map<string, Topic[]>,
  options: Required<TopicToNodeOptions>,
): void {
  // 按层级分组节点
  const levelGroups = new Map<number, Node<TopicNodeData>[]>();

  nodes.forEach((node) => {
    const level = node.data.level;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  // 对每个层级的节点进行位置优化
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
}

/**
 * 从 ReactFlow 节点提取 Topic 数据
 */
export function nodeToTopic(node: Node<TopicNodeData>): Topic {
  const data = node.data;
  return {
    id: data.topicId,
    parent_id: data.parentId,
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

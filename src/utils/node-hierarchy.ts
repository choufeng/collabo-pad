/**
 * 节点层级关系管理工具函数
 * 用于处理父子节点的创建、查询和管理操作
 */

import { Node, Edge } from "@xyflow/react";
import { NodeData } from "@/components/RightSidebar";

// 扩展节点数据接口，包含层级信息
export interface ExtendedNodeData extends NodeData {
  parentId?: string; // 父节点ID
  level?: number; // 节点层级，0为顶级节点
  childIds?: string[]; // 子节点ID列表
}

// 扩展节点类型
export interface ExtendedNode extends Node {
  data: ExtendedNodeData &
    Record<string, unknown> & {
      label: string;
      content: string;
      parentId?: string;
      level?: number;
      childIds?: string[];
    };
}

/**
 * 计算节点的层级深度
 * @param node 节点对象
 * @param nodes 所有节点列表
 * @returns 节点层级深度
 */
export function calculateNodeLevel(
  node: ExtendedNode,
  nodes: ExtendedNode[],
): number {
  if (!node.data.parentId) {
    return 0; // 顶级节点
  }

  const parentNode = nodes.find((n) => n.id === node.data.parentId);
  if (!parentNode) {
    return 0; // 如果找不到父节点，视为顶级节点
  }

  return calculateNodeLevel(parentNode, nodes) + 1;
}

/**
 * 获取节点的所有子节点
 * @param nodeId 父节点ID
 * @param nodes 所有节点列表
 * @returns 子节点列表
 */
export function getChildNodes(
  nodeId: string,
  nodes: ExtendedNode[],
): ExtendedNode[] {
  return nodes.filter((node) => node.data.parentId === nodeId);
}

/**
 * 获取节点的所有后代节点（递归）
 * @param nodeId 祖先节点ID
 * @param nodes 所有节点列表
 * @returns 所有后代节点列表
 */
export function getDescendantNodes(
  nodeId: string,
  nodes: ExtendedNode[],
): ExtendedNode[] {
  const childNodes = getChildNodes(nodeId, nodes);
  const allDescendants: ExtendedNode[] = [...childNodes];

  for (const child of childNodes) {
    const descendants = getDescendantNodes(child.id, nodes);
    allDescendants.push(...descendants);
  }

  return allDescendants;
}

/**
 * 获取节点的直接父节点
 * @param nodeId 子节点ID
 * @param nodes 所有节点列表
 * @returns 父节点对象或null
 */
export function getParentNode(
  nodeId: string,
  nodes: ExtendedNode[],
): ExtendedNode | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node?.data.parentId) {
    return null;
  }

  return nodes.find((n) => n.id === node.data.parentId) || null;
}

/**
 * 获取节点的根级祖先节点
 * @param nodeId 节点ID
 * @param nodes 所有节点列表
 * @returns 根节点对象
 */
export function getRootNode(
  nodeId: string,
  nodes: ExtendedNode[],
): ExtendedNode {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  if (!node.data.parentId) {
    return node; // 已经是根节点
  }

  return getRootNode(node.data.parentId, nodes);
}

/**
 * 检查是否会造成循环引用
 * @param parentId 潜在的父节点ID
 * @param childId 潜在的子节点ID
 * @param nodes 所有节点列表
 * @returns 是否会造成循环引用
 */
export function wouldCreateCycle(
  parentId: string,
  childId: string,
  nodes: ExtendedNode[],
): boolean {
  // 检查childId是否是parentId的祖先
  const descendants = getDescendantNodes(childId, nodes);
  return descendants.some((node) => node.id === parentId);
}

/**
 * 验证父子关系的有效性
 * @param parentId 父节点ID
 * @param childId 子节点ID
 * @param nodes 所有节点列表
 * @returns 验证结果
 */
export function validateParentChildRelation(
  parentId: string,
  childId: string,
  nodes: ExtendedNode[],
): { isValid: boolean; reason?: string } {
  // 检查节点是否存在
  const parentNode = nodes.find((n) => n.id === parentId);
  const childNode = nodes.find((n) => n.id === childId);

  if (!parentNode) {
    return { isValid: false, reason: `父节点 ${parentId} 不存在` };
  }

  if (!childNode) {
    return { isValid: false, reason: `子节点 ${childId} 不存在` };
  }

  // 检查是否会造成循环引用
  if (wouldCreateCycle(parentId, childId, nodes)) {
    return { isValid: false, reason: "会造成循环引用" };
  }

  // 检查是否已经是父子关系
  if (childNode.data.parentId === parentId) {
    return { isValid: false, reason: "节点已经是该父节点的子节点" };
  }

  return { isValid: true };
}

/**
 * 创建子节点数据
 * @param parentNode 父节点
 * @param content 子节点内容
 * @param nodes 所有节点列表（用于计算位置）
 * @returns 子节点对象
 */
export function createChildNodeData(
  parentNode: ExtendedNode,
  content: string,
  nodes: ExtendedNode[],
): Omit<ExtendedNode, "id"> {
  const parentLevel = parentNode.data.level || 0;
  const childLevel = parentLevel + 1;

  // 计算子节点位置（相对于父节点偏移）
  const existingChildren = getChildNodes(parentNode.id, nodes);
  const xOffset = 200; // 水平偏移
  const yOffset = existingChildren.length * 80; // 垂直偏移，每个子节点间隔80px

  return {
    type: "default",
    position: {
      x: parentNode.position.x + xOffset,
      y: parentNode.position.y + yOffset,
    },
    data: {
      label: content.substring(0, 30) + (content.length > 30 ? "..." : ""),
      content,
      parentId: parentNode.id,
      level: childLevel,
      childIds: [],
    },
  };
}

/**
 * 更新父子节点关系数据
 * @param parentNode 父节点
 * @param childNode 子节点
 * @param nodes 所有节点列表
 * @returns 更新后的节点列表
 */
export function updateParentChildRelation(
  parentNode: ExtendedNode,
  childNode: ExtendedNode,
  nodes: ExtendedNode[],
): ExtendedNode[] {
  return nodes.map((node) => {
    if (node.id === parentNode.id) {
      // 更新父节点的子节点ID列表
      const currentChildIds = node.data.childIds || [];
      const updatedChildIds = currentChildIds.includes(childNode.id)
        ? currentChildIds
        : [...currentChildIds, childNode.id];

      return {
        ...node,
        data: {
          ...node.data,
          childIds: updatedChildIds,
        },
      };
    }

    if (node.id === childNode.id) {
      // 更新子节点的父节点ID和层级
      return {
        ...node,
        data: {
          ...node.data,
          parentId: parentNode.id,
          level: (parentNode.data.level || 0) + 1,
        },
      };
    }

    return node;
  });
}

/**
 * 创建父子节点间的连接线
 * @param parentNode 父节点
 * @param childNode 子节点
 * @param edges 现有连接线列表
 * @returns 新的连接线对象
 */
export function createParentChildEdge(
  parentNode: ExtendedNode,
  childNode: ExtendedNode,
  edges: Edge[],
): Edge {
  const edgeId = `edge-${parentNode.id}-${childNode.id}`;

  // 检查连接线是否已存在
  const existingEdge = edges.find((e) => e.id === edgeId);
  if (existingEdge) {
    return existingEdge;
  }

  return {
    id: edgeId,
    source: parentNode.id,
    target: childNode.id,
    type: "smoothstep",
    style: {
      stroke: getParentChildEdgeStyle(childNode.data.level || 0).stroke,
      strokeWidth: getParentChildEdgeStyle(childNode.data.level || 0)
        .strokeWidth,
    },
    animated: true,
  };
}

/**
 * 根据层级获取连接线样式
 * @param level 节点层级
 * @returns 连接线样式配置
 */
function getParentChildEdgeStyle(level: number): {
  stroke: string;
  strokeWidth: number;
} {
  const colors = [
    "#3B82F6", // 蓝色 - 层级0
    "#10B981", // 绿色 - 层级1
    "#F59E0B", // 橙色 - 层级2
    "#EF4444", // 红色 - 层级3
    "#8B5CF6", // 紫色 - 层级4
  ];

  return {
    stroke: colors[level % colors.length],
    strokeWidth: Math.max(1, 3 - level * 0.5), // 层级越深，线条越细
  };
}

/**
 * 移除节点的所有子节点
 * @param nodeId 父节点ID
 * @param nodes 所有节点列表
 * @returns 移除子节点后的节点列表
 */
export function removeChildNodes(
  nodeId: string,
  nodes: ExtendedNode[],
): ExtendedNode[] {
  const childNodes = getChildNodes(nodeId, nodes);
  const nodeIdsToRemove = new Set<string>();

  // 递归收集所有需要移除的子节点ID
  const collectChildIds = (parentId: string) => {
    const children = getChildNodes(parentId, nodes);
    children.forEach((child) => {
      nodeIdsToRemove.add(child.id);
      collectChildIds(child.id);
    });
  };

  collectChildIds(nodeId);

  return nodes.filter((node) => !nodeIdsToRemove.has(node.id));
}

/**
 * 重新计算所有节点的层级
 * @param nodes 所有节点列表
 * @returns 更新层级后的节点列表
 */
export function recalculateNodeLevels(nodes: ExtendedNode[]): ExtendedNode[] {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      level: calculateNodeLevel(node, nodes),
    },
  }));
}

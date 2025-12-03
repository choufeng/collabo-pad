/**
 * 节点相关的工具函数
 */

/**
 * 移除节点ID中的 'topic-' 前缀，确保API接收原始的topic ID
 * @param nodeId - 可能包含 'topic-' 前缀的节点ID
 * @returns 清理后的节点ID（移除前缀后的原始ID）
 */
export function removeTopicPrefix(nodeId: string): string {
  return nodeId?.startsWith("topic-")
    ? nodeId.slice(6) // 移除 'topic-' 前缀
    : nodeId;
}

/**
 * 检查节点ID是否包含 'topic-' 前缀
 * @param nodeId - 要检查的节点ID
 * @returns 是否包含前缀
 */
export function hasTopicPrefix(nodeId: string): boolean {
  return nodeId?.startsWith("topic-") ?? false;
}

/**
 * 为节点ID添加 'topic-' 前缀
 * @param nodeId - 原始节点ID
 * @returns 添加前缀后的节点ID
 */
export function addTopicPrefix(nodeId: string): string {
  return hasTopicPrefix(nodeId) ? nodeId : `topic-${nodeId}`;
}

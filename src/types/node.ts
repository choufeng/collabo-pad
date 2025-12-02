/**
 * Node-related type definitions
 * These types were migrated from RightSidebar component to centralize shared types
 */

export type SidebarMode =
  | "create"
  | "edit"
  | "connection"
  | "child-comment"
  | "position-context"
  | null;

export interface NodeData {
  content: string;
  parentId?: string; // 父节点ID
  level?: number; // 节点层级，0为顶级节点
  childIds?: string[]; // 子节点ID列表
  creator?: string; // 节点创建者用户名
  user_id?: string; // 用户ID
  user_name?: string; // 用户名（与 creator 兼容）
  timestamp?: number; // 创建时间戳
  topicId?: string; // 主题ID
  tags?: string[]; // 标签
  metadata?: Record<string, unknown>; // 其他元数据
}

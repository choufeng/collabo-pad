// Redis Stream 相关类型定义

export interface StreamMessage {
  id: string;
  data: Record<string, string>;
}

export interface StreamInfo {
  length: number;
  radixTreeKeys: number;
  radixTreeNodes: number;
  lastGeneratedId: string;
  groups: number;
  firstEntry?: StreamMessage;
  lastEntry?: StreamMessage;
}

export interface StreamOperation {
  stream: string;
  action: "add" | "delete" | "update" | "clear" | "info";
  messageId?: string;
  data?: Record<string, string>;
}

export interface AddMessageRequest {
  stream: string;
  data: Record<string, string>;
}

export interface UpdateMessageRequest {
  stream: string;
  messageId: string;
  data: Record<string, string>;
}

export interface DeleteMessageRequest {
  stream: string;
  messageId: string;
}

export interface GetMessagesRequest {
  stream: string;
  start?: string;
  end?: string;
  count?: number;
}

export interface ClearStreamRequest {
  stream: string;
}

// API 响应类型
export interface StreamResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AddMessageResponse {
  messageId: string;
  stream: string;
}

export interface UpdateMessageResponse {
  newMessageId: string;
  stream: string;
  deletedCount: number;
}

export interface DeleteMessageResponse {
  deletedCount: number;
  messageId: string;
  stream: string;
}

export interface GetMessagesResponse {
  messages: StreamMessage[];
  total: number;
  stream: string;
}

export interface ClearStreamResponse {
  cleared: boolean;
  stream: string;
}

// 主题相关类型定义
export interface Topic {
  id: string;
  parent_id?: string;
  channel_id: string;
  content: string;
  translated_content?: string;
  user_id: string;
  user_name: string;
  timestamp: number;
  metadata?: Record<string, any>;
  tags?: string[];
  status?: "active" | "archived" | "deleted";
  /** 画布上的 x 坐标位置（像素） */
  x?: number;
  /** 画布上的 y 坐标位置（像素） */
  y?: number;
  /** 画布上的宽度（像素） */
  w?: number;
  /** 画布上的高度（像素） */
  h?: number;
}

export interface CreateTopicRequest {
  parent_id?: string;
  channel_id: string;
  content: string;
  user_id: string;
  user_name: string;
  metadata?: Record<string, any>;
  tags?: string[];
  /** 画布上的 x 坐标位置（像素） */
  x?: number;
  /** 画布上的 y 坐标位置（像素） */
  y?: number;
  /** 画布上的宽度（像素） */
  w?: number;
  /** 画布上的高度（像素） */
  h?: number;
}

export interface CreateTopicResponse {
  topic: Topic;
  messageId: string;
  success: boolean;
  message: string;
}

export interface TopicStreamMessage {
  id: string;
  topic: Topic;
  timestamp: number;
}

export interface ChannelTopicsResponse {
  topics: Topic[];
  total: number;
  channel_id: string;
  last_id?: string;
}

// SSE 相关类型定义
export interface SSEMessage {
  type: "connection" | "heartbeat" | "topic_created" | "error" | "history_data";
  data?: any;
  message?: string;
  timestamp: number;
  channel_id?: string;
  error?: string;
}

export interface SSEConnectionInfo {
  channel_id: string;
  connected_at: number;
  last_heartbeat: number;
}

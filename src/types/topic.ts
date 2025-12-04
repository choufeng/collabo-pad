/**
 * Topic 相关类型定义
 */

export interface Topic {
  id: string;
  channel_id: string;
  content: string;
  translated_content?: string;
  user_id: string;
  user_name: string;
  timestamp: number;
  parent_id?: string | null;
  metadata?: Record<string, any>;
  tags?: string[];
  status?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface CreateTopicRequest {
  channel_id: string;
  content: string;
  user_id: string;
  user_name: string;
  parent_id?: string | null;
  metadata?: Record<string, any>;
  tags?: string[];
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface CreateTopicResponse {
  success: boolean;
  topic?: Topic;
  error?: string;
  message?: string;
  messageId?: string;
}

export interface ChannelTopicsResponse {
  success: boolean;
  topics: Topic[];
  total?: number;
  channel_id?: string;
  last_id?: string;
  error?: string;
  message?: string;
}

export interface SSEMessage {
  type:
    | "topic_created"
    | "topic_updated"
    | "topic_deleted"
    | "connection"
    | "history_data"
    | "error"
    | "heartbeat";
  data?: Topic | { topics: Topic[] };
  timestamp: number;
  message?: string;
  channel_id: string;
}

/**
 * 应用全局类型定义
 */

// 用户相关类型
export interface UserInput {
  username: string;
}

export interface UserValidation {
  required: boolean;
  minLength: number;
  maxLength: number;
  pattern?: RegExp;
  customMessage?: string;
}

// 频道相关类型 - 简化后只保留必要的表单验证
export interface ChannelValidation {
  required: boolean;
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  customMessage?: string;
}

// 表单相关类型
export interface HomeFormData {
  username: string;
  channelId: string;
}

export interface FormErrors {
  username?: string;
  channelId?: string;
}

// 路由参数类型
export interface BoardPageParams {
  channelId: string;
}

// 验证规则类型
export interface ValidationRules {
  username: UserValidation;
  channelId: ChannelValidation;
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 组件 Props 类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 表单验证配置
export const VALIDATION_RULES: ValidationRules = {
  username: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^.+/, // 任意非空字符
    customMessage: "用户名不能为空",
  },
  channelId: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9]+$/, // 数字和字母，区分大小写
    customMessage: "频道ID只能包含字母和数字",
  },
};

// 错误消息类型 - 简化后移除频道相关错误
export const ERROR_MESSAGES = {
  EMPTY_USERNAME: "用户名不能为空",
  USERNAME_TOO_LONG: "用户名长度不能超过100个字符",
  EMPTY_CHANNEL_ID: "频道ID不能为空",
  CHANNEL_ID_TOO_LONG: "频道ID长度不能超过50个字符",
  INVALID_CHANNEL_ID: "频道ID只能包含字母和数字",
  USER_CREATION_FAILED: "用户创建失败",
  INVALID_CHANNEL_FORMAT: "无效的频道ID格式",
  LOGIN_FAILED: "登录失败",
} as const;

// 加载状态类型
export type LoadingState = "idle" | "loading" | "success" | "error";

// 应用状态类型
export interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

// 环境变量类型
export interface EnvConfig {
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
  NODE_ENV: "development" | "production" | "test";
}

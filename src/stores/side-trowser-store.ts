/**
 * SideTrowser状态管理
 * 基于Zustand的侧边栏状态管理Store
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

// 节点信息类型定义
export interface SelectedNode {
  id: string;
  type: string;
  data: Record<string, unknown>; // 使用更安全的类型替代any
  position: { x: number; y: number };
}

// 表单信息类型定义 - 只包含用户输入的字段
export interface TopicForm {
  // 必需字段 - 用户输入
  content: string;

  // 可选字段 - API可选
  parent_id?: string; // add child topic时有值，add topic时为空
  x?: number; // 画布x坐标
  y?: number; // 画布y坐标
  metadata?: Record<string, unknown>; // 元数据
  tags?: string[]; // 标签数组

  // 注意：channel_id, user_id, user_name 不存储在这里，
  // 在提交API时从路由参数和用户store动态获取
}

// SideTrowser状态接口
export interface SideTrowserState {
  // 基础状态
  isOpen: boolean;

  // 节点相关信息
  selectedNode: SelectedNode | null;

  // 表单相关信息
  form: TopicForm;
  formResponseLoading: boolean;

  // 操作方法
  open: () => void;
  close: () => void;
  toggle: () => void;

  // 节点操作方法
  setSelectedNode: (node: SelectedNode | null) => void;
  clearSelectedNode: () => void;

  // 表单操作方法
  updateForm: (form: Partial<TopicForm>) => void;
  setFormResponseLoading: (loading: boolean) => void;
  resetForm: () => void;

  // 重置状态
  reset: () => void;
}

// 创建SideTrowser状态Store
export const useSideTrowserStore = create<SideTrowserState>()(
  devtools(
    (set) => ({
      // 初始状态
      isOpen: false,
      selectedNode: null,
      form: {
        content: "",
        parent_id: undefined,
        x: undefined,
        y: undefined,
        metadata: undefined,
        tags: undefined,
      },
      formResponseLoading: false,

      // 基础操作方法
      open: () => {
        set({ isOpen: true }, false, "open");
      },

      close: () => {
        set({ isOpen: false }, false, "close");
      },

      toggle: () => {
        set((state) => ({ isOpen: !state.isOpen }), false, "toggle");
      },

      // 节点操作方法
      setSelectedNode: (node) => {
        set({ selectedNode: node }, false, "setSelectedNode");
      },

      clearSelectedNode: () => {
        set({ selectedNode: null }, false, "clearSelectedNode");
      },

      // 表单操作方法
      updateForm: (formData) => {
        console.log("SideTrowserStore updateForm 被调用，传入数据:", formData);
        console.log("更新前的表单状态:", useSideTrowserStore.getState().form);
        set(
          (state) => {
            const newForm = { ...state.form, ...formData };
            console.log("更新后的表单状态:", newForm);
            return {
              form: newForm,
            };
          },
          false,
          "updateForm",
        );
      },

      setFormResponseLoading: (loading) => {
        set({ formResponseLoading: loading }, false, "setFormResponseLoading");
      },

      resetForm: () => {
        set(
          {
            form: {
              content: "",
              parent_id: undefined,
              x: undefined,
              y: undefined,
              metadata: undefined,
              tags: undefined,
            },
          },
          false,
          "resetForm",
        );
      },

      // 完全重置状态
      reset: () => {
        set(
          {
            isOpen: false,
            selectedNode: null,
            form: {
              content: "",
              parent_id: undefined,
              x: undefined,
              y: undefined,
              metadata: undefined,
              tags: undefined,
            },
            formResponseLoading: false,
          },
          false,
          "reset",
        );
      },
    }),
    {
      name: "side-trowser-store",
      trace: true,
    },
  ),
);

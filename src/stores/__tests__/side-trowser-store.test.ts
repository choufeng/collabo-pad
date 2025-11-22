/**
 * SideTrowser Store单元测试
 */

import { renderHook } from "@testing-library/react";
import { useSideTrowserStore } from "../side-trowser-store";

// Import act from React directly
const { act } = require("react");

// Mock Zustand devtools以避免测试环境问题
jest.mock("zustand/middleware", () => ({
  devtools: (fn: any) => fn,
}));

describe("useSideTrowserStore", () => {
  beforeEach(() => {
    // 重置Zustand状态
    useSideTrowserStore.getState().reset();
  });

  describe("初始状态", () => {
    it("应该默认关闭状态", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("open操作", () => {
    it("应该能够打开侧边栏", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("重复调用open应该保持打开状态", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      act(() => {
        result.current.open();
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("close操作", () => {
    it("应该能够关闭侧边栏", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      // 先打开
      act(() => {
        result.current.open();
      });

      // 然后关闭
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("重复调用close应该保持关闭状态", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      act(() => {
        result.current.close();
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("toggle操作", () => {
    it("应该能够从关闭切换到打开", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      // 初始状态是关闭
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("应该能够从打开切换到关闭", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      // 先打开
      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      // 然后切换
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("应该支持多次连续切换", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      // 连续切换3次
      act(() => {
        result.current.toggle(); // false -> true
        result.current.toggle(); // true -> false
        result.current.toggle(); // false -> true
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("reset操作", () => {
    it("应该能够重置到初始关闭状态", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      // 先打开
      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      // 重置
      act(() => {
        result.current.reset();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("应该从任何状态重置到关闭状态", () => {
      const { result } = renderHook(() => useSideTrowserStore());

      // 执行多种操作
      act(() => {
        result.current.open();
        result.current.close();
        result.current.toggle();
        result.current.open();
      });

      // 重置
      act(() => {
        result.current.reset();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("状态变更的响应式更新", () => {
    it("多个hook实例应该共享同一状态", () => {
      const { result: result1 } = renderHook(() => useSideTrowserStore());
      const { result: result2 } = renderHook(() => useSideTrowserStore());

      // 通过第一个实例打开
      act(() => {
        result1.current.open();
      });

      // 两个实例都应该看到状态变更
      expect(result1.current.isOpen).toBe(true);
      expect(result2.current.isOpen).toBe(true);

      // 通过第二个实例切换
      act(() => {
        result2.current.toggle();
      });

      // 两个实例都应该看到状态变更
      expect(result1.current.isOpen).toBe(false);
      expect(result2.current.isOpen).toBe(false);
    });
  });
});

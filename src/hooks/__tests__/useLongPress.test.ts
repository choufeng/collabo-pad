import { renderHook, act } from "@testing-library/react";
import { useLongPress } from "../useLongPress";

// Mock navigator.vibrate
Object.defineProperty(navigator, "vibrate", {
  writable: true,
  value: jest.fn(),
});

// Mock performance.now for timing control
Object.defineProperty(window, "performance", {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
  },
});

describe("useLongPress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should trigger long press callback", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delay: 500 }),
    );

    // Simulate touch start
    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    // Fast forward time past 500ms
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalledWith(
      expect.objectContaining({
        clientX: 100,
        clientY: 200,
      }),
    );
  });

  it("should not trigger short press callback", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delay: 500 }),
    );

    // Simulate touch start
    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    // Fast forward time less than 500ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Simulate touch end
    act(() => {
      result.current.onTouchEnd();
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("should support configurable delay time", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delay: 1000 }),
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    // Fast forward time less than 1000ms
    act(() => {
      jest.advanceTimersByTime(900);
    });

    expect(onLongPress).not.toHaveBeenCalled();

    // Fast forward time past 1000ms
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onLongPress).toHaveBeenCalled();
  });

  it("应该在移动触摸时取消长按", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delay: 500 }),
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    // 模拟触摸移动超过阈值
    act(() => {
      result.current.onTouchMove({
        touches: [{ clientX: 120, clientY: 220 }],
      } as TouchEvent);
    });

    // 快进时间超过延迟
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("应该提供触觉反馈", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        delay: 500,
        hapticFeedback: true,
      }),
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(navigator.vibrate).toHaveBeenCalledWith(50);
  });

  it("应该可以禁用触觉反馈", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        delay: 500,
        hapticFeedback: false,
      }),
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("应该支持取消长按", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delay: 500 }),
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    // 取消长按
    act(() => {
      result.current.cancel();
    });

    // 快进时间超过延迟
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("应该处理多个触摸点", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delay: 500 }),
    );

    // 多点触摸应该取消长按
    act(() => {
      result.current.onTouchStart({
        touches: [
          { clientX: 100, clientY: 200 },
          { clientX: 150, clientY: 250 },
        ],
      } as TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("应该在组件卸载时清理定时器", () => {
    const onLongPress = jest.fn();

    const { result, unmount } = renderHook(() =>
      useLongPress({ onLongPress, delay: 500 }),
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    // 在长按触发前卸载组件
    unmount();

    // 快进时间超过延迟
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("应该支持移动阈值配置", () => {
    const onLongPress = jest.fn();

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        delay: 500,
        moveThreshold: 20,
      }),
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as TouchEvent);
    });

    // 移动小于阈值
    act(() => {
      result.current.onTouchMove({
        touches: [{ clientX: 115, clientY: 212 }],
      } as TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalled();
  });
});

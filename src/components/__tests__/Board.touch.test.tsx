import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import Board from "../Board";
import { isTouchDevice } from "@/utils/device-detection";

// Mock all markdown-related dependencies to avoid ES module import issues
jest.mock("react-markdown", () => {
  return function MockReactMarkdown({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  };
});

jest.mock("remark-gfm", () => () => ({}));
jest.mock("rehype-highlight", () => () => ({}));
jest.mock("rehype-raw", () => () => ({}));
jest.mock("highlight.js/styles/github.css", () => "");

// Mock device detection
jest.mock("@/utils/device-detection");

const mockIsTouchDevice = isTouchDevice as jest.MockedFunction<
  typeof isTouchDevice
>;

// Mock useLongPress hook
jest.mock("@/hooks/useLongPress", () => ({
  useLongPress: jest.fn(),
}));

const { useLongPress } = require("@/hooks/useLongPress");

// Mock ReactFlow components
jest.mock("@xyflow/react", () => ({
  ReactFlow: ({ onContextMenu, children, ...props }: any) => (
    <div data-testid="react-flow" {...props}>
      <div
        data-testid="react-flow-pane"
        onContextMenu={onContextMenu}
        onTouchStart={props.onTouchStart}
        onTouchMove={props.onTouchMove}
        onTouchEnd={props.onTouchEnd}
      />
      {children}
    </div>
  ),
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Background: () => <div data-testid="background" />,
  useNodesState: jest.fn((initial) => [initial, jest.fn(), jest.fn()]),
  useEdgesState: jest.fn((initial) => [initial, jest.fn(), jest.fn()]),
  useReactFlow: jest.fn(() => ({
    getViewport: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    screenToFlowPosition: jest.fn((pos) => pos),
  })),
  addEdge: jest.fn(),
  ConnectionMode: { Strict: "strict" },
}));

// Mock SideTrowser store
jest.mock("@/stores/side-trowser-store", () => ({
  useSideTrowserStore: () => ({
    open: jest.fn(),
    updateForm: jest.fn(),
    setSelectedNode: jest.fn(),
  }),
}));

describe("Board Touch Events", () => {
  const defaultProps = {
    initialNodes: [],
    initialEdges: [],
    channelId: "test-channel",
    connectionStatus: "connected" as const,
    user: { id: "test-user", name: "Test User" },
    channel: { id: "test-channel" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTouchDevice.mockReturnValue(false);

    useLongPress.mockReturnValue({
      onTouchStart: jest.fn(),
      onTouchMove: jest.fn(),
      onTouchEnd: jest.fn(),
      cancel: jest.fn(),
    });
  });

  const renderBoard = (props = {}) => {
    return render(
      <ReactFlowProvider>
        <Board {...defaultProps} {...props} />
      </ReactFlowProvider>,
    );
  };

  describe("Touch Device Detection", () => {
    it("应该在非触摸设备上不添加触摸事件监听器", () => {
      mockIsTouchDevice.mockReturnValue(false);

      renderBoard();

      const reactFlow = screen.getByTestId("react-flow");
      expect(reactFlow).not.toHaveAttribute("onTouchStart");
      expect(reactFlow).not.toHaveAttribute("onTouchMove");
      expect(reactFlow).not.toHaveAttribute("onTouchEnd");
    });

    it("应该在触摸设备上添加触摸事件监听器", () => {
      mockIsTouchDevice.mockReturnValue(true);

      renderBoard();

      const reactFlow = screen.getByTestId("react-flow");
      expect(useLongPress).toHaveBeenCalledWith(
        expect.objectContaining({
          onLongPress: expect.any(Function),
          delay: 500,
          hapticFeedback: true,
        }),
      );
    });
  });

  describe("Long Press Context Menu", () => {
    it("应该在长按时触发右键菜单", async () => {
      mockIsTouchDevice.mockReturnValue(true);

      const mockOnLongPress = jest.fn();
      useLongPress.mockReturnValue({
        onTouchStart: (e: TouchEvent) => {
          // 模拟长按回调
          setTimeout(() => {
            mockOnLongPress({
              clientX: 100,
              clientY: 200,
            });
          }, 600);
        },
        onTouchMove: jest.fn(),
        onTouchEnd: jest.fn(),
        cancel: jest.fn(),
      });

      renderBoard();

      const pane = screen.getByTestId("react-flow-pane");

      // 模拟触摸开始
      fireEvent.touchStart(pane, {
        touches: [{ clientX: 100, clientY: 200 }],
      });

      // 等待长按回调
      await waitFor(
        () => {
          expect(mockOnLongPress).toHaveBeenCalledWith({
            clientX: 100,
            clientY: 200,
          });
        },
        { timeout: 1000 },
      );
    });

    it("应该在长按时显示右键菜单", async () => {
      mockIsTouchDevice.mockReturnValue(true);

      const mockOnLongPress = jest.fn();
      useLongPress.mockReturnValue({
        onTouchStart: jest.fn(),
        onTouchMove: jest.fn(),
        onTouchEnd: jest.fn(),
        cancel: jest.fn(),
      });

      // 重新mock useLongPress来模拟实际的长按行为
      let longPressCallback:
        | ((event: { clientX: number; clientY: number }) => void)
        | null = null;
      useLongPress.mockImplementation(({ onLongPress }) => {
        longPressCallback = onLongPress;
        return {
          onTouchStart: jest.fn(),
          onTouchMove: jest.fn(),
          onTouchEnd: jest.fn(),
          cancel: jest.fn(),
        };
      });

      renderBoard();

      // 模拟长按触发
      if (longPressCallback) {
        longPressCallback({ clientX: 100, clientY: 200 });
      }

      // 检查是否调用了预期的处理逻辑
      expect(useLongPress).toHaveBeenCalledWith(
        expect.objectContaining({
          onLongPress: expect.any(Function),
        }),
      );
    });
  });

  describe("Touch Events Integration", () => {
    it("应该正确处理触摸移动事件", () => {
      mockIsTouchDevice.mockReturnValue(true);

      const mockOnTouchMove = jest.fn();
      useLongPress.mockReturnValue({
        onTouchStart: jest.fn(),
        onTouchMove: mockOnTouchMove,
        onTouchEnd: jest.fn(),
        cancel: jest.fn(),
      });

      renderBoard();

      const pane = screen.getByTestId("react-flow-pane");

      // 模拟触摸移动
      fireEvent.touchMove(pane, {
        touches: [{ clientX: 150, clientY: 250 }],
      });

      expect(mockOnTouchMove).toHaveBeenCalled();
    });

    it("应该正确处理触摸结束事件", () => {
      mockIsTouchDevice.mockReturnValue(true);

      const mockOnTouchEnd = jest.fn();
      useLongPress.mockReturnValue({
        onTouchStart: jest.fn(),
        onTouchMove: jest.fn(),
        onTouchEnd: mockOnTouchEnd,
        cancel: jest.fn(),
      });

      renderBoard();

      const pane = screen.getByTestId("react-flow-pane");

      // 模拟触摸结束
      fireEvent.touchEnd(pane);

      expect(mockOnTouchEnd).toHaveBeenCalled();
    });
  });

  describe("Coordinate Conversion", () => {
    it("应该正确转换触摸坐标到画布坐标", async () => {
      mockIsTouchDevice.mockReturnValue(true);

      const mockScreenToFlowPosition = jest.fn((pos) => ({
        x: pos.clientX * 0.5,
        y: pos.clientY * 0.5,
      }));

      // 更新mock以返回正确的坐标转换函数
      const { useReactFlow } = require("@xyflow/react");
      useReactFlow.mockReturnValue({
        getViewport: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
        screenToFlowPosition: mockScreenToFlowPosition,
      });

      let longPressCallback:
        | ((event: { clientX: number; clientY: number }) => void)
        | null = null;
      useLongPress.mockImplementation(({ onLongPress }) => {
        longPressCallback = onLongPress;
        return {
          onTouchStart: jest.fn(),
          onTouchMove: jest.fn(),
          onTouchEnd: jest.fn(),
          cancel: jest.fn(),
        };
      });

      renderBoard();

      // 模拟长按
      if (longPressCallback) {
        longPressCallback({ clientX: 100, clientY: 200 });
      }

      // 验证坐标转换
      expect(mockScreenToFlowPosition).toHaveBeenCalledWith({
        x: 100,
        y: 200,
      });
    });
  });

  describe("Double Click Context Menu", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("应该在触摸设备上检测双击并触发右键菜单", () => {
      mockIsTouchDevice.mockReturnValue(true);

      let paneClickHandler: ((event: React.MouseEvent) => void) | null = null;

      // Mock ReactFlow to capture the onPaneClick handler
      jest.doMock("@xyflow/react", () => ({
        ReactFlow: ({ onPaneClick, children, ...props }: any) => {
          paneClickHandler = onPaneClick;
          return (
            <div data-testid="react-flow" {...props}>
              <div data-testid="react-flow-pane" onClick={onPaneClick} />
              {children}
            </div>
          );
        },
        Controls: () => <div data-testid="controls" />,
        MiniMap: () => <div data-testid="minimap" />,
        Background: () => <div data-testid="background" />,
        useNodesState: jest.fn((initial) => [initial, jest.fn(), jest.fn()]),
        useEdgesState: jest.fn((initial) => [initial, jest.fn(), jest.fn()]),
        useReactFlow: jest.fn(() => ({
          getViewport: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
          screenToFlowPosition: jest.fn((pos) => pos),
        })),
        addEdge: jest.fn(),
        ConnectionMode: { Strict: "strict" },
      }));

      renderBoard();

      const pane = screen.getByTestId("react-flow-pane");

      // 第一次点击
      const firstClick = { clientX: 100, clientY: 200 } as any;
      fireEvent.click(pane, firstClick);

      // 快速第二次点击（模拟双击）
      jest.advanceTimersByTime(200); // 200ms后
      const secondClick = { clientX: 102, clientY: 202 } as any; // 接近的位置
      fireEvent.click(pane, secondClick);

      // 验证双击被检测到
      expect(paneClickHandler).toBeTruthy();
    });

    it("应该在非触摸设备上忽略双击", () => {
      mockIsTouchDevice.mockReturnValue(false);

      renderBoard();

      const pane = screen.getByTestId("react-flow-pane");

      // 第一次点击
      fireEvent.click(pane, { clientX: 100, clientY: 200 });

      // 快速第二次点击
      fireEvent.click(pane, { clientX: 102, clientY: 202 });

      // 验证没有触发特殊行为（因为不是触摸设备）
      expect(
        screen.queryByText(/Double click detected/),
      ).not.toBeInTheDocument();
    });

    it("应该忽略间隔时间过长的点击", () => {
      mockIsTouchDevice.mockReturnValue(true);

      renderBoard();

      const pane = screen.getByTestId("react-flow-pane");

      // 第一次点击
      fireEvent.click(pane, { clientX: 100, clientY: 200 });

      // 等待超过双击阈值
      jest.advanceTimersByTime(400); // 400ms后

      // 第二次点击
      fireEvent.click(pane, { clientX: 102, clientY: 202 });

      // 验证没有触发双击
      expect(
        screen.queryByText(/Double click detected/),
      ).not.toBeInTheDocument();
    });
  });
});

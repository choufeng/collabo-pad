import React from "react";
import { render, RenderResult } from "@testing-library/react";
import { NodeData } from "../../src/types/node";

export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  return render(ui, { wrapper: Wrapper, ...options });
};

export const createMockNodeData = (
  overrides: Partial<NodeData> = {},
): NodeData => ({
  content: "Default test content",
  ...overrides,
});

export const createMockNode = (overrides: any = {}) => ({
  id: "test-node-1",
  type: "default",
  position: { x: 100, y: 100 },
  data: {
    label: "Test Node",
    content: "Test content",
  },
  ...overrides,
});

export const createMockEdge = (overrides: any = {}) => ({
  id: "test-edge-1",
  source: "test-node-1",
  target: "test-node-2",
  type: "smoothstep",
  ...overrides,
});

export const fireEvent = async (
  element: HTMLElement,
  eventType: string,
  eventData = {},
) => {
  const event = new Event(eventType, {
    bubbles: true,
    cancelable: true,
    ...eventData,
  });
  element.dispatchEvent(event);
  return event;
};

export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Test for test utilities
describe("测试工具函数", () => {
  it("应该能创建模拟节点数据", () => {
    const nodeData = createMockNodeData({ content: "测试内容" });
    expect(nodeData.content).toBe("测试内容");
  });

  it("应该能创建模拟节点", () => {
    const node = createMockNode();
    expect(node.id).toBe("test-node-1");
    expect(node.data.content).toBe("Test content");
  });

  it("应该能创建模拟边", () => {
    const edge = createMockEdge();
    expect(edge.id).toBe("test-edge-1");
    expect(edge.source).toBe("test-node-1");
    expect(edge.target).toBe("test-node-2");
  });
});

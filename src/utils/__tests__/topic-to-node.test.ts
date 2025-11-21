/**
 * Topic-to-node 转换工具测试
 * 主要测试层级计算和连接线样式修复
 */

import { describe, it, expect } from "@jest/globals";
import { topicsToFlowElements } from "@/utils/topic-to-node";
import type { Topic } from "@/types/redis-stream";

describe("Topic-to-node 转换工具", () => {
  // 创建测试数据
  const createTestTopic = (
    id: string,
    content: string,
    parentId?: string,
    timestamp?: number,
  ): Topic => ({
    id,
    parent_id: parentId,
    channel_id: "test-channel",
    content,
    user_id: "user1",
    user_name: "Test User",
    timestamp: timestamp || Date.now(),
    tags: [],
    metadata: {},
  });

  describe("层级计算", () => {
    it("应该正确计算顶级节点的层级", () => {
      const topics = [
        createTestTopic("1", "顶级主题1"),
        createTestTopic("2", "顶级主题2"),
      ];

      const { nodes } = topicsToFlowElements(topics);

      expect(nodes).toHaveLength(2);
      expect(nodes[0].data.level).toBe(0);
      expect(nodes[1].data.level).toBe(0);
    });

    it("应该正确计算一级子节点的层级", () => {
      const topics = [
        createTestTopic("1", "父主题"),
        createTestTopic("2", "子主题", "1"),
      ];

      const { nodes } = topicsToFlowElements(topics);

      const parentNode = nodes.find((n) => n.data.topicId === "1");
      const childNode = nodes.find((n) => n.data.topicId === "2");

      expect(parentNode?.data.level).toBe(0);
      expect(childNode?.data.level).toBe(1);
    });

    it("应该正确计算多层嵌套的层级", () => {
      const topics = [
        createTestTopic("1", "根主题"),
        createTestTopic("2", "一级子主题", "1"),
        createTestTopic("3", "二级子主题", "2"),
        createTestTopic("4", "三级子主题", "3"),
      ];

      const { nodes } = topicsToFlowElements(topics);

      const node1 = nodes.find((n) => n.data.topicId === "1");
      const node2 = nodes.find((n) => n.data.topicId === "2");
      const node3 = nodes.find((n) => n.data.topicId === "3");
      const node4 = nodes.find((n) => n.data.topicId === "4");

      expect(node1?.data.level).toBe(0);
      expect(node2?.data.level).toBe(1);
      expect(node3?.data.level).toBe(2);
      expect(node4?.data.level).toBe(3);
    });

    it("应该检测并处理循环引用", () => {
      // 创建一个有循环引用的数据结构
      const topics = [
        createTestTopic("1", "主题1"),
        createTestTopic("2", "主题2", "1"),
        createTestTopic("3", "主题3", "2"),
        // 这个会导致循环：1 -> 2 -> 3 -> 1
      ];

      // 手动设置循环引用
      topics[0].parent_id = "3";

      // 在浏览器环境中会有 console.warn，但不应该崩溃
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const { nodes } = topicsToFlowElements(topics);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("检测到循环引用"),
      );

      // 应该仍然有节点，但层级计算会回到0
      expect(nodes).toHaveLength(3);

      consoleSpy.mockRestore();
    });
  });

  describe("连接线样式", () => {
    it("应该为父子关系创建连接线", () => {
      const topics = [
        createTestTopic("1", "父主题"),
        createTestTopic("2", "子主题", "1"),
      ];

      const { edges } = topicsToFlowElements(topics);

      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe("topic-1");
      expect(edges[0].target).toBe("topic-2");
      expect(edges[0].type).toBe("smoothstep");
      expect(edges[0].animated).toBe(true);
    });

    it("应该根据层级使用不同的连接线颜色", () => {
      const topics = [
        createTestTopic("1", "根主题"),
        createTestTopic("2", "一级子主题", "1"),
        createTestTopic("3", "二级子主题", "2"),
        createTestTopic("4", "三级子主题", "3"),
      ];

      const { edges } = topicsToFlowElements(topics);

      // 应该有3条连接线
      expect(edges).toHaveLength(3);

      // 检查颜色按层级变化
      const colors = edges.map((edge) => edge.style?.stroke);
      expect(colors[0]).toBe("#10B981"); // 层级1 -> 绿色
      expect(colors[1]).toBe("#F59E0B"); // 层级2 -> 橙色
      expect(colors[2]).toBe("#EF4444"); // 层级3 -> 红色
    });

    it("应该根据层级调整连接线粗细", () => {
      const topics = [
        createTestTopic("1", "根主题"),
        createTestTopic("2", "一级子主题", "1"),
        createTestTopic("3", "二级子主题", "2"),
      ];

      const { edges } = topicsToFlowElements(topics);

      const strokeWidths = edges.map((edge) => edge.style?.strokeWidth);

      // 层级越深，线条越细
      expect(strokeWidths[0]).toBeCloseTo(2.5); // 层级1
      expect(strokeWidths[1]).toBeCloseTo(2.0); // 层级2
    });

    it("所有连接线都应该启用动画", () => {
      const topics = [
        createTestTopic("1", "根主题"),
        createTestTopic("2", "一级子主题", "1"),
        createTestTopic("3", "二级子主题", "2"),
        createTestTopic("4", "另一个根主题"),
        createTestTopic("5", "另一个子主题", "4"),
      ];

      const { edges } = topicsToFlowElements(topics);

      // 所有连接线都应该有动画
      edges.forEach((edge) => {
        expect(edge.animated).toBe(true);
      });
    });
  });

  describe("节点布局", () => {
    it("应该优化节点位置避免重叠", () => {
      const topics = [
        createTestTopic("1", "主题1"),
        createTestTopic("2", "主题2"),
        createTestTopic("3", "主题3"),
      ];

      const { nodes } = topicsToFlowElements(topics);

      const positions = nodes.map((node) => node.position);

      // 节点位置应该不同，避免重叠
      const uniqueXPositions = new Set(positions.map((p) => p.x));
      const uniqueYPositions = new Set(positions.map((p) => p.y));

      expect(uniqueXPositions.size).toBeGreaterThan(1);
      expect(uniqueYPositions.size).toBeGreaterThan(0);
    });

    it("应该为不同层级的节点设置不同的X偏移", () => {
      const topics = [
        createTestTopic("1", "根主题"),
        createTestTopic("2", "一级子主题", "1"),
        createTestTopic("3", "二级子主题", "2"),
      ];

      const { nodes } = topicsToFlowElements(topics);

      const root = nodes.find((n) => n.data.topicId === "1");
      const child1 = nodes.find((n) => n.data.topicId === "2");
      const child2 = nodes.find((n) => n.data.topicId === "3");

      // 子节点应该比父节点有更大的X坐标
      expect(child1?.position.x).toBeGreaterThan(root?.position.x || 0);
      expect(child2?.position.x).toBeGreaterThan(child1?.position.x || 0);
    });
  });

  describe("错误处理", () => {
    it("应该处理空的主题数组", () => {
      const { nodes, edges } = topicsToFlowElements([]);

      expect(nodes).toHaveLength(0);
      expect(edges).toHaveLength(0);
    });

    it("应该处理不存在的父节点引用", () => {
      const topics = [createTestTopic("1", "子主题", "nonexistent-parent")];

      // 不应该抛出错误
      expect(() => {
        const { nodes } = topicsToFlowElements(topics);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].data.level).toBe(0); // 找不到父节点，视为顶级节点
      }).not.toThrow();
    });
  });
});

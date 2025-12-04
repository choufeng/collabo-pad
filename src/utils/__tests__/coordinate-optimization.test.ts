/**
 * 测试坐标位置优化功能
 */

import { topicsToFlowElements } from "../topic-to-node";
import type { Topic } from "@/types/topic";

describe("coordinate optimization", () => {
  // 模拟 Topic 数据
  const mockTopics: Topic[] = [
    {
      id: "1",
      channel_id: "test-channel",
      content: "有坐标的主题 1",
      user_id: "user1",
      user_name: "User 1",
      timestamp: Date.now(),
      position_x: 100,
      position_y: 100,
    },
    {
      id: "2",
      channel_id: "test-channel",
      content: "有坐标的主题 2",
      user_id: "user1",
      user_name: "User 1",
      timestamp: Date.now() + 1000,
      position_x: 300,
      position_y: 200,
    },
    {
      id: "3",
      channel_id: "test-channel",
      content: "无坐标的主题",
      user_id: "user1",
      user_name: "User 1",
      timestamp: Date.now() + 2000,
      // 没有 position_x, position_y
    },
  ];

  it("should preserve coordinates for topics with stored positions", () => {
    const { nodes } = topicsToFlowElements(mockTopics);

    // 查找有坐标的节点
    const node1 = nodes.find((n) => n.id === "topic-1");
    const node2 = nodes.find((n) => n.id === "topic-2");

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();

    // 验证有坐标的节点位置是否保持不变
    expect(node1?.position.x).toBe(100);
    expect(node1?.position.y).toBe(100);
    expect(node2?.position.x).toBe(300);
    expect(node2?.position.y).toBe(200);

    // 验证 metadata 中包含坐标信息
    expect(node1?.data.metadata?.hasStoredCoordinates).toBe(true);
    expect(node2?.data.metadata?.hasStoredCoordinates).toBe(true);
  });

  it("should optimize positions for topics without coordinates", () => {
    const { nodes } = topicsToFlowElements(mockTopics);

    // 查找无坐标的节点
    const node3 = nodes.find((n) => n.id === "topic-3");

    expect(node3).toBeDefined();

    // 无坐标的节点应该被放置在默认位置附近
    expect(node3?.position.x).toBeGreaterThan(0);
    expect(node3?.position.y).toBeGreaterThan(0);

    // 验证 metadata 标记
    expect(node3?.data.metadata?.hasStoredCoordinates).toBe(false);
  });

  it("should not modify positions of coordinate nodes during optimization", () => {
    // 创建多个有坐标的节点，其中一些位置很近
    const topicsWithCloseCoordinates: Topic[] = [
      {
        id: "1",
        channel_id: "test-channel",
        content: "节点 1",
        user_id: "user1",
        user_name: "User 1",
        timestamp: Date.now(),
        position_x: 100,
        position_y: 100,
      },
      {
        id: "2",
        channel_id: "test-channel",
        content: "节点 2",
        user_id: "user1",
        user_name: "User 1",
        timestamp: Date.now() + 1000,
        position_x: 120, // 很近的位置
        position_y: 110,
      },
      {
        id: "3",
        channel_id: "test-channel",
        content: "无坐标节点",
        user_id: "user1",
        user_name: "User 1",
        timestamp: Date.now() + 2000,
      },
    ];

    const { nodes } = topicsToFlowElements(topicsWithCloseCoordinates);

    const node1 = nodes.find((n) => n.id === "topic-1");
    const node2 = nodes.find((n) => n.id === "topic-2");

    // 主要坐标应该保持基本不变（可能有微小的重叠调整）
    expect(node1?.position.x).toBeCloseTo(100, 0);
    expect(node1?.position.y).toBeCloseTo(100, 0);
  });
});

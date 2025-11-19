/**
 * node-hierarchy 工具函数测试
 */

import {
  ExtendedNode,
  ExtendedNodeData,
  createChildNodeData,
  calculateNodeLevel,
  getChildNodes,
  wouldCreateCycle,
} from "../node-hierarchy";

describe("node-hierarchy", () => {
  // 创建测试用的父节点
  const createTestParentNode = (): ExtendedNode => ({
    id: "parent-1",
    type: "default",
    position: { x: 100, y: 100 },
    data: {
      label: "Parent Node",
      content: "This is a parent node",
      level: 0,
      childIds: [],
      creator: "testUser",
    },
  });

  // 创建测试用节点数组
  const createTestNodes = (): ExtendedNode[] => [
    createTestParentNode(),
    {
      id: "child-1",
      type: "default",
      position: { x: 300, y: 100 },
      data: {
        label: "Child Node 1",
        content: "This is a child node",
        parentId: "parent-1",
        level: 1,
        childIds: [],
        creator: "testUser",
      },
    },
  ];

  describe("createChildNodeData", () => {
    it("应该创建包含创建者信息的子节点数据", () => {
      const parentNode = createTestParentNode();
      const nodes = createTestNodes();
      const creator = "newUser";

      const childNodeData = createChildNodeData(
        parentNode,
        "New child content",
        nodes,
        creator,
      );

      expect(childNodeData.data.creator).toBe(creator);
      expect(childNodeData.data.content).toBe("New child content");
      expect(childNodeData.data.parentId).toBe(parentNode.id);
      expect(childNodeData.data.level).toBe(1);
    });

    it("应该在没有创建者信息时正常工作", () => {
      const parentNode = createTestParentNode();
      const nodes = createTestNodes();

      const childNodeData = createChildNodeData(
        parentNode,
        "New child content",
        nodes,
      );

      expect(childNodeData.data.creator).toBeUndefined();
      expect(childNodeData.data.content).toBe("New child content");
      expect(childNodeData.data.parentId).toBe(parentNode.id);
    });

    it("应该根据现有子节点数量计算正确的位置", () => {
      const parentNode = createTestParentNode();
      const nodes = createTestNodes(); // 包含1个子节点

      const childNodeData = createChildNodeData(
        parentNode,
        "New child content",
        nodes,
      );

      expect(childNodeData.position.x).toBe(parentNode.position.x + 200);
      expect(childNodeData.position.y).toBe(parentNode.position.y + 80); // 1 * 80
    });

    it("应该正确截断长内容作为标签", () => {
      const parentNode = createTestParentNode();
      const nodes = createTestNodes();
      const longContent =
        "This is a very long content that should be truncated";

      const childNodeData = createChildNodeData(parentNode, longContent, nodes);

      expect(childNodeData.data.label).toBe(
        "This is a very long content th...",
      );
      expect(childNodeData.data.content).toBe(longContent);
    });
  });

  describe("数据结构兼容性", () => {
    it("应该支持没有creator字段的旧节点数据", () => {
      const oldNodeData: ExtendedNodeData = {
        content: "Old node content",
        level: 0,
        childIds: [],
      };

      expect(oldNodeData.content).toBe("Old node content");
      expect(oldNodeData.creator).toBeUndefined();
    });

    it("应该支持有creator字段的新节点数据", () => {
      const newNodeData: ExtendedNodeData = {
        content: "New node content",
        level: 0,
        childIds: [],
        creator: "testUser",
      };

      expect(newNodeData.content).toBe("New node content");
      expect(newNodeData.creator).toBe("testUser");
    });
  });

  describe("现有的工具函数应该正常工作", () => {
    it("calculateNodeLevel 应该正确计算节点层级", () => {
      const nodes = createTestNodes();
      const childNode = nodes.find((n) => n.id === "child-1")!;

      const level = calculateNodeLevel(childNode, nodes);

      expect(level).toBe(1);
    });

    it("getChildNodes 应该正确获取子节点", () => {
      const nodes = createTestNodes();

      const children = getChildNodes("parent-1", nodes);

      expect(children).toHaveLength(1);
      expect(children[0].id).toBe("child-1");
    });

    it("wouldCreateCycle 应该正确检测循环引用", () => {
      const nodes = createTestNodes();

      const wouldCycle = wouldCreateCycle("parent-1", "child-1", nodes);

      expect(wouldCycle).toBe(false);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Add TextEncoder polyfill for Node.js test environment
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;

// Mock drizzle-orm
jest.mock("../../database/drizzle", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock schema
jest.mock("../../database/schema", () => ({
  topics: {
    id: "id",
    channelId: "channel_id",
    parentId: "parent_id",
    userId: "user_id",
    username: "username",
    content: "content",
    x: "x",
    y: "y",
    w: "w",
    h: "h",
    metadata: "metadata",
    tags: "tags",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  eq: jest.fn(),
  and: jest.fn(),
  isNull: jest.fn(),
  not: jest.fn(),
  desc: jest.fn(),
}));

describe("TopicService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      DATABASE_URL:
        "postgresql://postgres:postgres_dev@localhost:9198/collabo_pad_db?schema=public",
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  it("should have TopicService class available", () => {
    expect(() => {
      require("../../services/TopicService");
    }).not.toThrow();
  });

  it("should export TopicService as a class", async () => {
    const { TopicService } = require("../../services/TopicService");

    expect(TopicService).toBeDefined();
    expect(typeof TopicService).toBe("function");
    expect(new TopicService()).toBeInstanceOf(TopicService);
  });

  it("should have CRUD methods defined", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    // Check that all required methods exist
    expect(typeof topicService.create).toBe("function");
    expect(typeof topicService.update).toBe("function");
    expect(typeof topicService.delete).toBe("function");
    expect(typeof topicService.findById).toBe("function");
    expect(typeof topicService.findByChannelId).toBe("function");
    expect(typeof topicService.findChildren).toBe("function");
    expect(typeof topicService.findHierarchy).toBe("function");
    expect(typeof topicService.findRootTopics).toBe("function");
  });

  it("should create a topic successfully", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const mockTopicData = {
      channelId: "test-channel-id",
      userId: "test-user-id",
      username: "Test User",
      content: "Test topic content",
      x: "100.50",
      y: "200.75",
      w: "300.00",
      h: "150.25",
      metadata: { priority: "high" },
      tags: ["test", "sample"],
    };

    // Mock the database operations
    const mockDb = require("../../database/drizzle").db;
    const mockInsert = mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          {
            id: "generated-topic-id",
            ...mockTopicData,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      }),
    });

    const result = await topicService.create(mockTopicData);

    expect(result).toBeDefined();
    expect(result.id).toBe("generated-topic-id");
    expect(result.channelId).toBe(mockTopicData.channelId);
    expect(result.userId).toBe(mockTopicData.userId);
    expect(result.content).toBe(mockTopicData.content);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("should handle create topic errors gracefully", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const mockTopicData = {
      channelId: "test-channel-id",
      userId: "test-user-id",
      username: "Test User",
      content: "Test topic content",
    };

    // Mock database error
    const mockDb = require("../../database/drizzle").db;
    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockRejectedValue(new Error("Database connection failed")),
      }),
    });

    await expect(topicService.create(mockTopicData)).rejects.toThrow(
      "Database connection failed",
    );
  });

  it("should find topic by id successfully", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const topicId = "test-topic-id";
    const mockTopic = {
      id: topicId,
      channelId: "test-channel-id",
      userId: "test-user-id",
      username: "Test User",
      content: "Test topic content",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock database operations
    const mockDb = require("../../database/drizzle").db;
    const mockSelect = mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockTopic]),
        }),
      }),
    });

    const result = await topicService.findById(topicId);

    expect(result).toBeDefined();
    expect(result.id).toBe(topicId);
    expect(result.content).toBe("Test topic content");
    expect(mockSelect).toHaveBeenCalled();
  });

  it("should return null when topic not found by id", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const topicId = "non-existent-topic-id";

    // Mock database operations returning empty array
    const mockDb = require("../../database/drizzle").db;
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await topicService.findById(topicId);

    expect(result).toBeNull();
  });

  it("should find topics by channel id successfully", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const channelId = "test-channel-id";
    const mockTopics = [
      {
        id: "topic-1",
        channelId,
        content: "Topic 1 content",
        createdAt: new Date(),
      },
      {
        id: "topic-2",
        channelId,
        content: "Topic 2 content",
        createdAt: new Date(),
      },
    ];

    // Mock database operations
    const mockDb = require("../../database/drizzle").db;
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockTopics),
        }),
      }),
    });

    const result = await topicService.findByChannelId(channelId);

    expect(result).toHaveLength(2);
    expect(result[0].channelId).toBe(channelId);
    expect(result[1].channelId).toBe(channelId);
  });

  it("should find children topics successfully", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const parentId = "parent-topic-id";
    const mockChildren = [
      {
        id: "child-1",
        parentId,
        content: "Child topic 1",
        createdAt: new Date(),
      },
      {
        id: "child-2",
        parentId,
        content: "Child topic 2",
        createdAt: new Date(),
      },
    ];

    // Mock database operations
    const mockDb = require("../../database/drizzle").db;
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockChildren),
        }),
      }),
    });

    const result = await topicService.findChildren(parentId);

    expect(result).toHaveLength(2);
    expect(result[0].parentId).toBe(parentId);
    expect(result[1].parentId).toBe(parentId);
  });

  it("should find root topics (no parent) successfully", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const channelId = "test-channel-id";
    const mockRootTopics = [
      {
        id: "root-1",
        channelId,
        parentId: null,
        content: "Root topic 1",
        createdAt: new Date(),
      },
      {
        id: "root-2",
        channelId,
        parentId: null,
        content: "Root topic 2",
        createdAt: new Date(),
      },
    ];

    // Mock database operations
    const mockDb = require("../../database/drizzle").db;
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockRootTopics),
        }),
      }),
    });

    const result = await topicService.findRootTopics(channelId);

    expect(result).toHaveLength(2);
    expect(result[0].parentId).toBeNull();
    expect(result[1].parentId).toBeNull();
  });

  it("should build topic hierarchy correctly", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const channelId = "test-channel-id";
    const mockTopics = [
      {
        id: "root-1",
        channelId,
        parentId: null,
        content: "Root topic",
        createdAt: new Date(),
      },
      {
        id: "child-1",
        channelId,
        parentId: "root-1",
        content: "Child topic 1",
        createdAt: new Date(),
      },
      {
        id: "child-2",
        channelId,
        parentId: "root-1",
        content: "Child topic 2",
        createdAt: new Date(),
      },
      {
        id: "grandchild-1",
        channelId,
        parentId: "child-1",
        content: "Grandchild topic 1",
        createdAt: new Date(),
      },
    ];

    // Mock database operations
    const mockDb = require("../../database/drizzle").db;
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockTopics),
        }),
      }),
    });

    const result = await topicService.findHierarchy(channelId);

    expect(result).toHaveLength(1); // Should have 1 root topic
    expect(result[0].id).toBe("root-1");
    expect(result[0].children).toHaveLength(2); // Root should have 2 children
    expect(result[0].children[0].id).toBe("child-1");
    expect(result[0].children[0].children).toHaveLength(1); // Child 1 should have 1 grandchild
    expect(result[0].children[0].children[0].id).toBe("grandchild-1");
  });

  it("should update a topic successfully", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const topicId = "test-topic-id";
    const updateData = {
      content: "Updated content",
      x: "150.75",
      y: "250.50",
    };

    const mockUpdatedTopic = {
      id: topicId,
      ...updateData,
      updatedAt: new Date(),
    };

    // Mock database operations
    const mockDb = require("../../database/drizzle").db;
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUpdatedTopic]),
        }),
      }),
    });

    const result = await topicService.update(topicId, updateData);

    expect(result).toBeDefined();
    expect(result.id).toBe(topicId);
    expect(result.content).toBe("Updated content");
    expect(result.x).toBe("150.75");
  });

  it("should handle update topic not found", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const topicId = "non-existent-topic-id";
    const updateData = { content: "Updated content" };

    // Mock database operations returning empty array
    const mockDb = require("../../database/drizzle").db;
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await topicService.update(topicId, updateData);

    expect(result).toBeNull();
  });

  it("should delete a topic successfully", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const topicId = "test-topic-id";
    const mockDeletedTopic = {
      id: topicId,
      content: "Deleted topic",
      createdAt: new Date(),
    };

    // Mock database operations
    const mockDb = require("../../database/drizzle").db;

    // Mock findById for the topic that will be deleted
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockDeletedTopic]),
        }),
      }),
    });

    // Mock delete operation
    mockDb.delete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockDeletedTopic]),
      }),
    });

    const result = await topicService.delete(topicId);

    expect(result).toBeDefined();
    expect(result.id).toBe(topicId);
  });

  it("should handle delete topic not found", async () => {
    const { TopicService } = require("../../services/TopicService");
    const topicService = new TopicService();

    const topicId = "non-existent-topic-id";

    // Mock database operations returning empty array
    const mockDb = require("../../database/drizzle").db;

    // Mock findById returning null
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await topicService.delete(topicId);

    expect(result).toBeNull();
  });
});

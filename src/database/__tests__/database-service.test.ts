/**
 * 数据库服务测试
 * 遵循 TDD 原则：先写测试，再写实现
 */

import { DatabaseServiceImpl } from "../database-service";
import { User, Channel } from "../types";

// Mock Dexie 实现
class MockDexie {
  private tables = new Map();

  table(name: string) {
    if (!this.tables.has(name)) {
      this.tables.set(name, new MockTable());
    }
    return this.tables.get(name);
  }

  async open() {
    return Promise.resolve();
  }
}

class MockTable {
  private data = new Map();

  async add(item: any) {
    const id = item.id || this.generateId();
    this.data.set(id, { ...item, id });
    return id;
  }

  async get(id: string) {
    return this.data.get(id);
  }

  async where(field: string) {
    return new MockWhereClause(this.data, field);
  }

  async update(id: string, changes: any) {
    const existing = this.data.get(id);
    if (existing) {
      this.data.set(id, { ...existing, ...changes });
      return 1;
    }
    return 0;
  }

  async delete(id: string) {
    const existed = this.data.has(id);
    this.data.delete(id);
    return existed ? 1 : 0;
  }

  private generateId() {
    return "mock-id-" + Math.random().toString(36).substr(2, 9);
  }
}

class MockWhereClause {
  constructor(
    private data: Map,
    private field: string,
  ) {}

  async equals(value: any) {
    const results = Array.from(this.data.values()).filter(
      (item) => item[this.field] === value,
    );
    return {
      first: async () => results[0] || undefined,
      toArray: async () => results,
    };
  }
}

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  })),
};

// 设置全局 mock
Object.defineProperty(window, "indexedDB", {
  value: mockIndexedDB,
  writable: true,
});

describe("DatabaseService", () => {
  let databaseService: DatabaseServiceImpl;

  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks();
    databaseService = new DatabaseServiceImpl();
  });

  describe("用户数据操作", () => {
    it("应该能够创建新用户", async () => {
      // Arrange
      const userData = {
        username: "testuser",
      };

      // Act
      const result = await databaseService.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.username).toBe("testuser");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("应该能够通过 ID 获取用户", async () => {
      // Arrange
      const userData = { username: "testuser" };
      const createdUser = await databaseService.createUser(userData);

      // Act
      const foundUser = await databaseService.getUser(createdUser.id);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.username).toBe("testuser");
    });

    it("应该能够通过用户名获取用户", async () => {
      // Arrange
      const userData = { username: "testuser" };
      await databaseService.createUser(userData);

      // Act
      const foundUser = await databaseService.getUserByUsername("testuser");

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe("testuser");
    });

    it("应该能够更新用户信息", async () => {
      // Arrange
      const userData = { username: "testuser" };
      const createdUser = await databaseService.createUser(userData);

      // Act
      const updatedUser = await databaseService.updateUser(createdUser.id, {
        username: "updateduser",
      });

      // Assert
      expect(updatedUser).toBeDefined();
      expect(updatedUser.username).toBe("updateduser");
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        createdUser.updatedAt.getTime(),
      );
    });

    it("应该能够删除用户", async () => {
      // Arrange
      const userData = { username: "testuser" };
      const createdUser = await databaseService.createUser(userData);

      // Act
      await databaseService.deleteUser(createdUser.id);

      // Assert
      const deletedUser = await databaseService.getUser(createdUser.id);
      expect(deletedUser).toBeUndefined();
    });

    it("重复的用户名应该返回现有用户", async () => {
      // Arrange
      const userData = { username: "testuser" };
      const firstUser = await databaseService.createUser(userData);

      // Act
      const secondUser = await databaseService.createUser(userData);

      // Assert
      expect(secondUser.id).toBe(firstUser.id);
      expect(secondUser.username).toBe(firstUser.username);
    });
  });

  describe("频道数据操作", () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await databaseService.createUser({ username: "testuser" });
    });

    it("应该能够创建新频道", async () => {
      // Arrange
      const channelData = {
        id: "test-channel",
        name: "测试频道",
        userId: testUser.id,
      };

      // Act
      const result = await databaseService.createChannel(channelData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe("test-channel");
      expect(result.name).toBe("测试频道");
      expect(result.userId).toBe(testUser.id);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("应该能够通过 ID 获取频道", async () => {
      // Arrange
      const channelData = {
        id: "test-channel",
        userId: testUser.id,
      };
      const createdChannel = await databaseService.createChannel(channelData);

      // Act
      const foundChannel = await databaseService.getChannel("test-channel");

      // Assert
      expect(foundChannel).toBeDefined();
      expect(foundChannel?.id).toBe("test-channel");
      expect(foundChannel?.userId).toBe(testUser.id);
    });

    it("应该能够获取用户的所有频道", async () => {
      // Arrange
      await databaseService.createChannel({
        id: "channel1",
        userId: testUser.id,
      });
      await databaseService.createChannel({
        id: "channel2",
        userId: testUser.id,
      });

      // Act
      const userChannels = await databaseService.getChannelsByUser(testUser.id);

      // Assert
      expect(userChannels).toHaveLength(2);
      expect(userChannels.map((c) => c.id)).toContain("channel1");
      expect(userChannels.map((c) => c.id)).toContain("channel2");
    });

    it("重复的频道ID应该返回现有频道", async () => {
      // Arrange
      const channelData = { id: "test-channel", userId: testUser.id };
      const firstChannel = await databaseService.createChannel(channelData);

      // Act
      const secondChannel = await databaseService.createChannel(channelData);

      // Assert
      expect(secondChannel.id).toBe(firstChannel.id);
      expect(secondChannel.userId).toBe(firstChannel.userId);
    });
  });

  describe("会话数据操作", () => {
    it("应该能够获取用户会话", async () => {
      // Act
      const session = await databaseService.getUserSession();

      // Assert
      expect(session).toBeDefined();
      expect(session.id).toBe("current_session");
      expect(session.lastActiveAt).toBeInstanceOf(Date);
    });

    it("应该能够更新用户会话", async () => {
      // Arrange
      const userId = "user-123";
      const channelId = "channel-123";

      // Act
      const updatedSession = await databaseService.updateUserSession({
        currentUserId: userId,
        currentChannelId: channelId,
      });

      // Assert
      expect(updatedSession.currentUserId).toBe(userId);
      expect(updatedSession.currentChannelId).toBe(channelId);
      expect(updatedSession.lastActiveAt).toBeInstanceOf(Date);
    });

    it("应该能够清除用户会话", async () => {
      // Arrange
      await databaseService.updateUserSession({
        currentUserId: "user-123",
        currentChannelId: "channel-123",
      });

      // Act
      await databaseService.clearUserSession();

      // Assert
      const session = await databaseService.getUserSession();
      expect(session.currentUserId).toBeNull();
      expect(session.currentChannelId).toBeNull();
    });
  });
});

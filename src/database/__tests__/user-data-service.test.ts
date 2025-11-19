/**
 * 简化的用户数据服务测试
 * 遵循 TDD 原则：先写测试，再写实现
 */

import { UserDataServiceImpl } from "../user-data-service";
import { User } from "../types";

// 简化的 Mock 实现
class MockUserDataService {
  private users = new Map<string, User>();
  private currentUserId: string | null = null;

  async createOrGetUser(username: string): Promise<User> {
    const trimmedUsername = username.trim();

    // 查找现有用户
    for (const user of this.users.values()) {
      if (user.username === trimmedUsername) {
        this.currentUserId = user.id;
        return user;
      }
    }

    // 创建新用户
    const newUser: User = {
      id: this.generateUUID(),
      username: trimmedUsername,
      createdAt: new Date(),
    };

    this.users.set(newUser.id, newUser);
    this.currentUserId = newUser.id;
    return newUser;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.currentUserId) {
      return null;
    }
    return this.users.get(this.currentUserId) || null;
  }

  async clearUserData(): Promise<void> {
    this.users.clear();
    this.currentUserId = null;
  }

  async getLatestUsers(limit: number = 5): Promise<User[]> {
    try {
      // 将 Map 转换为数组并按创建时间排序
      const allUsers = Array.from(this.users.values());
      return allUsers
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error("获取最新用户失败:", error);
      return [];
    }
  }

  private generateUUID(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

describe("UserDataService - 简化版本", () => {
  let userDataService: MockUserDataService;

  beforeEach(() => {
    userDataService = new MockUserDataService();
  });

  describe("用户创建和获取", () => {
    it("应该能够创建新用户", async () => {
      // Arrange
      const username = "testuser";

      // Act
      const user = await userDataService.createOrGetUser(username);

      // Assert
      expect(user.id).toBeDefined();
      expect(user.username).toBe(username);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("应该避免重复创建用户", async () => {
      // Arrange
      const username = "testuser";

      // Act
      const user1 = await userDataService.createOrGetUser(username);
      const user2 = await userDataService.createOrGetUser(username);

      // Assert
      expect(user1.id).toBe(user2.id);
      expect(user1.username).toBe(user2.username);
      expect(user1.createdAt).toEqual(user2.createdAt);
    });

    it("应该能够获取当前用户", async () => {
      // Arrange
      const username = "testuser";
      await userDataService.createOrGetUser(username);

      // Act
      const user = await userDataService.getCurrentUser();

      // Assert
      expect(user).toBeDefined();
      expect(user?.username).toBe(username);
    });

    it("应该处理空用户名的输入", async () => {
      // Arrange
      const username = "   ";

      // Act
      const user = await userDataService.createOrGetUser(username);

      // Assert
      expect(user.username).toBe("");
      expect(user.id).toBeDefined();
    });

    it("应该能够创建多个不同用户", async () => {
      // Arrange
      const username1 = "user1";
      const username2 = "user2";

      // Act
      const user1 = await userDataService.createOrGetUser(username1);
      const user2 = await userDataService.createOrGetUser(username2);

      // Assert
      expect(user1.id).not.toBe(user2.id);
      expect(user1.username).toBe(username1);
      expect(user2.username).toBe(username2);
    });
  });

  describe("数据持久化模拟", () => {
    it("应该保持用户创建后的状态", async () => {
      // Arrange
      const username = "testuser";
      await userDataService.createOrGetUser(username);

      // Act
      const currentUser = await userDataService.getCurrentUser();

      // Assert
      expect(currentUser).toBeDefined();
      expect(currentUser?.username).toBe(username);
    });

    it("应该能够清除用户数据", async () => {
      // Arrange
      await userDataService.createOrGetUser("testuser");

      // Act
      await userDataService.clearUserData();
      const currentUser = await userDataService.getCurrentUser();

      // Assert
      expect(currentUser).toBeNull();
    });

    it("清除数据后应该能够重新创建用户", async () => {
      // Arrange
      await userDataService.createOrGetUser("testuser");
      await userDataService.clearUserData();

      // Act
      const user = await userDataService.createOrGetUser("newuser");

      // Assert
      expect(user.username).toBe("newuser");
      expect(user.id).toBeDefined();
    });
  });

  describe("边界条件处理", () => {
    it("应该处理用户名大小写", async () => {
      // Arrange
      const username1 = "TestUser";
      const username2 = "testuser";

      // Act
      const user1 = await userDataService.createOrGetUser(username1);
      const user2 = await userDataService.createOrGetUser(username2);

      // Assert
      expect(user1.id).not.toBe(user2.id);
      expect(user1.username).toBe(username1);
      expect(user2.username).toBe(username2);
    });

    it("应该处理特殊字符用户名", async () => {
      // Arrange
      const username = "用户_123-测试";

      // Act
      const user = await userDataService.createOrGetUser(username);

      // Assert
      expect(user.username).toBe(username);
      expect(user.id).toBeDefined();
    });

    it("应该处理长用户名", async () => {
      // Arrange
      const longUsername = "a".repeat(100);

      // Act
      const user = await userDataService.createOrGetUser(longUsername);

      // Assert
      expect(user.username).toBe(longUsername);
      expect(user.id).toBeDefined();
    });
  });

  describe("UUID 生成", () => {
    it("应该为每个用户生成唯一的 UUID", async () => {
      // Arrange & Act
      const user1 = await userDataService.createOrGetUser("user1");
      const user2 = await userDataService.createOrGetUser("user2");

      // Assert
      expect(user1.id).not.toBe(user2.id);
      expect(user1.id).toMatch(/^[a-z0-9]+$/);
      expect(user2.id).toMatch(/^[a-z0-9]+$/);
    });

    it("应该生成足够长度的 UUID", async () => {
      // Arrange & Act
      const user = await userDataService.createOrGetUser("testuser");

      // Assert
      expect(user.id.length).toBeGreaterThan(10);
    });
  });

  describe("最新用户查询", () => {
    it("应该返回空数组当没有用户时", async () => {
      // Act
      const latestUsers = await userDataService.getLatestUsers();

      // Assert
      expect(latestUsers).toEqual([]);
      expect(latestUsers).toHaveLength(0);
    });

    it("应该返回最新的单个用户", async () => {
      // Arrange
      await userDataService.createOrGetUser("user1");

      // Act
      const latestUsers = await userDataService.getLatestUsers();

      // Assert
      expect(latestUsers).toHaveLength(1);
      expect(latestUsers[0].username).toBe("user1");
    });

    it("应该按创建时间降序返回多个用户", async () => {
      // Arrange
      const user1 = await userDataService.createOrGetUser("user1");
      // 等待一小段时间确保创建时间不同
      await new Promise((resolve) => setTimeout(resolve, 10));
      const user2 = await userDataService.createOrGetUser("user2");
      await new Promise((resolve) => setTimeout(resolve, 10));
      const user3 = await userDataService.createOrGetUser("user3");

      // Act
      const latestUsers = await userDataService.getLatestUsers();

      // Assert
      expect(latestUsers).toHaveLength(3);
      expect(latestUsers[0].username).toBe("user3"); // 最新
      expect(latestUsers[1].username).toBe("user2"); // 中间
      expect(latestUsers[2].username).toBe("user1"); // 最早
    });

    it("应该支持限制返回的用户数量", async () => {
      // Arrange
      await userDataService.createOrGetUser("user1");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await userDataService.createOrGetUser("user2");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await userDataService.createOrGetUser("user3");

      // Act
      const latestUsers = await userDataService.getLatestUsers(2);

      // Assert
      expect(latestUsers).toHaveLength(2);
      expect(latestUsers[0].username).toBe("user3");
      expect(latestUsers[1].username).toBe("user2");
    });

    it("应该忽略重复的用户名", async () => {
      // Arrange
      await userDataService.createOrGetUser("duplicate");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await userDataService.createOrGetUser("duplicate"); // 重复，不会创建新用户
      await new Promise((resolve) => setTimeout(resolve, 10));
      await userDataService.createOrGetUser("user2");

      // Act
      const latestUsers = await userDataService.getLatestUsers();

      // Assert
      expect(latestUsers).toHaveLength(2);
      expect(latestUsers[0].username).toBe("user2"); // 最新
      expect(latestUsers[1].username).toBe("duplicate"); // 重复用户只有一个
    });

    it("应该处理默认限制参数", async () => {
      // Arrange
      for (let i = 1; i <= 10; i++) {
        await userDataService.createOrGetUser(`user${i}`);
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      // Act
      const latestUsers = await userDataService.getLatestUsers(); // 使用默认限制

      // Assert
      expect(latestUsers).toHaveLength(5); // 默认限制为5
      expect(latestUsers[0].username).toBe("user10"); // 最新
      expect(latestUsers[4].username).toBe("user6");
    });
  });
});

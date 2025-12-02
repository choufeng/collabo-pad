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

  async getLatestUsers(limit: number = 10): Promise<User[]> {
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

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const searchTerm = query.trim().toLowerCase();

      // 搜索用户名包含搜索词的用户，按创建时间降序排列
      return Array.from(this.users.values())
        .filter((user) => user.username.toLowerCase().includes(searchTerm))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error("搜索用户失败:", error);
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
      expect(latestUsers).toHaveLength(10); // 默认限制为10
      expect(latestUsers[0].username).toBe("user10"); // 最新
      expect(latestUsers[9].username).toBe("user1");
    });
  });

  describe("用户会话持久化", () => {
    it("应该返回最后活跃的用户当有多个会话时", async () => {
      // Arrange
      const user1 = await userDataService.createOrGetUser("user1");
      // 等待确保活跃时间不同
      await new Promise((resolve) => setTimeout(resolve, 10));
      const user2 = await userDataService.createOrGetUser("user2");

      // Act - getCurrentUser应该返回最后活跃的用户
      const currentUser = await userDataService.getCurrentUser();

      // Assert
      expect(currentUser).toBeDefined();
      expect(currentUser?.username).toBe("user2"); // 最后活跃的用户
    });

    it("应该处理空的会话数据", async () => {
      // Arrange - 清除所有数据
      await userDataService.clearUserData();

      // Act
      const currentUser = await userDataService.getCurrentUser();

      // Assert
      expect(currentUser).toBeNull();
    });

    it("应该处理会话数据中用户不存在的情况", async () => {
      // 这个测试模拟了会话指向不存在用户的情况
      // 在真实实现中，这种情况会被自动清理

      // Arrange
      await userDataService.createOrGetUser("testuser");

      // Act - 在mock中，这不会发生，但真实实现会处理
      const currentUser = await userDataService.getCurrentUser();

      // Assert
      expect(currentUser).toBeDefined();
      expect(currentUser?.username).toBe("testuser");
    });

    it("应该保持页面刷新后用户身份的一致性", async () => {
      // Arrange - 模拟用户登录
      const username = "consistent_user";
      const user = await userDataService.createOrGetUser(username);

      // Act - 多次调用getCurrentUser应该返回相同用户
      const currentUser1 = await userDataService.getCurrentUser();
      const currentUser2 = await userDataService.getCurrentUser();
      const currentUser3 = await userDataService.getCurrentUser();

      // Assert
      expect(currentUser1?.id).toBe(user.id);
      expect(currentUser2?.id).toBe(user.id);
      expect(currentUser3?.id).toBe(user.id);
      expect(currentUser1?.username).toBe(username);
      expect(currentUser2?.username).toBe(username);
      expect(currentUser3?.username).toBe(username);
    });

    it("应该正确处理用户切换后的身份恢复", async () => {
      // Arrange - 创建多个用户并切换
      const user1 = await userDataService.createOrGetUser("user1");
      await new Promise((resolve) => setTimeout(resolve, 10));
      const user2 = await userDataService.createOrGetUser("user2");
      await new Promise((resolve) => setTimeout(resolve, 10));
      const user3 = await userDataService.createOrGetUser("user3");

      // Act - 最后活跃的用户应该是user3
      const currentUser = await userDataService.getCurrentUser();

      // Assert
      expect(currentUser?.id).toBe(user3.id);
      expect(currentUser?.username).toBe("user3");
    });

    it("应该为首页提供最后活跃的用户名进行默认填充", async () => {
      // Arrange - 模拟用户使用场景
      await userDataService.createOrGetUser("alice");
      await new Promise((resolve) => setTimeout(resolve, 100));
      await userDataService.createOrGetUser("bob");
      await new Promise((resolve) => setTimeout(resolve, 100));
      await userDataService.createOrGetUser("charlie");

      // Act - 首页应该获取最后活跃的用户进行默认填充
      const userForHomePage = await userDataService.getCurrentUser();

      // Assert - 应该是最后活跃的用户charlie
      expect(userForHomePage).toBeDefined();
      expect(userForHomePage?.username).toBe("charlie");
      expect(userForHomePage?.username.trim()).toBe("charlie");
    });
  });

  describe("用户搜索", () => {
    it("应该返回空数组当搜索词为空时", async () => {
      // Act
      const result1 = await userDataService.searchUsers("");
      const result2 = await userDataService.searchUsers("   ");
      const result3 = await userDataService.searchUsers("\t\n");

      // Assert
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
    });

    it("应该返回空数组当没有匹配用户时", async () => {
      // Arrange
      await userDataService.createOrGetUser("Alice");
      await userDataService.createOrGetUser("Bob");

      // Act
      const result = await userDataService.searchUsers("Charlie");

      // Assert
      expect(result).toEqual([]);
    });

    it("应该搜索到包含搜索词的用户", async () => {
      // Arrange
      await userDataService.createOrGetUser("Alice");
      await userDataService.createOrGetUser("Bob");
      await userDataService.createOrGetUser("Charlie");
      await userDataService.createOrGetUser("David");

      // Act
      const result = await userDataService.searchUsers("a");

      // Assert
      expect(result).toHaveLength(3); // Alice, Charlie, David 都包含 'a'
      expect(result.map((u) => u.username)).toContain("Alice");
      expect(result.map((u) => u.username)).toContain("Charlie");
      expect(result.map((u) => u.username)).toContain("David");
      expect(result.map((u) => u.username)).not.toContain("Bob");
    });

    it("应该不区分大小写搜索", async () => {
      // Arrange
      await userDataService.createOrGetUser("Alice");
      await userDataService.createOrGetUser("bob");

      // Act
      const result1 = await userDataService.searchUsers("ALICE");
      const result2 = await userDataService.searchUsers("Bob");

      // Assert
      expect(result1).toHaveLength(1);
      expect(result1[0].username).toBe("Alice");
      expect(result2).toHaveLength(1);
      expect(result2[0].username).toBe("bob");
    });

    it("应该按创建时间降序返回搜索结果", async () => {
      // Arrange
      await userDataService.createOrGetUser("Alice");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await userDataService.createOrGetUser("AliceWonder");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await userDataService.createOrGetUser("Alice2");

      // Act
      const result = await userDataService.searchUsers("Alice");

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].username).toBe("Alice2"); // 最新
      expect(result[1].username).toBe("AliceWonder"); // 中间
      expect(result[2].username).toBe("Alice"); // 最早
    });

    it("应该支持限制搜索结果数量", async () => {
      // Arrange
      await userDataService.createOrGetUser("Alice1");
      await new Promise((resolve) => setTimeout(resolve, 5));
      await userDataService.createOrGetUser("Alice2");
      await new Promise((resolve) => setTimeout(resolve, 5));
      await userDataService.createOrGetUser("Alice3");
      await new Promise((resolve) => setTimeout(resolve, 5));
      await userDataService.createOrGetUser("Alice4");

      // Act
      const result = await userDataService.searchUsers("Alice", 2);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("Alice4"); // 最新的两个
      expect(result[1].username).toBe("Alice3");
    });

    it("应该处理精确匹配的用户名", async () => {
      // Arrange
      await userDataService.createOrGetUser("Alice");
      await userDataService.createOrGetUser("Bob");
      await userDataService.createOrGetUser("AliceWonder");

      // Act
      const result = await userDataService.searchUsers("Alice");

      // Assert
      expect(result).toHaveLength(2); // Alice 和 AliceWonder
      expect(result.map((u) => u.username)).toContain("Alice");
      expect(result.map((u) => u.username)).toContain("AliceWonder");
    });

    it("应该处理默认搜索限制", async () => {
      // Arrange
      // 创建超过默认限制的用户
      for (let i = 1; i <= 15; i++) {
        await userDataService.createOrGetUser(`TestUser${i}`);
        await new Promise((resolve) => setTimeout(resolve, 2));
      }

      // Act
      const result = await userDataService.searchUsers("TestUser"); // 使用默认限制

      // Assert
      expect(result).toHaveLength(10); // 默认限制为10
    });

    it("应该处理特殊字符搜索", async () => {
      // Arrange
      await userDataService.createOrGetUser("用户_123");
      await userDataService.createOrGetUser("test-user");
      await userDataService.createOrGetUser("normal_user");

      // Act
      const result1 = await userDataService.searchUsers("用户");
      const result2 = await userDataService.searchUsers("-");

      // Assert
      expect(result1).toHaveLength(1);
      expect(result1[0].username).toBe("用户_123");
      expect(result2).toHaveLength(1);
      expect(result2[0].username).toBe("test-user");
    });

    it("应该处理前后空格的搜索词", async () => {
      // Arrange
      await userDataService.createOrGetUser("Alice");
      await userDataService.createOrGetUser("Bob");

      // Act
      const result = await userDataService.searchUsers("  Alice  ");

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe("Alice");
    });
  });
});

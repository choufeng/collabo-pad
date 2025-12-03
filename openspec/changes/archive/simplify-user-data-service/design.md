# 技术重设计文档

## 当前问题分析

### 设计过度复杂

当前的 `DatabaseService` 接口设计过于复杂，包含了许多实际不需要的操作：

```typescript
// 当前过度设计的接口
export interface DatabaseService {
  // 用户操作 - 大部分不需要
  createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User>;
  getUser(id: string): Promise<User | undefined>; // ❌ 不需要
  getUserByUsername(username: string): Promise<User | undefined>; // ❌ 不需要
  updateUser(id: string, updates: Partial<User>): Promise<User>; // ❌ 不需要
  deleteUser(id: string): Promise<void>; // ❌ 不需要
}
```

### 实际需求分析

根据实际使用场景，用户数据管理只需要：

1. **用户创建**: 首次输入用户名时自动创建，生成 UUID
2. **用户获取**: 获取当前登录的用户信息
3. **数据持久化**: 将用户信息存储到 IndexedDB

## 简化设计

### 新的数据结构

```typescript
// 简化的用户数据结构
interface User {
  id: string; // 自动生成的 UUID
  username: string; // 用户输入的用户名
  createdAt: Date; // 创建时间
}

// 简化的用户会话
interface UserSession {
  currentUserId: string | null;
  lastActiveAt: Date;
}
```

### 新的服务接口

```typescript
// 简化的用户数据服务接口
export interface UserDataService {
  // 核心功能
  createOrGetUser(username: string): Promise<User>;
  getCurrentUser(): Promise<User | null>;

  // 状态管理
  clearUserData(): Promise<void>;
}

// 简化的实现
export class UserDataServiceImpl implements UserDataService {
  async createOrGetUser(username: string): Promise<User> {
    // 检查是否已有用户
    let user = await this.getCurrentUser();

    if (!user || user.username !== username) {
      // 创建新用户
      user = {
        id: this.generateUUID(),
        username: username.trim(),
        createdAt: new Date(),
      };
      await this.db.users.add(user);
      await this.updateSession(user.id);
    }

    return user;
  }
}
```

### 状态管理集成

```typescript
// 简化的用户状态管理
export const useUserStore = create<UserState>()((set, get) => ({
  currentUser: null,
  isLoading: false,
  error: null,

  createOrGetUser: async (username: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await userDataService.createOrGetUser(username);
      set({ currentUser: user, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadCurrentUser: async () => {
    try {
      set({ isLoading: true });
      const user = await userDataService.getCurrentUser();
      set({ currentUser: user, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
```

## 测试策略重设计

### 移除过度测试

**删除的测试用例：**

- ❌ "应该能够通过 ID 获取用户"
- ❌ "应该能够通过用户名获取用户"
- ❌ "应该能够更新用户信息"
- ❌ "应该能够删除用户"

**保留的核心测试：**

- ✅ "应该能够创建新用户（首次使用）"
- ✅ "应该能够获取当前用户"
- ✅ "重复用户名应该返回现有用户"
- ✅ "用户数据应该持久化到 IndexedDB"

### 新的测试结构

```typescript
describe("UserDataService", () => {
  describe("用户创建和获取", () => {
    it("应该能够创建新用户", async () => {
      const user = await userDataService.createOrGetUser("testuser");
      expect(user.id).toBeDefined();
      expect(user.username).toBe("testuser");
    });

    it("应该能够获取当前用户", async () => {
      await userDataService.createOrGetUser("testuser");
      const user = await userDataService.getCurrentUser();
      expect(user.username).toBe("testuser");
    });

    it("应该避免重复创建用户", async () => {
      const user1 = await userDataService.createOrGetUser("testuser");
      const user2 = await userDataService.createOrGetUser("testuser");
      expect(user1.id).toBe(user2.id);
    });
  });
});
```

## 实施步骤

### 第一阶段：重构测试

1. 重写数据库服务测试文件
2. 移除不必要的测试用例
3. 实现简化的 Mock 逻辑
4. 确保测试通过

### 第二阶段：重构实现

1. 简化 `DatabaseService` 接口和实现
2. 更新状态管理集成
3. 确保首页面功能正常
4. 验证数据持久化

### 第三阶段：验证和优化

1. 运行完整测试套件
2. 验证功能完整性
3. 性能优化
4. 文档更新

## 预期收益

### 复杂度降低

- **代码行数减少**: 预计减少 50% 的数据库服务代码
- **测试简化**: 测试用例数量从 13 个减少到 5 个
- **维护成本降低**: 接口更简单，易于理解和维护

### 可靠性提升

- **测试通过率**: 从失败状态提升到 100% 通过
- **代码质量**: 更符合实际需求，减少过度设计
- **开发效率**: 简化的 API 更容易使用和调试

### 向后兼容

- **接口兼容**: 现有状态管理无需重大修改
- **数据兼容**: 现有用户数据可以继续使用
- **功能兼容**: 首页面和画板功能保持不变

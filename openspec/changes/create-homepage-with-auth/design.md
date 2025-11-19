# 技术架构设计

## 数据存储架构

### IndexedDB Schema 设计

基于 dexie.js 实现的 IndexedDB 数据库设计，用于持久化用户会话和频道信息。

#### 数据库结构

```typescript
// 数据库名称: collaboPadDB
// 版本: 1

interface User {
  id: string; // 用户唯一标识
  username: string; // 用户名（人名格式）
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

interface Channel {
  id: string; // 频道唯一标识
  name?: string; // 频道名称（可选）
  userId: string; // 所属用户ID
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

interface UserSession {
  currentUserId: string | null; // 当前登录用户ID
  currentChannelId: string | null; // 当前活动频道ID
  lastActiveAt: Date; // 最后活动时间
}
```

### Dexie 操作层设计

```typescript
// 数据库操作接口
interface DatabaseService {
  // 用户操作
  createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // 频道操作
  createChannel(
    channelData: Omit<Channel, "id" | "createdAt" | "updatedAt">,
  ): Promise<Channel>;
  getChannel(id: string): Promise<Channel | undefined>;
  updateChannel(id: string, updates: Partial<Channel>): Promise<Channel>;
  deleteChannel(id: string): Promise<void>;
  getChannelsByUser(userId: string): Promise<Channel[]>;

  // 会话管理
  getUserSession(): Promise<UserSession>;
  updateUserSession(session: Partial<UserSession>): Promise<UserSession>;
  clearUserSession(): Promise<void>;
}
```

## 状态管理架构

### Zustand Store 设计

采用分层状态管理，将用户状态和频道状态分离，便于后续扩展。

#### 用户状态 Store

```typescript
interface UserState {
  // 状态
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  // 操作
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 异步操作
  createOrUpdateUser: (
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  loadCurrentUser: () => Promise<void>;
}
```

#### 频道状态 Store

```typescript
interface ChannelState {
  // 状态
  currentChannel: Channel | null;
  userChannels: Channel[];
  isLoading: boolean;
  error: string | null;

  // 操作
  setCurrentChannel: (channel: Channel | null) => void;
  setUserChannels: (channels: Channel[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 异步操作
  createChannel: (
    channelData: Omit<Channel, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateChannel: (id: string, updates: Partial<Channel>) => Promise<void>;
  loadUserChannels: (userId: string) => Promise<void>;
  switchChannel: (channelId: string) => Promise<void>;
}
```

### 持久化同步机制

```typescript
// IndexedDB 与 Zustand 同步接口
interface PersistenceManager {
  // 同步用户状态到 IndexedDB
  syncUserStateToDB: (user: User | null) => Promise<void>;

  // 从 IndexedDB 恢复用户状态
  restoreUserStateFromDB: () => Promise<User | null>;

  // 同步频道状态到 IndexedDB
  syncChannelStateToDB: (
    channel: Channel | null,
    userChannels: Channel[],
  ) => Promise<void>;

  // 从 IndexedDB 恢复频道状态
  restoreChannelStateFromDB: () => Promise<{
    currentChannel: Channel | null;
    userChannels: Channel[];
  }>;
}
```

## 路由系统重构

### 动态路由设计

将现有的静态路由 `/board` 重构为动态路由 `/board/[channel-id]`，支持多频道访问。

#### 路由结构

```
src/app/
├── page.tsx              # 首页面
├── board/
│   └── [channel-id]/
│       └── page.tsx     # 动态频道页面
└── layout.tsx            # 根布局
```

#### 路由守卫

```typescript
// 路由守卫中间件
export async function requireAuth(params: {
  channelId?: string;
}): Promise<boolean> {
  const { getCurrentUser } = useUserStore();
  const { getCurrentChannel } = useChannelStore();

  // 检查用户是否已登录
  if (!getCurrentUser()) {
    return false;
  }

  // 检查频道是否存在且属于当前用户
  if (params.channelId) {
    const channel = await getChannel(params.channelId);
    if (!channel || channel.userId !== getCurrentUser()?.id) {
      return false;
    }
  }

  return true;
}
```

## 组件架构设计

### 首页面组件结构

```typescript
// 首页面组件
interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  const [username, setUsername] = useState("");
  const [channelId, setChannelId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { createOrUpdateUser, setCurrentUser } = useUserStore();
  const { createChannel, setCurrentChannel } = useChannelStore();
  const router = useRouter();
};
```

### 数据验证设计

```typescript
// 表单验证规则
interface ValidationRules {
  username: {
    required: true;
    minLength: 1;
    maxLength: 100;
    pattern: /^.+/; // 任意非空字符
    customMessage?: string;
  };

  channelId: {
    required: true;
    minLength: 1;
    maxLength: 50;
    pattern: /^[a-zA-Z0-9]+$/; // 数字和字母，区分大小写
    customMessage?: string;
  };
}
```

## 类型定义设计

### 核心类型接口

```typescript
// 用户相关类型
export interface User {
  id: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  username: string;
}

// 频道相关类型
export interface Channel {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelInput {
  channelId: string;
}

// 表单相关类型
export interface HomeFormData {
  username: string;
  channelId: string;
}

export interface FormErrors {
  username?: string;
  channelId?: string;
}

// 路由参数类型
export interface BoardPageParams {
  channelId: string;
}
```

## 依赖包管理

### 新增依赖包

```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "zustand": "^4.4.7"
  }
}
```

### 开发依赖包

```json
{
  "devDependencies": {
    "@types/dexie": "^3.0.4"
  }
}
```

## 实施策略

### 渐进式实现

1. **第一阶段**：基础首页面和表单功能
2. **第二阶段**：IndexedDB 数据存储层
3. **第三阶段**：Zustand 状态管理
4. **第四阶段**：路由重构和守卫
5. **第五阶段**：集成测试和优化

### 兼容性考虑

- 保持现有 Board 组件功能完整性
- 确保向后兼容的数据迁移
- 提供平滑的用户体验过渡

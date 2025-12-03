# 文本替换映射清单

## Board.tsx

- "创建节点" → "Add Topic"

## RightSidebar.tsx

- "创建新节点" → "Create New Topic"
- "编辑节点" → "Edit Topic"
- "创建连接节点" → "Create Connected Topic"
- "节点编辑" → "Topic Editor"
- "关闭边栏" → "Close sidebar"
- // 注释中的中文保持不变

## NodeEditor.tsx

### 表单相关

- "节点内容" → "Topic Content"
- "请输入节点内容" → "Enter topic content"
- "节点内容不能为空" → "Topic content cannot be empty"
- "节点内容不能超过500个字符" → "Topic content cannot exceed 500 characters"

### 按钮文字

- "创建节点" → "Create Topic"
- "保存修改" → "Save Changes"
- "创建并连接" → "Create and Connect"
- "保存" → "Save"

### 状态和错误消息

- "保存节点失败" → "Failed to save topic"
- "保存失败，请重试" → "Save failed, please try again"
- "保存中..." → "Saving..."
- "将创建一个新节点并连接到源节点" → "Will create a new topic and connect to source topic"

## home-page.tsx

### 界面文本

- "协作画板" → "Collaborative Whiteboard"
- "输入用户名和频道ID开始协作" → "Enter username and channel ID to start collaboration"
- "用户名" → "Username"
- "频道ID" → "Channel ID"
- "进入画板" → "Enter Whiteboard"

### 表单验证

- "用户名不能为空" → "Username cannot be empty"
- "频道ID不能为空" → "Channel ID cannot be empty"
- "用户名长度不能超过100个字符" → "Username cannot exceed 100 characters"
- "频道ID长度不能超过50个字符" → "Channel ID cannot exceed 50 characters"
- "频道ID只能包含字母和数字" → "Channel ID can only contain letters and numbers"

### 占位符文本

- "请输入用户名" → "Enter username"
- "请输入频道ID（字母和数字）" → "Enter channel ID (letters and numbers)"

### 帮助说明

- "使用说明：" → "Usage:"
- "用户名：任意非空字符，长度不超过100" → "Username: Any non-empty characters, max 100 length"
- "频道ID：只能包含字母和数字，区分大小写" → "Channel ID: Letters and numbers only, case sensitive"
- "相同用户名会复用已存在的用户" → "Same username will reuse existing user"
- "相同频道ID会进入已存在的频道" → "Same channel ID will enter existing channel"

### 错误和状态消息

- "用户创建失败" → "User creation failed"
- "正在处理..." → "Processing..."
- "获取最新用户失败" → "Failed to get latest users"

## 测试文件更新需求

- home-page.test.tsx 中的测试断言需要更新为英文
- 所有涉及中文文本的测试用例需要更新

## 检查清单

- [ ] 确保所有用户可见的中文文本都被识别
- [ ] 检查aria-label等可访问性属性
- [ ] 验证占位符文本
- [ ] 确认错误消息和状态提示
- [ ] 检查控制台日志消息
- [ ] 验证测试用例中的文本依赖

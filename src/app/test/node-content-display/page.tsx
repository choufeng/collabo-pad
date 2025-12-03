"use client";

import React, { useState } from "react";
import NodeContentView from "@/components/NodeContentView";
import { SelectedNode } from "@/stores/side-trowser-store";
import type { TopicNodeData } from "@/utils/topic-to-node";

// 模拟节点数据用于测试
const mockNodes: SelectedNode[] = [
  {
    id: "topic-1",
    type: "custom",
    data: {
      label: "测试节点1",
      content: "这是一个简单的测试内容，没有换行符。",
      topic_id: "1",
      user_id: "user-1",
      user_name: "测试用户",
      timestamp: Date.now() - 1000 * 60 * 5, // 5分钟前
      level: 0,
    } as TopicNodeData,
    position: { x: 100, y: 100 },
  },
  {
    id: "topic-2",
    type: "custom",
    data: {
      label: "多行内容测试",
      content:
        "这是第一行内容。\n这是第二行内容。\n\n这是第三行内容，前面有空行。\n这是第四行内容，用来测试换行符是否正确显示。",
      topic_id: "2",
      user_id: "user-1",
      user_name: "测试用户",
      timestamp: Date.now() - 1000 * 60 * 10, // 10分钟前
      level: 1,
      tags: ["测试", "多行内容", "换行符"],
    } as TopicNodeData,
    position: { x: 300, y: 200 },
  },
  {
    id: "topic-3",
    type: "custom",
    data: {
      label: "复杂内容测试",
      content: `# Markdown 功能测试

这是一个包含 **多种** Markdown 格式的测试节点。

## 文本格式测试

这里有 **粗体文本** 和 *斜体文本*，还有 ~~删除线文本~~。

还可以使用 \\\`行内代码\\\` 来高亮代码。

## 列表测试

### 无序列表
- 第一项内容
- 第二项包含 **粗体** 文本
- 第三项包含 \\\`行内代码\\\`
- 嵌套列表项
  - 子项目 1
  - 子项目 2

### 有序列表
1. 第一步：安装依赖
2. 第二步：配置环境
3. 第三步：运行应用

## 代码块测试

### JavaScript 代码
\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 测试
console.log(fibonacci(10)); // 输出: 55
\`\`\`

### Python 代码
\`\`\`python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)
\`\`\`

## 引用测试

> 这是一个引用块。
>
> 可以包含多行内容，支持 **Markdown** 格式。
>
> > 这是嵌套的引用。

## 表格测试

| 功能 | 状态 | 优先级 |
|------|------|--------|
| Markdown 渲染 | ✅ 完成 | 高 |
| 代码高亮 | ✅ 完成 | 中 |
| 数学公式 | ❌ 待实现 | 低 |

## 链接测试

[GitHub](https://github.com) 和 [Google](https://google.com) 链接测试。

## 分割线

---

## 长文本测试

这是一段很长的文本内容，用来测试自动换行和文本溢出的处理。当文本内容很长时，应该能够正确地进行换行显示，而不会导致布局破坏。同时需要保持良好的可读性和用户体验。

我们还测试一些特殊字符：<>[]{}|\\!@#$%^&*()

中文标点符号测试：《》""''（）【】「」『』

## 任务列表（GFM）

- [x] 完成 Markdown 渲染功能
- [x] 添加代码高亮支持
- [ ] 添加数学公式支持
- [ ] 实现实时预览功能
`,
      topic_id: "3",
      user_id: "user-2",
      user_name: "另一个用户",
      timestamp: Date.now() - 1000 * 60 * 60, // 1小时前
      level: 2,
      tags: ["复杂内容", "Markdown", "特殊字符"],
      parent_id: "2",
    } as TopicNodeData,
    position: { x: 500, y: 300 },
  },
  {
    id: "topic-4",
    type: "custom",
    data: {
      label: "空内容测试",
      content: "",
      topic_id: "4",
      user_id: "user-1",
      user_name: "测试用户",
      timestamp: Date.now() - 1000 * 60 * 2, // 2分钟前
      level: 0,
    } as TopicNodeData,
    position: { x: 200, y: 400 },
  },
];

export default function NodeContentDisplayTest() {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(
    mockNodes[0],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNodeSelect = (node: SelectedNode, index: number) => {
    setSelectedNode(node);
    setActiveIndex(index);
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
    setActiveIndex(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            节点内容显示测试
          </h1>
          <p className="text-gray-600">
            测试节点内容的显示效果，特别是换行符和复杂内容的处理
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：测试节点选择 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              测试节点选择
            </h2>

            <div className="space-y-3">
              {mockNodes.map((node, index) => (
                <button
                  key={node.id}
                  onClick={() => handleNodeSelect(node, index)}
                  className={`w-full text-left p-4 rounded-md border-2 transition-colors ${
                    activeIndex === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-gray-900 mb-1">
                    {(node.data as TopicNodeData).label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {(node.data as TopicNodeData).content
                      ? (node.data as TopicNodeData).content.substring(0, 50) +
                        ((node.data as TopicNodeData).content.length > 50
                          ? "..."
                          : "")
                      : "无内容"}
                  </div>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <span>Level: {(node.data as TopicNodeData).level}</span>
                    {(node.data as TopicNodeData).tags &&
                      (node.data as TopicNodeData).tags!.length > 0 && (
                        <span>
                          标签: {(node.data as TopicNodeData).tags!.length}
                        </span>
                      )}
                    <span>
                      内容长度:{" "}
                      {(node.data as TopicNodeData).content?.length || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleClearSelection}
              className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              清除选择 (测试空状态)
            </button>
          </div>

          {/* 右侧：NodeContentView 显示 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              NodeContentView 效果
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[400px]">
              <NodeContentView selectedNode={selectedNode} />
            </div>
          </div>
        </div>

        {/* 底部：测试说明 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">测试要点</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                ✅ 应该正确显示的功能：
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 换行符正确转换为换行显示</li>
                <li>• 多个连续换行符保持间距</li>
                <li>• 长文本自动换行不破坏布局</li>
                <li>• 特殊字符正确显示</li>
                <li>• 空内容状态提示</li>
                <li>• 节点元数据（用户、时间、层级）</li>
                <li>• 标签正确显示</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                🔍 需要验证的地方：
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• CSS white-space: pre-wrap 效果</li>
                <li>• word-break: break-word 处理</li>
                <li>• 中英文混合内容的换行</li>
                <li>• 代码块和特殊格式显示</li>
                <li>• 响应式布局适配</li>
                <li>• 空值和 undefined 处理</li>
                <li>• 时间戳格式化显示</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

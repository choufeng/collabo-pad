import React from "react";
import { SelectedNode } from "@/stores/side-trowser-store";
import type { TopicNodeData } from "@/utils/topic-to-node";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";

interface NodeContentViewProps {
  selectedNode: SelectedNode | null;
}

const NodeContentView: React.FC<NodeContentViewProps> = ({ selectedNode }) => {
  if (!selectedNode) {
    return null;
  }

  const nodeData = selectedNode.data as TopicNodeData;

  // 判断显示的是翻译内容还是原始内容
  const isTranslatedContent = Boolean(nodeData.translated_content);
  const displayContent = nodeData.translated_content || nodeData.content;

  return (
    <div className="space-y-4">
      {/* 节点内容 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">
            User:{nodeData.user_name}
          </h4>
          {isTranslatedContent && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              翻译内容
            </span>
          )}
        </div>
        <div className="bg-gray-50 rounded-md p-3 min-h-[100px] max-h-96 overflow-y-auto">
          {displayContent ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                // 自定义组件样式
                h1: ({ children }) => (
                  <h1 className="text-lg font-semibold text-gray-900 mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold text-gray-900 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-gray-800 mb-2 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="text-sm text-gray-800 mb-2 list-disc list-inside space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-sm text-gray-800 mb-2 list-decimal list-inside space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-3 py-1 mb-2 italic text-gray-700">
                    {children}
                  </blockquote>
                ),
                code: (props: any) => {
                  const { inline, className, children, ...restProps } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <div className="bg-gray-900 text-gray-100 rounded-md p-3 mb-2 overflow-x-auto">
                      <pre className="text-sm">
                        <code className={className} {...restProps}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm"
                      {...restProps}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-gray-900 text-gray-100 rounded-md p-3 mb-2 overflow-x-auto text-sm">
                    {children}
                  </pre>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-2">
                    <table className="min-w-full border-collapse border border-gray-300 text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-100">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-2 py-1 text-left font-medium">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-2 py-1">
                    {children}
                  </td>
                ),
                hr: () => <hr className="border-gray-300 my-3" />,
              }}
            >
              {displayContent}
            </ReactMarkdown>
          ) : (
            <p className="text-sm text-gray-500 italic">此节点暂无内容</p>
          )}
        </div>
      </div>

      {/* 标签信息 */}
      {nodeData.tags && nodeData.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">标签</h4>
          <div className="flex flex-wrap gap-1">
            {nodeData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 节点ID信息 */}
      {/* <div className="text-xs text-gray-400 border-t border-gray-200 pt-2">
        <div className="space-y-1">
          <p>节点ID: {selectedNode.id}</p>
          {nodeData.topic_id && <p>主题ID: {nodeData.topic_id}</p>}
          {nodeData.parent_id && <p>父节点ID: {nodeData.parent_id}</p>}
        </div>
      </div> */}
    </div>
  );
};

export default NodeContentView;

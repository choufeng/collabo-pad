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

  // Check if displaying translated or original content
  const isTranslatedContent = Boolean(nodeData.translated_content);
  const displayContent = nodeData.translated_content || nodeData.content;

  return (
    <div className="space-y-4">
      {/* Node content */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {nodeData.user_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">
                {nodeData.user_name || "Unknown User"}
              </h4>
              <p className="text-xs text-gray-500">Author</p>
            </div>
          </div>
          {isTranslatedContent && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Translated Content
            </span>
          )}
        </div>
        <div className="bg-gray-50 rounded-md p-3 min-h-[100px] max-h-96 overflow-y-auto">
          {displayContent ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                // Custom component styles
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <p className="text-sm text-gray-500 italic">
              This node has no content
            </p>
          )}
        </div>
      </div>

      {/* Tags information */}
      {nodeData.tags && nodeData.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
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

      {/* Node ID information */}
      {/* <div className="text-xs text-gray-400 border-t border-gray-200 pt-2">
        <div className="space-y-1">
          <p>Node ID: {selectedNode.id}</p>
          {nodeData.topic_id && <p>Topic ID: {nodeData.topic_id}</p>}
          {nodeData.parent_id && <p>Parent Node ID: {nodeData.parent_id}</p>}
        </div>
      </div> */}
    </div>
  );
};

export default NodeContentView;

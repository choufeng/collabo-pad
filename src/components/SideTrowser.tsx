import { useSideTrowserStore } from "../stores/side-trowser-store";
import NodeForm from "./NodeForm";

export const SideTrowser = () => {
  const { isOpen, close, form, reset } = useSideTrowserStore();

  // 如果关闭状态则不渲染
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg border-r border-gray-200">
      {/* 头部区域 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">侧边栏</h2>
        <button
          onClick={close}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="关闭侧边栏"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-gray-600">SideTrowser内容区域</p>
        {/* 这里可以放置侧边栏的具体内容 */}
        {JSON.stringify({ form })}

        <hr />
        <div className="text-sm text-gray-500 mt-4">
          <NodeForm
            onSubmitSuccess={() => {
              reset();
              close();
            }}
          />
        </div>
      </div>
    </div>
  );
};

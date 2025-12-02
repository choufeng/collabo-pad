import { useSideTrowserStore } from "../stores/side-trowser-store";
import NodeForm from "./NodeForm";
import NodeContentView from "./NodeContentView";

export const SideTrowser = () => {
  const { isOpen, close, form, reset, selectedNode } = useSideTrowserStore();

  console.log(
    "SideTrowser component rendering, isOpen:",
    isOpen,
    "form:",
    form,
  );

  // Don't render if closed
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[480px] bg-white shadow-lg border-l border-gray-200 max-w-[85vw] md:max-w-none">
      {/* Header area */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Sidebar</h2>
        <button
          onClick={close}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Close sidebar"
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

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Node content display area */}
        <div id="node-content-area" className="mt-4">
          <NodeContentView selectedNode={selectedNode} />
        </div>
        <hr className="my-6" />

        {/* Create new node form */}
        <div className="text-sm text-gray-500">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {selectedNode ? "Reply Topic" : "Create New Node"}
            </h3>
            <p className="text-xs text-gray-500">
              {selectedNode
                ? `Replying to "${(selectedNode.data as { label?: string })?.label || "selected node"}"`
                : "Create a new top-level topic"}
            </p>
          </div>
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

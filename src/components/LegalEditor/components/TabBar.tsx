import { Plus, X } from "lucide-react";
import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";

export function TabBar() {
  const { docEditorState: state, handleNewFile, handleTabClick, handleTabClose } = useDocumentEditor();
  const { openTabs, activeTabId } = state;

  return (
    <div className="flex items-center h-9 border-b border-gray-200 bg-gray-50/80">
      {/* New Tab Button */}
      <button
        onClick={handleNewFile}
        className="h-full px-2 text-gray-500 hover:bg-gray-100 transition-colors border-l border-gray-200"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <div className="flex-1 flex items-center">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`group flex items-center h-full px-3 py-1 rounded border-r border-gray-200 cursor-pointer
                      ${
                        activeTabId === tab.id
                          ? "bg-white text-gray-700 border-b-0"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
          >
            <span className="text-xs font-medium truncate max-w-[100px]">
              {tab.name === "Untitled Document" && !tab.fileId
                ? "New"
                : tab.name}
              {tab.isUnsaved && "•"}
              {!tab.fileId && <span className="text-gray-500"> (Unsaved)</span>}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTabClose(tab.id);
              }}
              className="ml-1.5 p-0.5 rounded-sm hover:bg-gray-200/80 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

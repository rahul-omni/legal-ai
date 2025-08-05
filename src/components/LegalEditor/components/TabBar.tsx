import { Plus, X } from "lucide-react";
import { findFileById } from "../helper/explorerHelper";
import {
  TabInfo,
  useDocumentEditor,
} from "../reducersContexts/documentEditorReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";

export function TabBar() {
  const {
    docEditorState: state,
    handleNewFile,
    handleTabClose,
    docEditorDispatch,
  } = useDocumentEditor();
  const { explorerState, explorerDispatch } = useExplorerContext();
  const { openTabs, activeTabId } = state;

  const handleTabClick = (tab: TabInfo) => {
    docEditorDispatch({ type: "TAB_CLICK", payload: tab.id });

    if (!tab.fileId) return;

    const fileNode = findFileById(
      explorerState.fileTree,
      tab.fileId ?? undefined
    );

    if (!fileNode) return;
    explorerDispatch({ type: "SELECT_FILE", payload: fileNode });
  };

  return (
    <div className="flex items-center h-9 border-gray-200 bg-gray-50/80 m-6">
      {/* New Tab Button */}
      
      <div className="flex items-center gap-2">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`group flex items-center h-full px-4 py-3 rounded-lg border-2 border-bo cursor-pointer
                      ${
                        activeTabId === tab.id
                          ? "bg-white text-gray-700 border-b-2 border-border"
                          : "text-gray-500 hover:bg-gray-100 border-b-2 border-border"
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
      <button
        onClick={handleNewFile}
        className="h-full w-auto flex items-center justify-center px-4 py-3 ml-2 bg-primary text-white hover:bg-primary/80 transition-colors border-2 border-border rounded-lg"
      >
        <Plus className="w-5 h-5" color="white" />
      </button>
    </div>
  );
}

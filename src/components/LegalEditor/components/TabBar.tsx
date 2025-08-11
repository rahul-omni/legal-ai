import { Plus, X } from "lucide-react";
import { findFileById } from "../helper/explorerHelper";
import {
  TabInfo,
  useDocumentEditor,
} from "../reducersContexts/documentEditorReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { useParams } from "next/navigation";

export function TabBar() {
  const {
    docEditorState: state,
    handleNewFile,
    handleTabClose,
    docEditorDispatch,
  } = useDocumentEditor();
  const { explorerState, explorerDispatch } = useExplorerContext();
  const { openTabs, activeTabId } = state;
  const params = useParams();
  const parentId = params.id as string;

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
    <div className="flex items-center h-9 border-gray-200 bg-background mx-6 mt-2">
      {/* New Tab Button */}
      <div className="flex items-center h-full">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`group flex items-center h-full px-3 py-2 border-t-2 border-l-2 border-border-light   m-0 cursor-pointer
                      ${
                        activeTabId === tab.id
                          ? "bg-[#fff] text-text border-border"
                          : "text-gray-500 hover:bg-gray-100 border-border" 
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
              className=" p-0.5 rounded-sm hover:bg-gray-200/80 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
      {(parentId != "root") && <button
        onClick={handleNewFile}
        className="h-full w-auto flex items-center justify-center px-3 bg-border-light text-gray-500 hover:bg-border-dark transition-colors border-l-2 border-t-2 border-r-2 border-border-light hover:border-border-dark"
      >
        <Plus className="w-5 h-5 text-muted-dark" />
      </button>}
    </div>
  );
}

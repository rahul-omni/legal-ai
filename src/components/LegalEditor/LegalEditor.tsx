"use client";
import { fetchAllNodes, fetchNodes } from "@/app/apiServices/nodeServices";
import { useTabs } from "@/context/tabsContext";
import { handleApiError } from "@/helper/handleApiError";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { GlobalWorkerOptions } from "pdfjs-dist";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { SmartPromptsPanel } from "../SmartPromptsPanel";
import { DocumentEditorPanel } from "./components/DocumentEditorPanel";
import { FileExplorerPanel } from "./components/FileExplorerPanel";
import { FolderPickerModal } from "./components/FolderPickerModal";
import { Toolbar } from "./components/Toolbar";
import { useFileContext } from "./reducers/fileReducer";
import { useFolderPickerState } from "./reducers/folderPickerReducer";
import { useUIState } from "./reducers/uiReducer";

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

export function LegalEditor() {
  const { state: uiState, dispatch: uiDispatch } = useUIState();
  const { state: fileState, dispatch: fileDispatch } = useFileContext();
  const { state: folderPickerState, dispatch: folderPickerDispatch } =
    useFolderPickerState();
  const {
    openTabs,
    activeTabId,
    openFileInTab,
    closeTab,
    updateTabContent,
    setActiveTabId,
    createNewTab,
    updateTabName,
  } = useTabs();

  useEffect(() => {
    fetchUpdatedFileTree();
  }, []);

  // Refs
  const isCalledRef = useRef(false);

  // Get the currently active tab
  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  // API Calls
  const fetchUpdatedFileTree = async (parentId?: string) => {
    if (isCalledRef.current) return [];
    isCalledRef.current = true;

    try {
      fileDispatch({ type: "SET_LOADING", payload: true });
      const tree = parentId
        ? await fetchNodes(parentId)
        : await fetchAllNodes();
      const normalizedTree = Array.isArray(tree) ? tree : [];

      fileDispatch({ type: "SET_FILE_TREE", payload: normalizedTree });
      fileDispatch({ type: "INCREMENT_REFRESH_KEY" });

      return normalizedTree;
    } catch (error) {
      handleApiError(error, showToast);
      return [];
    } finally {
      fileDispatch({ type: "SET_LOADING", payload: false });
      isCalledRef.current = false;
    }
  };

  // Handlers
  const handleFileSelect = (file: FileSystemNodeProps) => {
    fileDispatch({ type: "SET_NEW_FILE_MODE", payload: false });
    fileDispatch({ type: "SET_SELECTED_FILE", payload: file });
    openFileInTab(file);
  };

  const handleNewFile = () => {
    fileDispatch({ type: "SET_NEW_FILE_MODE", payload: true });
    createNewTab();
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    toast[type](message);
  };

  return (
    <>
      {/* Toolbar */}
      <Toolbar
        showLeftPanel={uiState.showLeftPanel}
        showSmartPrompts={uiState.showSmartPrompts}
        onToggleLeftPanel={() => uiDispatch({ type: "TOGGLE_LEFT_PANEL" })}
        onToggleSmartPrompts={() =>
          uiDispatch({ type: "TOGGLE_SMART_PROMPTS" })
        }
      />

      {/* Folder Picker Modal */}
      {folderPickerState.show && (
        <FolderPickerModal
          refreshKey={fileState.refreshKey}
          selectedFile={fileState.selectedFile}
          folderPickerState={folderPickerState}
          folderPickerDispatch={folderPickerDispatch}
          refreshFileExplorer={() =>
            fileDispatch({ type: "INCREMENT_REFRESH_KEY" })
          }
        />
      )}

      {/* Main content */}
      <div className="h-screen flex flex-1">
        {/* Left Panel - File Explorer */}
        <FileExplorerPanel
          showLeftPanel={uiState.showLeftPanel}
          selectedFile={fileState.selectedFile}
          refreshKey={fileState.refreshKey}
          isNewFileMode={fileState.isNewFileMode}
          onDocumentSelect={handleFileSelect}
        />

        {/* Middle Panel - Document Editor */}
        <DocumentEditorPanel
          openTabs={openTabs}
          activeTab={activeTab}
          activeTabId={activeTabId}
          isNewFileMode={fileState.isNewFileMode}
          isFolderPickerOpen={folderPickerState.show}
          onNewFile={handleNewFile}
          onTabClick={setActiveTabId}
          onTabClose={closeTab}
          onContentChange={(newContent) => {
            if (activeTabId) {
              updateTabContent(activeTabId, newContent);
            }
          }}
          onInitiateSave={(name, content, parentId, fileId, callback) => {
            folderPickerDispatch({
              type: "SHOW_FOLDER_PICKER",
              payload: {
                name,
                content,
                parentId,
                fileId,
                callback: (newFile: FileSystemNodeProps) => {
                  updateTabName(activeTabId!, newFile.name, newFile.id);
                  fileDispatch({ type: "INCREMENT_REFRESH_KEY" });
                  if (callback) callback(newFile);
                },
              },
            });
          }}
          onFileSelect={handleFileSelect}
          onFileTreeUpdate={fetchUpdatedFileTree}
        />

        {/* Smart Prompts Panel */}
        <div
          className={`${
            uiState.showSmartPrompts ? "w-80" : "w-0"
          } transition-all duration-200`}
        >
          <div
            className={`h-full overflow-hidden ${
              !uiState.showSmartPrompts && "invisible"
            }`}
          >
            <SmartPromptsPanel />
          </div>
        </div>
      </div>
    </>
  );
}

import { FileSystemNodeProps } from "@/types/fileSystem";
import { DocumentPane } from "../../DocumentPane";
import { TabBar } from "./TabBar";

interface TabInfo {
  id: string;
  name: string;
  content: string;
  fileId?: string | null;
  isUnsaved?: boolean;
}

interface DocumentEditorPanelProps {
  openTabs: TabInfo[];
  activeTabId: string | null;
  activeTab?: TabInfo;
  isNewFileMode: boolean;
  isFolderPickerOpen: boolean;
  onNewFile: () => void;
  onTabClick: (_tabId: string) => void;
  onTabClose: (_tabId: string) => void;
  onContentChange: (_content: string) => void;
  onInitiateSave: (
    _name: string,
    _content: string,
    _parentId: string | null,
    _fileId: string | null,
    _callback?: (_newFile: FileSystemNodeProps) => void
  ) => void;
  onFileSelect: (_file: FileSystemNodeProps) => void;
  onFileTreeUpdate: (_parentId?: string) => Promise<FileSystemNodeProps[]>;
}

export function DocumentEditorPanel({
  openTabs,
  activeTabId,
  activeTab,
  isNewFileMode,
  isFolderPickerOpen,
  onNewFile,
  onTabClick,
  onTabClose,
  onContentChange,
  onInitiateSave,
  onFileSelect,
  onFileTreeUpdate,
}: DocumentEditorPanelProps) {
  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Tab Bar */}
      <TabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onNewTab={onNewFile}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
      />

      {/* Editor Wrapper */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTabId ? (
          <DocumentPane
            key={activeTabId}
            onDocumentSelect={onFileSelect}
            content={activeTab?.content || ""}
            onContentChange={onContentChange}
            fileName={activeTab?.name || ""}
            fileId={activeTab?.fileId || ""}
            onInitiateSave={onInitiateSave}
            onFileTreeUpdate={onFileTreeUpdate}
            isFolderPickerOpen={isFolderPickerOpen}
            isNewFileMode={isNewFileMode}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No Document Open
              </h3>
              <p className="text-sm text-gray-500">
                Open a file from the file explorer to start working
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

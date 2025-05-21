import { FileSystemNodeProps } from "@/types/fileSystem";
import { FileExplorer } from "./FileExplorer";

interface FileExplorerPanelProps {
  showLeftPanel: boolean;
  selectedFile?: FileSystemNodeProps;
  refreshKey: number;
  isNewFileMode: boolean;
  onDocumentSelect: (_file: FileSystemNodeProps) => void;
  onPdfParsed: (_text: string) => void;
}

export function FileExplorerPanel({
  showLeftPanel,
  selectedFile,
  refreshKey,
  isNewFileMode,
  onDocumentSelect,
  onPdfParsed,
}: FileExplorerPanelProps) {
  return (
    <div
      className={`${
        showLeftPanel ? "w-56" : "w-0"
      } transition-all duration-200`}
    >
      <div
        className={`h-full overflow-hidden ${!showLeftPanel && "invisible"}`}
      >
        <FileExplorer
          key={`file-explorer-${refreshKey}`}
          selectedDocument={selectedFile}
          onDocumentSelect={onDocumentSelect}
          onPdfParsed={onPdfParsed}
          isFolderPickerOpen={false}
          isNewFileMode={isNewFileMode}
        />
      </div>
    </div>
  );
}

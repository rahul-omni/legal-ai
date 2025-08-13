import { SmartPromptsPanel } from "../SmartPromptsPanel";
import { DocumentEditorPanel } from "./components/DocumentEditorPanel";
import { FileExplorerPanel } from "./components/FileExplorerPanel";
import { FolderPickerModal } from "./components/FolderPickerModal";

export function LegalEditor() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 flex relative overflow-hidden">
        <FileExplorerPanel />
        <DocumentEditorPanel />
        <SmartPromptsPanel />
        <FolderPickerModal />
      </div>
    </div>
  );
}

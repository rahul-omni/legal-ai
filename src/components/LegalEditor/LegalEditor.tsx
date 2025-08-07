import { SmartPromptsPanel } from "../SmartPromptsPanel";
import { DocumentEditorPanel } from "./components/DocumentEditorPanel";
import { FileExplorerPanel } from "./components/FileExplorerPanel";
import { FolderPickerModal } from "./components/FolderPickerModal";
import { Toolbar } from "./components/Toolbar";

export function LegalEditor() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 flex relative overflow-hidden">
        <FileExplorerPanel />
        <DocumentEditorPanel />
        <SmartPromptsPanel />
        {/* <Toolbar /> */}
        <FolderPickerModal />
      </div>
    </div>
  );
}

import { SmartPromptsPanel } from "../SmartPromptsPanel";
import { DocumentEditorPanel } from "./components/DocumentEditorPanel";
import { FileExplorerPanel } from "./components/FileExplorerPanel";
import { FolderPickerModal } from "./components/FolderPickerModal";

type LegalEditorProps = {
  rootFolderId?: string;
  workspaceId?: string;
};

export function LegalEditor({ rootFolderId, workspaceId }: LegalEditorProps) {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 flex relative overflow-hidden">
        <FileExplorerPanel rootFolderId={rootFolderId} />
        <DocumentEditorPanel workspaceId={workspaceId} />
        <SmartPromptsPanel />
        <FolderPickerModal />
      </div>
    </div>
  );
}

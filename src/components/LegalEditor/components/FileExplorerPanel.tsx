import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { useUIState } from "../reducersContexts/editorUiReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { FileExplorer } from "./FileExplorer";

export function FileExplorerPanel() {
  const { explorerState, handleSelectFile } = useExplorerContext();
  const { docEditorDispatch } = useDocumentEditor();
  const { state: uiState } = useUIState();

  return (
    <div
      className={`${
        uiState.showLeftPanel ? "w-56" : "w-0"
      } transition-all duration-200`}
    >
      <div
        className={`h-full overflow-hidden ${!uiState.showLeftPanel && "invisible"}`}
      >
        <FileExplorer
          key={`file-explorer-${explorerState.refreshKey}`}
          selectedDocument={explorerState.selectedFile}
          onDocumentSelect={(file) => {
            handleSelectFile(file);
            docEditorDispatch({ type: "FILE_SELECT", payload: file });
          }}
          isFolderPickerOpen={false}
        />
      </div>
    </div>
  );
}

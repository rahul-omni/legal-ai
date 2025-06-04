import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { useUIState } from "../reducersContexts/editorUiReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { FileExplorer } from "./FileExplorer";

export function FileExplorerPanel() {
  const { explorerState, explorerDispatch } = useExplorerContext();
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
            explorerDispatch({ type: "SELECT_FILE", payload: file });
            docEditorDispatch({ type: "FILE_SELECT", payload: file });
          }}
        />
      </div>
    </div>
  );
}

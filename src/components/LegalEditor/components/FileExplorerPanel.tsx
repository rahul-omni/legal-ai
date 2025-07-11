import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { useUIState } from "../reducersContexts/editorUiReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { FileExplorer } from "./FileExplorer";
import { fetchNodes } from "@/app/apiServices/nodeServices";

export function FileExplorerPanel() {
  const { explorerState, explorerDispatch } = useExplorerContext();
  const { docEditorDispatch, docEditorState } = useDocumentEditor();
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
          onDocumentSelect={async (file) => {
            const fetched = docEditorState.openTabs.find(
              (tab) => file.id === tab.fileId
            );
            if (!fetched) {
              const fileNode = await fetchNodes("", file.id)
              if (fileNode.length){
                explorerDispatch({ type: "SELECT_FILE", payload: fileNode[0] });
                docEditorDispatch({ type: "FILE_SELECT", payload: fileNode[0] });
              }
          }
          }}
        />
      </div>
    </div>
  );
}

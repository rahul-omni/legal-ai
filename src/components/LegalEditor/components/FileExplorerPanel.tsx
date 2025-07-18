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
              (tab) => {
                if (file.id === tab.fileId){
                  return tab;
                }
              });
            if (!fetched) {
              docEditorDispatch({ type: "FILE_LOADING", payload: {isFileLoading: true }});
              const fileNode = await fetchNodes("", file.id)
              if (fileNode.length){
                explorerDispatch({ type: "SELECT_FILE", payload: fileNode[0] });
                docEditorDispatch({ type: "FILE_SELECT", payload: fileNode[0] });
                docEditorDispatch({ type: "FILE_LOADING", payload: {isFileLoading: false }});
              }
            }else{
              docEditorDispatch({ type: "TAB_CLICK", payload: fetched.id });
            }
          }}
        />
      </div>
    </div>
  );
}

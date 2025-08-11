import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { DocumentPane } from "./DocumentPane";
import { TabBar } from "./TabBar";
import { Spinner } from "@/components/Loader";

export function DocumentEditorPanel() {
  const { docEditorState } = useDocumentEditor();

  return (
    <div className="flex-1 bg-background flex flex-col h-full">
      
      <div className="flex-1 relative flex flex-col min-h-0">
        {docEditorState.isFileLoading ? <Spinner/> : docEditorState.activeTabId ? (
          <DocumentPane key={docEditorState.activeTabId} />
        ) : (
          <NoDocumentOpenMessage />
        )}
      </div>
    </div>
  );
}
const NoDocumentOpenMessage = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No Document Selected
        </h3>
        <p className="text-sm text-gray-500">
          Open a file from the file explorer to start working
        </p>
      </div>
    </div>
  );
};

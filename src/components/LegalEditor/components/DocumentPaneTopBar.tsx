import { updateNodeContent } from "@/app/apiServices/nodeServices";
import { useLoadingContext } from "@/context/loadingContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { SaveDropdown } from "../../SaveDropdown";
import { TranslationDropdown } from "../../TranslationDropdown";
import {
  TabInfo,
  useDocumentEditor,
} from "../reducersContexts/documentEditorReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import toast from "react-hot-toast";

interface DocumentPaneTopBarProps {
  onFileReviewRequest: () => void;
}

export function DocumentPaneTopBar({
  onFileReviewRequest,
}: DocumentPaneTopBarProps) {
  const {
    docEditorState,
    lexicalEditorRef,
    docEditorDispatch,
    handleSaveAs,
    handleTranslate,
    handleInitiateSave,
  } = useDocumentEditor();
  const { explorerState } = useExplorerContext();
  const { isLoading } = useLoadingContext();

  const {
    activeTabId,
    openTabs,
    isSaving,
    selectedLanguage,
    translationVendor,
  } = docEditorState;

  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  const handleLanguageChange = (language: string) => {
    handleTranslate(translationVendor, language);
  };

  const handleVendorChange = (vendor: any) => {
    handleTranslate(vendor, selectedLanguage);
  };

  const handleSave = async () => {
    if (!activeTabId) return;

    const activeTab = openTabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) return;

    try {
      docEditorDispatch({ type: "START_SAVE" });

      return activeTab.fileId
        ? await handleExistingFileSave(activeTab)
        : await handleNewFileSave(activeTab);
    } finally {
      console.log("Save operation completed");
    }
  };

  const handleNewFileSave = async (tab: TabInfo) => {
    const fileName = promptForFileName(tab.name);
    if (!fileName) return;

    handleInitiateSave(fileName, tab.content, undefined, null, (newFile) => {
      docEditorDispatch({
        type: "UPDATE_TAB_NAME",
        payload: { tabId: tab.id, name: newFile.name, fileId: newFile.id },
      });
    });
  };

  const handleExistingFileSave = async (tab: TabInfo) => {
    let content = "";
    lexicalEditorRef.current!.getEditorState().read(() => {
      content = $generateHtmlFromNodes(lexicalEditorRef.current!);
    });

    const data = await updateNodeContent(tab.fileId!, content);

    if (!data) {
      toast.error("Failed to save document");
      return;
    }

    docEditorDispatch({
      type: "UPDATE_TAB_CONTENT",
      payload: {
        tabId: tab.id,
        content: data.content!,
      },
    });
  };

  const promptForFileName = (defaultName = "Untitled"): string | null => {
    return window.prompt("Enter file name:", defaultName);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex justify-between items-center px-3 py-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-medium text-gray-700 truncate max-w-md">
            {activeTab?.name || "Untitled Document"}{" "}
            {!activeTab?.fileId && "(Unsaved)"}
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <TranslationDropdown
            onTranslate={handleTranslate}
            isLoading={isLoading("TRANSLATE_TEXT")}
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            selectedVendor={translationVendor}
            onVendorChange={handleVendorChange}
          />
          {!explorerState.isNewFileMode && (
            <button
              onClick={onFileReviewRequest}
              className="ml-2 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              Review Request
            </button>
          )}
          <SaveDropdown
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            isNewFile={!activeTab?.fileId}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}

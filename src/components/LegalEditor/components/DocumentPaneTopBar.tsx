import { TranslationDropdown } from "../../TranslationDropdown";
import { SaveDropdown } from "../../SaveDropdown";
import { useLoadingContext } from "@/context/loadingContext";
import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";

interface DocumentPaneTopBarProps {
  onFileReviewRequest: () => void;
}

export function DocumentPaneTopBar({ onFileReviewRequest }: DocumentPaneTopBarProps) {
  const { docEditorState: docState, handleSave, handleSaveAs, handleTranslate } = useDocumentEditor();
  const { explorerState } = useExplorerContext();
  const { isLoading } = useLoadingContext();

  const { activeTabId, openTabs, isSaving, selectedLanguage, translationVendor } = docState;
  const activeTab = openTabs.find(tab => tab.id === activeTabId);
  
  const handleLanguageChange = (language: string) => {
    handleTranslate(translationVendor, language);
  };
  
  const handleVendorChange = (vendor: any) => {
    handleTranslate(vendor, selectedLanguage);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex justify-between items-center px-3 py-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-medium text-gray-700 truncate max-w-md">
            {activeTab?.name || "Untitled Document"} {!activeTab?.fileId && "(Unsaved)"}
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
            name={activeTab?.name || ""}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}

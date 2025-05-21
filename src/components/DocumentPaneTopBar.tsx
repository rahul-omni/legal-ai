import { TranslationDropdown } from "./TranslationDropdown";
import { SaveDropdown } from "./SaveDropdown";
import { TranslationVendor } from "@/lib/translation/types";
import { Dispatch, SetStateAction } from "react";

interface DocumentPaneTopBarProps {
  localFileName: string;
  fileId?: string | null;
  isNewFileMode?: boolean;
  handleTranslate: any;
  isLoading: boolean;
  selectedLanguage: string;
  setSelectedLanguage: (_lang: string) => void;
  translationVendor: TranslationVendor;
  setTranslationVendor: Dispatch<SetStateAction<TranslationVendor>>;
  onFileReviewRequest: () => void;
  handleSave: () => void;
  handleSaveAs: (_name?: string) => void;
  isSaving: boolean;
}

export function DocumentPaneTopBar({
  localFileName,
  fileId,
  isNewFileMode,
  handleTranslate,
  isLoading,
  selectedLanguage,
  setSelectedLanguage,
  translationVendor,
  setTranslationVendor,
  onFileReviewRequest,
  handleSave,
  handleSaveAs,
  isSaving,
}: DocumentPaneTopBarProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex justify-between items-center px-3 py-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-medium text-gray-700 truncate max-w-md">
            {localFileName || "Untitled Document"} {!fileId && "(Unsaved)"}
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <TranslationDropdown
            onTranslate={handleTranslate}
            isLoading={isLoading}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            selectedVendor={translationVendor}
            onVendorChange={setTranslationVendor}
          />
          {!isNewFileMode && (
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
            isNewFile={!fileId}
            name={localFileName || ""}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}

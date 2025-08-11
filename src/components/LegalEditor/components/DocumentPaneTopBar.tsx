import { updateNodeContent } from "@/app/apiServices/nodeServices";
import { useLoadingContext } from "@/context/loadingContext";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { $generateHtmlFromNodes } from "@lexical/html";
import { LexicalEditor } from "lexical";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SaveDropdown } from "../../SaveDropdown";
import { TranslationDropdown } from "../../TranslationDropdown";
import {
  TabInfo,
  useDocumentEditor,
} from "../reducersContexts/documentEditorReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { useFolderPicker } from "../reducersContexts/folderPickerReducerContext";
import Header from "@/components/ui/Header";
import  Button  from "@/components/ui/Button";
import { TranslationVendor } from "@/lib/translation/types";

interface DocumentPaneTopBarProps {
  onFileReviewRequest: () => void;
}

export function DocumentPaneTopBar({
  onFileReviewRequest,
}: DocumentPaneTopBarProps) {
  const {
    docEditorState: {
      activeTabId,
      openTabs,
      isSaving,
    },
    lexicalEditorRef,
    docEditorDispatch,
    handleTranslate,
  } = useDocumentEditor();

  const { explorerState } = useExplorerContext();
  const { isLoading } = useLoadingContext();
  const { dispatch: folderPickerDispatch } = useFolderPicker();
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [translationVendor, setTranslationVendoe] = useState<TranslationVendor>('openai');

  const activeTab = useMemo(
    () => openTabs.find((tab) => tab.id === activeTabId),
    [openTabs, activeTabId]
  );

  const generateEditorHtml = (editor: LexicalEditor) => {
    let content = "";
    editor.getEditorState().read(() => {
      content = $generateHtmlFromNodes(editor);
    });
    return content;
  };

  const handleLanguageChange = (language: string) =>{
    setSelectedLanguage(language)
  }

  const handleVendorChange = (vendor: TranslationVendor) => {
    setTranslationVendoe(vendor)
  }
  const handleExistingFileSave = async (tab: TabInfo) => {
    if (!tab.fileId) return;

    const htmlContent = generateEditorHtml(lexicalEditorRef.current!);
    const data = await updateNodeContent(tab.fileId, htmlContent);

    if (!data) {
      toast.error("Failed to save document");
      return;
    }

    docEditorDispatch({
      type: "UPDATE_TAB_CONTENT",
      payload: { tabId: tab.id, content: data.content! },
    });
  };

  const handleInitiateSave = (
    name: string,
    content: string,
    parentId?: string,
    fileId?: string | null,
    callback?: (_newFile: FileSystemNodeProps) => void
  ) => {
    folderPickerDispatch({
      type: "SHOW_PICKER",
      payload: { name, content, parentId, fileId, callback },
    });

    docEditorDispatch({
      type: "INITIATE_SAVE",
      payload: { name, content, parentId, fileId, callback },
    });
  };

  const handleNewFileSave = async (tab: TabInfo) => {
    const fileName = window.prompt("Enter file name:", tab.name);
    if (!fileName) return;

    const htmlContent = generateEditorHtml(lexicalEditorRef.current!);
    handleInitiateSave(fileName, htmlContent, undefined, null, (newFile) => {
      docEditorDispatch({
        type: "UPDATE_TAB_NAME",
        payload: { tabId: tab.id, name: newFile.name, fileId: newFile.id },
      });
      docEditorDispatch({
        type: "UPDATE_TAB_CONTENT",
        payload: { tabId: tab.id, content: newFile.content! },
      });
    });
  };

  const handleSave = async () => {
    if (!activeTabId || !activeTab) return;

    try {
      docEditorDispatch({ type: "START_SAVE" });
      return activeTab.fileId
        ? await handleExistingFileSave(activeTab)
        : await handleNewFileSave(activeTab);
    } finally {
      console.log("Save operation completed");
    }
  };
  /**
   * Handles "Save As" functionality
   */
  const handleSaveAs = async (name?: string) => {
    if (!activeTabId || !activeTab) return;

    const fileName =
      name || window.prompt("Enter new file name:", activeTab.name);
    if (!fileName) return;

    docEditorDispatch({ type: "START_SAVE" });

    handleInitiateSave(
      fileName,
      activeTab.content,
      undefined,
      activeTab.fileId,
      (newFile) => {
        docEditorDispatch({
          type: "FILE_SELECT",
          payload: {
            ...newFile,
            content: activeTab.content,
          },
        });
        
      }
    );
  };

  return (
    <div className="bg-background">
      <div className="flex justify-between items-center px-6 py-1">
        <div className="flex items-center space-x-2">
          <Header 
            headerTitle={`${activeTab?.name || "Untitled Document"}${!activeTab?.fileId ? " (Unsaved)" : ""}`}
            truncate={true}
          />
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

            <Button
              variant="secondary"
              size="md"
              fullWidth={true}
              className="ml-2"
              onClick={onFileReviewRequest}
            >
              Review
            </Button>
          )}

          <SaveDropdown
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}

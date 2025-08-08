import { updateNodeContent } from "@/app/apiServices/nodeServices";
import { useLoadingContext } from "@/context/loadingContext";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { $generateHtmlFromNodes } from "@lexical/html";
import { LexicalEditor } from "lexical";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { SaveDropdown } from "../../SaveDropdown";
import { TranslationDropdown } from "../../TranslationDropdown";
import {
  TabInfo,
  useDocumentEditor,
} from "../reducersContexts/documentEditorReducerContext";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { useFolderPicker } from "../reducersContexts/folderPickerReducerContext";
import { useParams } from "next/navigation";

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
      selectedLanguage,
      translationVendor,
    },
    lexicalEditorRef,
    docEditorDispatch,
    handleTranslate,
  } = useDocumentEditor();

  const { explorerState } = useExplorerContext();
  const { isLoading } = useLoadingContext();
  const { dispatch: folderPickerDispatch } = useFolderPicker();
  const params = useParams();
  const pId = params.id as string;

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

  const handleLanguageChange = (language: string) =>
    handleTranslate(translationVendor, language);

  const handleVendorChange = (vendor: any) =>
    handleTranslate(vendor, selectedLanguage);

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
  
  handleInitiateSave(fileName, htmlContent, pId, null, (newFile) => {
    docEditorDispatch({
      type: "UPDATE_TAB_NAME",
      payload: { tabId: tab.id, name: newFile.name, fileId: newFile.id },
    });
    
    docEditorDispatch({
      type: "UPDATE_TAB_CONTENT",
      payload: { 
        tabId: tab.id, 
        content: newFile.content!,
      },
    });
    
    // Reset saving state and ensure popup visibility
    docEditorDispatch({ type: "CANCEL_SAVE" });
  });
};
  // const handleNewFileSave = async (tab: TabInfo) => {
  //   const fileName = window.prompt("Enter file name:", tab.name);
  //   if (!fileName) return;

  // //  console.log("parentId:", parentId);
  //  console.log("pId:", pId);
   
  //   const htmlContent = generateEditorHtml(lexicalEditorRef.current!);
  //   handleInitiateSave(fileName, htmlContent, pId, null, (newFile) => {
  //     docEditorDispatch({
  //       type: "UPDATE_TAB_NAME",
  //       payload: { tabId: tab.id, name: newFile.name, fileId: newFile.id  },
  //     });
  //     docEditorDispatch({
  //       type: "UPDATE_TAB_CONTENT",
  //       payload: { tabId: tab.id, content: newFile.content! ,  isAIEdit: true,},
  //     });
  //      docEditorDispatch({
  //     type: "UPDATE_IS_AI_EDIT",
  //     payload: { isAIEdit: true }, // ✅ Ensures popup shows even if above is missed
  //   });
  //   });
  // };

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

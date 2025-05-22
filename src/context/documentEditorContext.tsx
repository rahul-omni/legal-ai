import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  Dispatch,
} from "react";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { TranslationVendor } from "@/lib/translation/types";

// Interface for TabInfo
export interface TabInfo {
  id: string;
  name: string;
  content: string;
  fileId?: string | null;
  isUnsaved?: boolean;
}

// State interface
interface DocumentEditorState {
  openTabs: TabInfo[];
  activeTabId: string | null;
  isNewFileMode: boolean;
  isFolderPickerOpen: boolean;
  isSaving: boolean;
  selectedLanguage: string;
  translationVendor: TranslationVendor;
  localFileName: string;
  localContent: string;
}

// Action types
type DocumentEditorAction =
  | { type: "SET_TABS"; payload: TabInfo[] }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "CLOSE_TAB"; payload: string }
  | { type: "SET_NEW_FILE_MODE"; payload: boolean }
  | { type: "SET_FOLDER_PICKER_OPEN"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_SELECTED_LANGUAGE"; payload: string }
  | { type: "SET_TRANSLATION_VENDOR"; payload: TranslationVendor }
  | { type: "SET_LOCAL_FILE_NAME"; payload: string }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "UPDATE_TAB_CONTENT"; payload: { tabId: string; content: string } }
  | { type: "CREATE_NEW_TAB" }
  | {
      type: "UPDATE_TAB_NAME";
      payload: { tabId: string; name: string; fileId?: string };
    };

// Context interface with state and handlers
interface DocumentEditorContextType {
  state: DocumentEditorState;
  dispatch: Dispatch<DocumentEditorAction>;
  handleNewFile: () => void;
  handleTabClick: (_tabId: string) => void;
  handleTabClose: (_tabId: string) => void;
  handleContentChange: (_content: string) => void;
  handleTranslate: (
    _vendor: TranslationVendor,
    _language: string
  ) => Promise<void>;
  handleSave: () => Promise<string | undefined>;
  handleSaveAs: (_name?: string) => Promise<void>;
  handleFileSelect: (_file: FileSystemNodeProps) => void;
  handleFileReviewRequest: () => void;
  handleInitiateSave: (
    _name: string,
    _content: string,
    _parentId: string | null,
    _fileId: string | null,
    _callback?: (_newFile: FileSystemNodeProps) => void
  ) => void;
  handleFileTreeUpdate: (_parentId?: string) => Promise<FileSystemNodeProps[]>;
}

// Default state
const initialState: DocumentEditorState = {
  openTabs: [],
  activeTabId: null,
  isNewFileMode: false,
  isFolderPickerOpen: false,
  isSaving: false,
  selectedLanguage: "hi-IN",
  translationVendor: "openai",
  localFileName: "Untitled",
  localContent: "",
};

// Create context with default values
const DocumentEditorContext = createContext<
  DocumentEditorContextType | undefined
>(undefined);

// Create reducer
function documentEditorReducer(
  state: DocumentEditorState,
  action: DocumentEditorAction
): DocumentEditorState {
  switch (action.type) {
    case "SET_TABS":
      return { ...state, openTabs: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTabId: action.payload };
    case "CLOSE_TAB":
      return {
        ...state,
        openTabs: state.openTabs.filter((tab) => tab.id !== action.payload),
        activeTabId:
          state.activeTabId === action.payload
            ? state.openTabs.find((tab) => tab.id !== action.payload)?.id ||
              null
            : state.activeTabId,
      };
    case "SET_NEW_FILE_MODE":
      return { ...state, isNewFileMode: action.payload };
    case "SET_FOLDER_PICKER_OPEN":
      return { ...state, isFolderPickerOpen: action.payload };
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_SELECTED_LANGUAGE":
      return { ...state, selectedLanguage: action.payload };
    case "SET_TRANSLATION_VENDOR":
      return { ...state, translationVendor: action.payload };
    case "SET_LOCAL_FILE_NAME":
      return { ...state, localFileName: action.payload };
    case "SET_CONTENT":
      return { ...state, localContent: action.payload };
    case "UPDATE_TAB_CONTENT":
      return {
        ...state,
        openTabs: state.openTabs.map((tab) =>
          tab.id === action.payload.tabId
            ? { ...tab, content: action.payload.content, isUnsaved: true }
            : tab
        ),
      };
    case "CREATE_NEW_TAB": {
      const newTabId = `tab-${Date.now()}`;
      return {
        ...state,
        openTabs: [
          ...state.openTabs,
          { id: newTabId, name: "Untitled", content: "", isUnsaved: true },
        ],
        activeTabId: newTabId,
      };
    }
    case "UPDATE_TAB_NAME":
      return {
        ...state,
        openTabs: state.openTabs.map((tab) =>
          tab.id === action.payload.tabId
            ? {
                ...tab,
                name: action.payload.name,
                fileId: action.payload.fileId,
                isUnsaved: false,
              }
            : tab
        ),
      };
    default:
      return state;
  }
}

// Create provider component
interface DocumentEditorProviderProps {
  children: ReactNode;
  initialTabs?: TabInfo[];
  activeTabId?: string | null;
  onFileSelect?: (_file: FileSystemNodeProps) => void;
  onFileTreeUpdate?: (_parentId?: string) => Promise<FileSystemNodeProps[]>;
}

export function DocumentEditorProvider({
  children,
  initialTabs = [],
  activeTabId = null,
  onFileSelect,
  onFileTreeUpdate,
}: DocumentEditorProviderProps) {
  const [state, dispatch] = useReducer(documentEditorReducer, {
    ...initialState,
    openTabs: initialTabs,
    activeTabId,
  });

  // Handler functions
  const handleNewFile = () => {
    dispatch({ type: "SET_NEW_FILE_MODE", payload: true });
    dispatch({ type: "CREATE_NEW_TAB" });
  };

  const handleTabClick = (tabId: string) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tabId });
  };

  const handleTabClose = (tabId: string) => {
    dispatch({ type: "CLOSE_TAB", payload: tabId });
  };

  const handleContentChange = (content: string) => {
    if (state.activeTabId) {
      dispatch({
        type: "UPDATE_TAB_CONTENT",
        payload: { tabId: state.activeTabId, content },
      });
    }
    dispatch({ type: "SET_CONTENT", payload: content });
  };

  const handleTranslate = async (
    vendor: TranslationVendor,
    language: string
  ) => {
    // The implementation will be handled in the DocumentPane component,
    // but we define the interface here
    dispatch({ type: "SET_SELECTED_LANGUAGE", payload: language });
    dispatch({ type: "SET_TRANSLATION_VENDOR", payload: vendor });
  };

  const handleSave = async (): Promise<string | undefined> => {
    // Implementation to be provided in DocumentPane
    dispatch({ type: "SET_SAVING", payload: true });
    return undefined;
  };

  const handleSaveAs = async (_name?: string): Promise<void> => {
    // Implementation to be provided in DocumentPane
  };

  const handleFileSelect = (file: FileSystemNodeProps) => {
    dispatch({ type: "SET_NEW_FILE_MODE", payload: false });
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleFileReviewRequest = () => {
    // Will be implemented in DocumentPane
  };

  const handleInitiateSave = (
    _name: string,
    _content: string,
    _parentId: string | null,
    _fileId: string | null,
    _callback?: (_newFile: FileSystemNodeProps) => void
  ) => {
    // Implementation to be handled by parent component
    dispatch({ type: "SET_FOLDER_PICKER_OPEN", payload: true });
  };

  const handleFileTreeUpdate = async (
    parentId?: string
  ): Promise<FileSystemNodeProps[]> => {
    if (onFileTreeUpdate) {
      return await onFileTreeUpdate(parentId);
    }
    return [];
  };

  const contextValue: DocumentEditorContextType = {
    state,
    dispatch,
    handleNewFile,
    handleTabClick,
    handleTabClose,
    handleContentChange,
    handleTranslate,
    handleSave,
    handleSaveAs,
    handleFileSelect,
    handleFileReviewRequest,
    handleInitiateSave,
    handleFileTreeUpdate,
  };

  return (
    <DocumentEditorContext.Provider value={contextValue}>
      {children}
    </DocumentEditorContext.Provider>
  );
}

// Custom hook to use the context
export const useDocumentEditor = (): DocumentEditorContextType => {
  const context = useContext(DocumentEditorContext);
  if (!context) {
    throw new Error(
      "useDocumentEditor must be used within a DocumentEditorProvider"
    );
  }
  return context;
};

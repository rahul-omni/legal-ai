import { TranslationVendor } from "@/lib/translation/types";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { LexicalEditor } from "lexical";
import {
  createContext,
  Dispatch,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { useFolderPicker } from "./folderPickerReducerContext";

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
  isAIEdit: boolean;
  isTranslating: boolean;
}

// Action types - renamed to match handler functions
type DocumentEditorAction =
  | { type: "NEW_FILE" }
  | { type: "TAB_CLICK"; payload: string }
  | { type: "TAB_CLOSE"; payload: string }
  | {
      type: "TRANSLATE";
      payload: { vendor: TranslationVendor; language: string };
    }
  | { type: "START_SAVE" }
  | { type: "CANCEL_SAVE" }
  | { type: "FILE_SELECT"; payload: FileSystemNodeProps }
  | {
      type: "INITIATE_SAVE";
      payload: {
        name: string;
        content: string;
        parentId?: string;
        fileId?: string | null;
        callback?: (_newFile: FileSystemNodeProps) => void;
      };
    }
  | { type: "UPDATE_TAB_CONTENT"; payload: { tabId: string; content: string, isAIEdit?: boolean } }
  | { type: "UPDATE_IS_AI_EDIT"; payload : { isAIEdit: boolean } }
  | { type: "IS_TRANSLATING"; payload : { isTranslating: boolean } }
  | {
      type: "UPDATE_TAB_NAME";
      payload: { tabId: string; name: string; fileId?: string };
    };

// Create reducer
function documentEditorReducer(
  state: DocumentEditorState,
  action: DocumentEditorAction
): DocumentEditorState {
  switch (action.type) {
    case "NEW_FILE": {
      const newTabId = `tab-${Date.now()}`;
      return {
        ...state,
        isNewFileMode: true,
        openTabs: [
          ...state.openTabs,
          { id: newTabId, name: "Untitled", content: "", isUnsaved: true },
        ],
        activeTabId: newTabId,
      };
    }

    case "TAB_CLICK":
      return {
        ...state,
        activeTabId: action.payload,
      };

    case "UPDATE_IS_AI_EDIT":
      return {
        ...state,
        isAIEdit: !!action.payload.isAIEdit,
      };
    
    case "IS_TRANSLATING":
      return {
        ...state,
        isTranslating: !!action.payload.isTranslating,
      };

    case "TAB_CLOSE": {
      const newTabs = state.openTabs.filter((tab) => tab.id !== action.payload);
      return {
        ...state,
        openTabs: newTabs,
        activeTabId:
          state.activeTabId === action.payload
            ? newTabs[0]?.id || null
            : state.activeTabId,
      };
    }

    case "TRANSLATE":
      return {
        ...state,
        selectedLanguage: action.payload.language,
        translationVendor: action.payload.vendor,
      };

    case "START_SAVE":
      return { ...state, isSaving: true };

    case "CANCEL_SAVE":
      return { ...state, isSaving: false };

    case "FILE_SELECT": {
      const file = action.payload;
      const existingTab = state.openTabs.find((tab) => tab.fileId === file.id);

      if (existingTab) {
        return {
          ...state,
          activeTabId: existingTab.id,
          isNewFileMode: false,
        };
      }

      const newTabId = `tab-${Date.now()}`;
      const newTab = {
        id: newTabId,
        name: file.name,
        content: file.content || "",
        fileId: file.id,
        isUnsaved: false,
      };

      return {
        ...state,
        isSaving: false,
        openTabs: [...state.openTabs, newTab],
        activeTabId: newTabId,
        isNewFileMode: false,
        localContent: file.content || "",
        localFileName: file.name,
      };
    }

    case "INITIATE_SAVE":
      return {
        ...state,
        isFolderPickerOpen: true,
      };

    case "UPDATE_TAB_CONTENT":
      return {
        ...state,
        isSaving: false,
        openTabs: state.openTabs.map((tab) =>
          tab.id === action.payload.tabId
            ? { ...tab, content: action.payload.content, isUnsaved: true }
            : tab
        ),
        isAIEdit: !!action.payload.isAIEdit,
      };

    case "UPDATE_TAB_NAME":
      return {
        ...state,
        isSaving: false,
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

// Context interface with state and handlers
interface DocumentEditorContextType {
  docEditorState: DocumentEditorState;
  lexicalEditorRef: RefObject<LexicalEditor | null>;
  docEditorDispatch: Dispatch<DocumentEditorAction>;
  handleNewFile: () => void;
  handleTabClose: (_tabId: string) => void;
  handleTranslate: (
    _vendor: TranslationVendor,
    _language: string
  ) => Promise<void>;
  handleFileReviewRequest: () => void;
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
  isAIEdit: false,
  isTranslating: false,
};

// Create context with default values
const documentEditorContext = createContext<
  DocumentEditorContextType | undefined
>(undefined);

// Create provider component
interface DocumentEditorProviderProps {
  children: ReactNode;
  initialTabs?: TabInfo[];
  activeTabId?: string | null;
}

export function DocumentEditorProvider({
  children,
  initialTabs = [],
  activeTabId = null,
}: DocumentEditorProviderProps) {
  const [docEditorState, docEditorDispatch] = useReducer(
    documentEditorReducer,
    {
      ...initialState,
      openTabs: initialTabs,
      activeTabId,
    }
  );

  const lexicalEditorRef = useRef<LexicalEditor>(null);

  useEffect(() => {
    return () => {
      lexicalEditorRef.current = null;
    };
  }, []);

  const folderPickerContext = useFolderPicker();

  // Handler functions - simplified with direct dispatch calls
  const handleNewFile = () => {
    docEditorDispatch({ type: "NEW_FILE" });
  };

  const handleTabClose = (tabId: string) => {
    docEditorDispatch({ type: "TAB_CLOSE", payload: tabId });
  };

  const handleTranslate = async (
    vendor: TranslationVendor,
    language: string
  ): Promise<void> => {
    docEditorDispatch({
      type: "TRANSLATE",
      payload: { vendor, language },
    });

    docEditorDispatch({
      type: "IS_TRANSLATING",
      payload: { isTranslating: true },
    });

    if (!docEditorState.activeTabId) return;

    const activeTab = docEditorState.openTabs.find(
      (tab) => tab.id === docEditorState.activeTabId
    );
    if (!activeTab) return;

    try {
      const sourceText = activeTab.content;

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          sourceText,
          targetLanguage: language,
          mode: "formal",
        }),
      });

      if (!response.ok) throw new Error("Translation failed");
      const data = await response.json();

      docEditorDispatch({
        type: "UPDATE_TAB_CONTENT",
        payload: {
          tabId: docEditorState.activeTabId,
          content: data.translation,
          isAIEdit: true
        },
      });

      docEditorDispatch({
        type: "IS_TRANSLATING",
        payload: { isTranslating: false },
      });

      return Promise.resolve();
    } catch (error) {
      console.error("Translation error:", error);
      return Promise.reject(error);
    }
  };

  const handleFileReviewRequest = () => {
    // This will be implemented in the DocumentPane component
    // Logic will open the review modal
  };

  const handleFileTreeUpdate = async (
    _parentId?: string
  ): Promise<FileSystemNodeProps[]> => {
    // This should be implemented in the parent component
    // to update the file tree after operations
    return [];
  };

  const contextValue: DocumentEditorContextType = {
    docEditorState,
    lexicalEditorRef,
    docEditorDispatch,
    handleNewFile,
    handleTabClose,
    handleTranslate,
    handleFileReviewRequest,
    handleFileTreeUpdate,
  };

  return (
    <documentEditorContext.Provider value={contextValue}>
      {children}
    </documentEditorContext.Provider>
  );
}

export const useDocumentEditor = (): DocumentEditorContextType => {
  const context = useContext(documentEditorContext);
  if (!context) {
    throw new Error(
      "useDocumentEditor must be used within a DocumentEditorProvider"
    );
  }
  return context;
};

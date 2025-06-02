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
import { useFolderPickerState } from "./folderPickerReducerContext";

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
  | { type: "START_SAVE_AS"; payload: { name: string } }
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
  | { type: "UPDATE_TAB_CONTENT"; payload: { tabId: string; content: string } }
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
      console.log(
        `%c[Reducer] NEW_FILE: Creating new tab with ID ${newTabId}`,
        "color: green; font-weight: bold;"
      );
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
      console.log(
        `%c[Reducer] TAB_CLICK: Switching to tab with ID ${action.payload}`,
        "color: blue; font-weight: bold;"
      );
      return {
        ...state,
        activeTabId: action.payload,
      };

    case "TAB_CLOSE": {
      console.log(
        `%c[Reducer] TAB_CLOSE: Closing tab with ID ${action.payload}`,
        "color: red; font-weight: bold;"
      );
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
      console.log(
        `%c[Reducer] TRANSLATE: Setting translation vendor to ${action.payload.vendor} and language to ${action.payload.language}`,
        "color: teal; font-weight: bold;"
      );
      return {
        ...state,
        selectedLanguage: action.payload.language,
        translationVendor: action.payload.vendor,
      };

    case "START_SAVE":
      console.log(
        `%c[Reducer] START_SAVE: Initiating save process`,
        "color: green; font-weight: bold;"
      );
      return {
        ...state,
        isSaving: true,
      };

    case "FILE_SELECT": {
      const file = action.payload;
      console.log(
        `%c[Reducer] FILE_SELECT: Selecting file with ID ${file.id} and name ${file.name}`,
        "color: blue; font-weight: bold;"
      );
      const existingTab = state.openTabs.find((tab) => tab.fileId === file.id);

      if (existingTab) {
        console.log(
          `%c[Reducer] FILE_SELECT: File already open in tab ID ${existingTab.id}`,
          "color: orange; font-weight: bold;"
        );
        return {
          ...state,
          activeTabId: existingTab.id,
          isNewFileMode: false,
        };
      }

      const newTabId = `tab-${Date.now()}`;
      console.log(
        `%c[Reducer] FILE_SELECT: Creating new tab for file with ID ${file.id}`,
        "color: green; font-weight: bold;"
      );
      const newTab = {
        id: newTabId,
        name: file.name,
        content: file.content || "",
        fileId: file.id,
        isUnsaved: false,
      };

      return {
        ...state,
        openTabs: [...state.openTabs, newTab],
        activeTabId: newTabId,
        isNewFileMode: false,
        localContent: file.content || "",
        localFileName: file.name,
      };
    }

    case "INITIATE_SAVE":
      console.log(
        `%c[Reducer] INITIATE_SAVE: Opening folder picker for save operation`,
        "color: teal; font-weight: bold;"
      );
      return {
        ...state,
        isFolderPickerOpen: true,
      };

    case "UPDATE_TAB_CONTENT":
      console.log(
        `%c[Reducer] UPDATE_TAB_CONTENT: Updating content for tab ID ${action.payload.tabId}`,
        "color: purple; font-weight: bold;"
      );
      return {
        ...state,
        isSaving: false,
        openTabs: state.openTabs.map((tab) =>
          tab.id === action.payload.tabId
            ? { ...tab, content: action.payload.content, isUnsaved: true }
            : tab
        ),
      };

    case "UPDATE_TAB_NAME":
      console.log(
        `%c[Reducer] UPDATE_TAB_NAME: Updating name for tab ID ${action.payload.tabId} to ${action.payload.name}`,
        "color: blue; font-weight: bold;"
      );
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
      console.warn(
        `%c[Reducer] Unknown action type: ${action.type}`,
        "color: red; font-weight: bold;"
      );
      return state;
  }
}

// Context interface with state and handlers
interface DocumentEditorContextType {
  docEditorState: DocumentEditorState;
  lexicalEditorRef: RefObject<LexicalEditor | null>;
  docEditorDispatch: Dispatch<DocumentEditorAction>;
  handleNewFile: () => void;
  handleTabClick: (_tabId: string) => void;
  handleTabClose: (_tabId: string) => void;
  handleTranslate: (
    _vendor: TranslationVendor,
    _language: string
  ) => Promise<void>;
  handleSaveAs: (_name?: string) => Promise<void>;
  handleFileSelect: (_file: FileSystemNodeProps) => void;
  handleFileReviewRequest: () => void;
  handleInitiateSave: (
    _name: string,
    _content: string,
    _parentId?: string,
    _fileId?: string | null,
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

  const folderPickerContext = useFolderPickerState();

  // Handler functions - simplified with direct dispatch calls
  const handleNewFile = () => {
    docEditorDispatch({ type: "NEW_FILE" });
  };

  const handleTabClick = (tabId: string) => {
    docEditorDispatch({ type: "TAB_CLICK", payload: tabId });
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
        },
      });

      return Promise.resolve();
    } catch (error) {
      console.error("Translation error:", error);
      return Promise.reject(error);
    }
  };

  const handleSaveAs = async (name?: string): Promise<void> => {
    if (!docEditorState.activeTabId) return;

    const activeTab = docEditorState.openTabs.find(
      (tab) => tab.id === docEditorState.activeTabId
    );
    if (!activeTab) return;

    const fileName =
      name || window.prompt("Enter new file name:", activeTab.name);
    if (!fileName) return;

    docEditorDispatch({ type: "START_SAVE" });

    // Show folder picker to select location
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

  const handleFileSelect = (file: FileSystemNodeProps) => {
    docEditorDispatch({ type: "FILE_SELECT", payload: file });
  };

  const handleFileReviewRequest = () => {
    // This will be implemented in the DocumentPane component
    // Logic will open the review modal
  };

  const handleInitiateSave = (
    name: string,
    content: string,
    parentId?: string,
    fileId?: string | null,
    callback?: (_newFile: FileSystemNodeProps) => void
  ) => {
    // Show the folder picker via context
    folderPickerContext.dispatch({
      type: "SHOW_PICKER",
      payload: {
        name,
        content,
        parentId,
        fileId,
        callback,
      },
    });

    docEditorDispatch({
      type: "INITIATE_SAVE",
      payload: {
        name,
        content,
        parentId,
        fileId,
        callback,
      },
    });
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
    handleTabClick,
    handleTabClose,
    handleTranslate,
    handleSaveAs,
    handleFileSelect,
    handleFileReviewRequest,
    handleInitiateSave,
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

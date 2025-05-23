import { useReducer, createContext, useContext, ReactNode } from "react";
import { FileSystemNodeProps } from "@/types/fileSystem";

// Define state type
export interface FileState {
  fileTree: FileSystemNodeProps[];
  selectedFile?: FileSystemNodeProps;
  isLoading: boolean;
  refreshKey: number;
  isNewFileMode: boolean;
}

// Define action types
export type FileAction =
  | { type: "SET_FILE_TREE"; payload: FileSystemNodeProps[] }
  | { type: "SET_SELECTED_FILE"; payload: FileSystemNodeProps | undefined }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "INCREMENT_REFRESH_KEY" }
  | { type: "SET_NEW_FILE_MODE"; payload: boolean };

// Define reducer
function fileReducer(state: FileState, action: FileAction): FileState {
  switch (action.type) {
    case "SET_FILE_TREE":
      return { ...state, fileTree: action.payload };
    case "SET_SELECTED_FILE":
      return { ...state, selectedFile: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "INCREMENT_REFRESH_KEY":
      return { ...state, refreshKey: state.refreshKey + 1 };
    case "SET_NEW_FILE_MODE":
      return { ...state, isNewFileMode: action.payload };
    default:
      return state;
  }
}

// --- Context for sharing state and dispatch ---

type FileContextType = {
  state: FileState;
  dispatch: React.Dispatch<FileAction>;
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(fileReducer, {
    fileTree: [],
    selectedFile: undefined,
    isLoading: true,
    refreshKey: 0,
    isNewFileMode: false,
  });

  return (
    <FileContext.Provider value={{ state, dispatch }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFileContext() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
}

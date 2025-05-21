import { useReducer } from "react";
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

// Custom hook
export function useFileState() {
  const [state, dispatch] = useReducer(fileReducer, {
    fileTree: [],
    selectedFile: undefined,
    isLoading: true,
    refreshKey: 0,
    isNewFileMode: false,
  });

  return { state, dispatch };
}

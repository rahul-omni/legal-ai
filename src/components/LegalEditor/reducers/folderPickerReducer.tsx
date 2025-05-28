import { useReducer } from "react";
import { FileSystemNodeProps } from "@/types/fileSystem";

// Define state type
export interface FolderPickerState {
  show: boolean;
  selectedFolderId: string | null;
  fileData: {
    name: string;
    content: string;
    parentId: string | null;
    fileId: string | null;
    callback?: (newFile: FileSystemNodeProps) => void;
  } | null;
}

// Define action types
export type FolderPickerAction =
  | { type: "SHOW_FOLDER_PICKER"; payload: FolderPickerState["fileData"] }
  | { type: "HIDE_FOLDER_PICKER" }
  | { type: "SET_SELECTED_FOLDER"; payload: string | null };

// Define reducer
function folderPickerReducer(
  state: FolderPickerState,
  action: FolderPickerAction
): FolderPickerState {
  switch (action.type) {
    case "SHOW_FOLDER_PICKER":
      return { ...state, show: true, fileData: action.payload };
    case "HIDE_FOLDER_PICKER":
      return { ...state, show: false, fileData: null };
    case "SET_SELECTED_FOLDER":
      return { ...state, selectedFolderId: action.payload };
    default:
      return state;
  }
}

// Custom hook
export function useFolderPickerState() {
  const [state, dispatch] = useReducer(folderPickerReducer, {
    show: false,
    selectedFolderId: null,
    fileData: null,
  });

  return { state, dispatch };
}

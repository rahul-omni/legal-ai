import { createContext, useContext, useReducer } from "react";
import { FileSystemNodeProps } from "@/types/fileSystem";

// Define state type
export interface FolderPickerState {
  show: boolean;
  selectedFolderId: string | null;
  fileData: {
    name: string;
    content: string;
    parentId?: string;
    fileId?: string | null;
    callback?: (_newFile: FileSystemNodeProps) => void;
  } | null;
}

// Define action types - renamed to match handler functions
type FolderPickerAction =
  | { type: "SHOW_PICKER"; payload: FolderPickerState["fileData"] }
  | { type: "HIDE_PICKER" }
  | { type: "SELECT_FOLDER"; payload: string | null };

// Define reducer
function folderPickerReducer(
  state: FolderPickerState,
  action: FolderPickerAction
): FolderPickerState {
  switch (action.type) {
    case "SHOW_PICKER":
      return { ...state, show: true, fileData: action.payload };
    case "HIDE_PICKER":
      return { ...state, show: false, fileData: null };
    case "SELECT_FOLDER":
      return { ...state, selectedFolderId: action.payload };
    default:
      return state;
  }
}

// Create context with handlers
interface FolderPickerContextType {
  state: FolderPickerState;
  dispatch: React.Dispatch<FolderPickerAction>;
  showPicker: (_fileData: FolderPickerState["fileData"]) => void;
  hidePicker: () => void;
  selectFolder: (_folderId: string | null) => void;
}

const FolderPickerContext = createContext<FolderPickerContextType | undefined>(
  undefined
);

// Provider component
export function FolderPickerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(folderPickerReducer, {
    show: false,
    selectedFolderId: null,
    fileData: null,
  });

  // Handler functions
  const showPicker = (fileData: FolderPickerState["fileData"]) => {
    dispatch({ type: "SHOW_PICKER", payload: fileData });
  };

  const hidePicker = () => {
    dispatch({ type: "HIDE_PICKER" });
  };

  const selectFolder = (folderId: string | null) => {
    dispatch({ type: "SELECT_FOLDER", payload: folderId });
  };

  return (
    <FolderPickerContext.Provider
      value={{
        state,
        dispatch,
        showPicker,
        hidePicker,
        selectFolder,
      }}
    >
      {children}
    </FolderPickerContext.Provider>
  );
}

// Custom hook
export function useFolderPickerState(): FolderPickerContextType {
  const context = useContext(FolderPickerContext);
  if (!context) {
    throw new Error(
      "useFolderPickerState must be used within a FolderPickerProvider"
    );
  }
  return context;
}

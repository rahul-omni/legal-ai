import { fetchNodes } from "@/app/apiServices/nodeServices";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { createContext, ReactNode, useContext, useReducer } from "react";

// Define state type
export interface ExplorerState {
  fileTree: FileSystemNodeProps[];
  selectedFile?: FileSystemNodeProps;
  isLoading: boolean;
  refreshKey: number;
  isNewFileMode: boolean;
}

// Define action types - Renamed to match handler functions
type ExplorerAction =
  | { type: "LOAD_FILES"; payload: FileSystemNodeProps[] }
  | {
      type: "UPDATE_NODE_CHILDREN";
      payload: { children: FileSystemNodeProps[]; parentId: string };
    }
  | {
      type: "UPDATE_NODE_PROPERTY";
      payload: {
        nodeId: string;
        key: keyof FileSystemNodeProps;
        value: boolean | string;
      };
    }
  | { type: "SELECT_FILE"; payload: FileSystemNodeProps | undefined }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "INCREMENT_REFRESH_KEY" }
  | { type: "SET_NEW_FILE_MODE"; payload: boolean };

function explorerReducer(
  state: ExplorerState,
  action: ExplorerAction
): ExplorerState {
  switch (action.type) {
    case "LOAD_FILES":
      return { ...state, fileTree: action.payload };
    case "UPDATE_NODE_CHILDREN": {
      const updatedFileTree = updateNodeChildren(
        state.fileTree,
        action.payload.children,
        action.payload.parentId
      );
      return { ...state, fileTree: updatedFileTree };
    }
    case "UPDATE_NODE_PROPERTY": {
      const updatedFileTree = updateNodeProperty(
        state.fileTree,
        action.payload.nodeId,
        action.payload.key,
        action.payload.value
      );
      return { ...state, fileTree: updatedFileTree };
    }
    case "SELECT_FILE":
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

const updateNodeProperty = (
  nodes: FileSystemNodeProps[],
  nodeId: string,
  key: keyof FileSystemNodeProps,
  value: boolean | string
): FileSystemNodeProps[] => {
  console.log(
    "%c[DEBUG] updateNodeProperty called:",
    "color: teal; font-weight: bold;",
    { nodes, nodeId, key, value }
  );
  return nodes.map((node) => {
    if (node.id === nodeId) {
      console.log(
        "%c[DEBUG] updateNodeProperty - updating node:",
        "color: teal; font-weight: bold;",
        { node, key, value }
      );
      return { ...node, [key]: value };
    }
    if (node.children) {
      console.log(
        "%c[DEBUG] updateNodeProperty - recursing into children of node:",
        "color: teal; font-weight: bold;",
        node
      );
      return {
        ...node,
        children: updateNodeProperty(node.children, nodeId, key, value),
      };
    }
    return node;
  });
};

const updateNodeChildren = (
  nodes: FileSystemNodeProps[],
  children: FileSystemNodeProps[],
  parentId: string
): FileSystemNodeProps[] => {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeChildren(node.children, children, parentId),
      };
    }
    return node;
  });
};

type ExplorerContextType = {
  explorerState: ExplorerState;
  explorerDispatch: React.Dispatch<ExplorerAction>;
  handleLoadFiles: () => Promise<FileSystemNodeProps[]>;
  handleSelectFile: (_file?: FileSystemNodeProps) => void;
  handleRefreshFiles: () => void;
  handleSetNewFileMode: (_isNewMode: boolean) => void;
};

const FileContext = createContext<ExplorerContextType | undefined>(undefined);

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [explorerState, explorerDispatch] = useReducer(explorerReducer, {
    fileTree: [],
    selectedFile: undefined,
    isLoading: true,
    refreshKey: 0,
    isNewFileMode: false,
  });

  // Handler functions that encapsulate dispatch operations
  const handleLoadFiles = async (): Promise<FileSystemNodeProps[]> => {
    explorerDispatch({ type: "SET_LOADING", payload: true });
    try {
      const files = await fetchNodes();
      explorerDispatch({ type: "LOAD_FILES", payload: files });
      return files;
    } catch (error) {
      console.error("Failed to load files:", error);
      return [];
    } finally {
      explorerDispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleSelectFile = (file: FileSystemNodeProps | undefined) => {
    explorerDispatch({ type: "SELECT_FILE", payload: file });
  };

  const handleRefreshFiles = () => {
    explorerDispatch({ type: "INCREMENT_REFRESH_KEY" });
    handleLoadFiles();
  };

  const handleSetNewFileMode = (isNewMode: boolean) => {
    explorerDispatch({ type: "SET_NEW_FILE_MODE", payload: isNewMode });
  };

  return (
    <FileContext.Provider
      value={{
        explorerState,
        explorerDispatch,
        handleLoadFiles,
        handleSelectFile,
        handleRefreshFiles,
        handleSetNewFileMode,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useExplorerContext() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
}

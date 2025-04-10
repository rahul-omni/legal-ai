import { FileSystemNode } from "@/types/fileSystem";

export interface FileHandlingStateProps {
  nodes: FileSystemNode[];
  fileLoading: boolean;
  selectedFile?: FileSystemNode | null;
}

export type ActionType =
  | {
      type: "ADD_FILE" | "UPDATE_FILE";
      payload: FileSystemNode;
    }
  | {
      type: "REMOVE_FILE";
      payload: string;
    };

const initialState: FileHandlingStateProps = {
  nodes: [],
  fileLoading: true,
  selectedFile: null,
};

const reducer = (
  state: FileHandlingStateProps,
  action: ActionType
): FileHandlingStateProps => {
  switch (action.type) {
    case "ADD_FILE":
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
      };
    case "REMOVE_FILE":
      return {
        ...state,
        nodes: state.nodes.filter((file) => file.id !== action.payload),
      };
    case "UPDATE_FILE":
      return {
        ...state,
        nodes: state.nodes.map((file) =>
          file.id === action.payload.id ? action.payload : file
        ),
      };

    default:
      return state;
  }
};

export { initialState, reducer };


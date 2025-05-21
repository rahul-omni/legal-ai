import { createNewFile } from "@/app/apiServices/nodeServices";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { FileType } from "@prisma/client";
import { Dispatch } from "react";
import { FileExplorer } from "./FileExplorer";
import {
  FolderPickerAction,
  FolderPickerState,
} from "../reducers/folderPickerReducer";

interface FolderPickerModalProps {
  foldersOnly: FileSystemNodeProps[];
  refreshKey: number;
  selectedFile?: FileSystemNodeProps;
  folderPickerState: FolderPickerState;
  folderPickerDispatch: Dispatch<FolderPickerAction>;
  refreshFileExplorer: () => void;
}

export function FolderPickerModal({
  foldersOnly,
  refreshKey,
  selectedFile,
  folderPickerState,
  folderPickerDispatch,
  refreshFileExplorer,
}: FolderPickerModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-1/2 max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-medium mb-4">Select Save Location</h3>
        <div className="flex-1 overflow-auto">
          <FileExplorer
            key={`folder-picker-${refreshKey}`}
            onDocumentSelect={(node) => {
              if (node.type === "FOLDER") {
                folderPickerDispatch({
                  type: "SET_SELECTED_FOLDER",
                  payload: node.id,
                });
              } else if (node.type === "FILE" && node.parentId) {
                folderPickerDispatch({
                  type: "SET_SELECTED_FOLDER",
                  payload: node.parentId,
                });
              } else if (node.id === "root") {
                folderPickerDispatch({
                  type: "SET_SELECTED_FOLDER",
                  payload: null,
                });
              }
            }}
            selectedDocument={selectedFile}
            onPdfParsed={() => {}}
            isFolderPickerOpen={true}
          />
        </div>
        <div className="flex justify-between mt-4">
          <button
            onClick={() => {
              if (folderPickerState.fileData?.callback) {
                const newNodePayload = {
                  name: folderPickerState.fileData.name,
                  content: folderPickerState.fileData.content,
                  fileId: folderPickerState.fileData.fileId,
                  parentId: folderPickerState.selectedFolderId ?? null,
                  type: "FILE" as FileType,
                };
                createNewFile(newNodePayload).then((newFile) => {
                  if (
                    folderPickerState.fileData &&
                    folderPickerState.fileData.callback
                  ) {
                    folderPickerState.fileData.callback(newFile);
                    refreshFileExplorer();
                  }
                  folderPickerDispatch({ type: "HIDE_FOLDER_PICKER" });
                });
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Here
          </button>
          <button
            onClick={() => folderPickerDispatch({ type: "HIDE_FOLDER_PICKER" })}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

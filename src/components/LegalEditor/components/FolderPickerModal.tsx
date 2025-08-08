// import { createNewFile } from "@/app/apiServices/nodeServices";
// import { FileType } from "@prisma/client";
// import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
// import { useFolderPicker } from "../reducersContexts/folderPickerReducerContext";
// import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";

// interface NewNodePayload {
//   name: string;
//   content: string;
//   fileId?: string | null;
//   parentId: string | null;
//   type: FileType;
// }

// export function FolderPickerModal() {
//   const { state: folderPickerState, dispatch: folderPickerDispatch } =
//     useFolderPicker();
//   const { explorerDispatch } = useExplorerContext();
//   const { docEditorDispatch } = useDocumentEditor();

//   const handleSave = async () => {
//     if (!folderPickerState.fileData?.callback) return;

//     const newNodePayload: NewNodePayload = {
//       name: folderPickerState.fileData.name,
//       content: folderPickerState.fileData.content,
//       fileId: folderPickerState.fileData.fileId,
//       //parentId: folderPickerState.selectedFolderId ?? null,
//       parentId: folderPickerState.fileData?.parentId ?? folderPickerState.selectedFolderId ?? null,

//       type: "FILE",
//     };
//     console.log("Saving to parentId:", folderPickerState.fileData?.parentId ?? folderPickerState.selectedFolderId);

//     try {
//       const newFile = await createNewFile(newNodePayload);
//       folderPickerState.fileData.callback(newFile);
//       explorerDispatch({ type: "INCREMENT_REFRESH_KEY" });
//       folderPickerDispatch({ type: "HIDE_PICKER" });
//     } catch (error) {
//       console.error("Error saving file:", error);
//     }
//   };

//   const handleCancel = () => {
//     folderPickerDispatch({ type: "HIDE_PICKER" });
//     docEditorDispatch({ type: "CANCEL_SAVE" });
//   };

//   if (!folderPickerState.show) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white p-6 rounded-lg w-1/2 max-h-[80vh] flex flex-col">
//         <h3 className="text-lg font-medium mb-4">Select Save Location</h3>

//         <div className="flex-1 overflow-auto p-2">
//           <FolderPicker />
//         </div>

//         <div className="flex justify-between mt-4">
//           <button
//             onClick={handleSave}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//           >
//             Save Here
//           </button>
//           <button
//             onClick={handleCancel}
//             className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// const FolderPicker = () => {
//   const {
//     explorerState: { fileTree },
//   } = useExplorerContext();
//   const { state: folderPickerState, dispatch: folderPickerDispatch } =
//     useFolderPicker();


    
//   const renderFolder = (node: any, depth = 0) => {
//     if (node.type !== "FOLDER") return null;
//     const isSelected = folderPickerState.selectedFolderId === node.id;

//     const handleSelect = (e: React.MouseEvent) => {
//       e.stopPropagation();
//       folderPickerDispatch({
//         type: "SELECT_FOLDER",
//         payload: node.id,
//       });
//     };

//     return (
//       <div key={node.id} className="relative">
//         <div
//           className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer select-none transition-colors duration-150 ease-in-out ${depth > 0 ? "pl-[28px]" : ""} ${isSelected ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "hover:bg-gray-200/70"}`}
//           style={{ marginLeft: depth * 12 }}
//           onClick={handleSelect}
//         >
//           <span className="text-sm text-gray-700/80 flex items-center gap-2">
//             <svg
//               className="w-4 h-4 text-yellow-500"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18"
//               />
//             </svg>
//             {node.name}
//           </span>
//         </div>
//         {node.children && node.children.length > 0 && (
//           <div className="ml-4">
//             {node.children.map((child: any) => renderFolder(child, depth + 1))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-1">
//       <div
//         className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer select-none transition-colors duration-150 ease-in-out ${folderPickerState.selectedFolderId === null ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "hover:bg-gray-200/70"}`}
//         onClick={() =>
//           folderPickerDispatch({ type: "SELECT_FOLDER", payload: null })
//         }
//       >
//         <span className="text-sm text-gray-700/80 flex items-center gap-2">
//           <svg
//             className="w-4 h-4 text-yellow-500"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               d="M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18"
//             />
//           </svg>
//           Root
//         </span>
//       </div>
//       {fileTree
//         .filter((n: any) => n.type === "FOLDER")
//         .map((node: any) => renderFolder(node))}
//     </div>
//   );
// };


import { useEffect } from "react";
import { createNewFile } from "@/app/apiServices/nodeServices";
import { FileType } from "@prisma/client";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { useFolderPicker } from "../reducersContexts/folderPickerReducerContext";
import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";

interface NewNodePayload {
  name: string;
  content: string;
  fileId?: string | null;
  parentId: string | null;
  type: FileType;
}

export function FolderPickerModal() {
  const { state: folderPickerState, dispatch: folderPickerDispatch } = useFolderPicker();
  const { explorerDispatch } = useExplorerContext();
  const { docEditorDispatch } = useDocumentEditor();

  const handleSave = async () => {
    if (!folderPickerState.fileData?.callback) return;

    const newNodePayload: NewNodePayload = {
      name: folderPickerState.fileData.name,
      content: folderPickerState.fileData.content,
      fileId: folderPickerState.fileData.fileId,
      parentId: folderPickerState.fileData?.parentId ?? folderPickerState.selectedFolderId ?? null,
      type: "FILE",
    };

    try {
      const newFile = await createNewFile(newNodePayload);
      folderPickerState.fileData.callback(newFile);
      explorerDispatch({ type: "INCREMENT_REFRESH_KEY" });
      folderPickerDispatch({ type: "HIDE_PICKER" });
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const handleCancel = () => {
    folderPickerDispatch({ type: "HIDE_PICKER" });
    docEditorDispatch({ type: "CANCEL_SAVE" });
  };

  // ✅ Auto-save if parentId is already provided
  useEffect(() => {
    if (
      folderPickerState.show &&
      folderPickerState.fileData?.callback &&
      folderPickerState.fileData?.parentId
    ) {
      const autoSave = async () => {
        const newNodePayload: NewNodePayload = {
          name: folderPickerState.fileData!.name,
          content: folderPickerState.fileData!.content,
          fileId: folderPickerState.fileData!.fileId,
          parentId: folderPickerState.fileData!.parentId ?? null,
          type: "FILE",
        };

        try {
          const newFile = await createNewFile(newNodePayload);
          if (folderPickerState.fileData?.callback) {
            folderPickerState.fileData.callback(newFile);
          }
          explorerDispatch({ type: "INCREMENT_REFRESH_KEY" });
          folderPickerDispatch({ type: "HIDE_PICKER" });
        } catch (error) {
          console.error("Error saving file:", error);
        }
      };

      autoSave();
    }
  }, [folderPickerState]);

  if (!folderPickerState.show || folderPickerState.fileData?.parentId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-1/2 max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-medium mb-4">Select Save Location</h3>

        <div className="flex-1 overflow-auto p-2">
          <FolderPicker />
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Here
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const FolderPicker = () => {
  const {
    explorerState: { fileTree },
  } = useExplorerContext();
  const { state: folderPickerState, dispatch: folderPickerDispatch } = useFolderPicker();

  const renderFolder = (node: any, depth = 0) => {
    if (node.type !== "FOLDER") return null;
    const isSelected = folderPickerState.selectedFolderId === node.id;

    const handleSelect = (e: React.MouseEvent) => {
      e.stopPropagation();
      folderPickerDispatch({
        type: "SELECT_FOLDER",
        payload: node.id,
      });
    };

    return (
      <div key={node.id} className="relative">
        <div
          className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer select-none transition-colors duration-150 ease-in-out ${depth > 0 ? "pl-[28px]" : ""} ${isSelected ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "hover:bg-gray-200/70"}`}
          style={{ marginLeft: depth * 12 }}
          onClick={handleSelect}
        >
          <span className="text-sm text-gray-700/80 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-yellow-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18"
              />
            </svg>
            {node.name}
          </span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ml-4">
            {node.children.map((child: any) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer select-none transition-colors duration-150 ease-in-out ${folderPickerState.selectedFolderId === null ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "hover:bg-gray-200/70"}`}
        onClick={() => folderPickerDispatch({ type: "SELECT_FOLDER", payload: null })}
      >
        <span className="text-sm text-gray-700/80 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-yellow-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18"
            />
          </svg>
          Root
        </span>
      </div>
      {fileTree
        .filter((n: any) => n.type === "FOLDER")
        .map((node: any) => renderFolder(node))}
    </div>
  );
};

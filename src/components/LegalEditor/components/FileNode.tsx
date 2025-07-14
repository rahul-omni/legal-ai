import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import useAxios from "@/hooks/api/useAxios";
import { Trash2 } from "lucide-react";
import FileIconDisplay from "./FileIconDisplay";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { IconLoader } from "@/components/Loader";
import { MouseEvent } from "react";
import { fetchNodes } from "@/app/apiServices/nodeServices";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { trimName } from "@/helper/utils";

interface FileNodeProps {
  node: FileSystemNodeProps;
  depth: number;
  selectedDocument?: FileSystemNodeProps;
  onDocumentSelect: (_file: FileSystemNodeProps) => void;
}

const FileNode = ({
  node,
  depth,
  selectedDocument,
  onDocumentSelect,
}: FileNodeProps) => {
  const { fetchData, loading: deleteLoading } = useAxios();
  const {
      explorerDispatch,
    } = useExplorerContext();

  const refreshNodes = async (parentId?: string, fileId?: string) => {
    const children = await fetchNodes(parentId);

    if (!parentId) {
      explorerDispatch({ type: "LOAD_FILES", payload: children });
      return;
    }

    if (fileId && children.length >= 0) {
      const file = children.find((node) => node.id === fileId);
      if (file) {
        onDocumentSelect(file);
      }
    }

    explorerDispatch({
      type: "UPDATE_NODE_CHILDREN",
      payload: { children, parentId },
    });
  };

  const handleDelete = async (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    await fetchData(apiRouteConfig.privateRoutes.node(nodeId), "DELETE");
    await refreshNodes(node.parentId);
  };

  return (
    <div
      className={`
      flex items-center px-2 py-1.5 rounded-md cursor-pointer
      ${depth > 0 ? "pl-2" : ""}
      ${
        selectedDocument?.id === node.id
          ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
          : "hover:bg-gray-200/70"
      }
      relative group transition-colors duration-150 ease-in-out
    `}
      onClick={() => onDocumentSelect(node)}
    >
      <div className="flex justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <FileIconDisplay fileName={node.name}/>
          </div>
          <span className="text-sm text-gray-600/80" title={node.name}>{trimName(node.name)}</span>
        </div>

        <div className="flex items-center gap-1 transition-opacity">
          <button
            disabled={deleteLoading}
            className="p-1 rounded-md hover:bg-gray-200/70 cursor-pointer"
            onClick={(e) => handleDelete(e, node.id)}
          >
            {deleteLoading ? (
              <IconLoader />
            ) : (
              <Trash2 className="w-4 h-4 text-gray-500/80 hover:text-black" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileNode;

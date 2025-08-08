import { Trash2 } from "lucide-react";
import FileIconDisplay from "./FileIconDisplay";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { IconLoader } from "@/components/Loader";
import { trimName } from "@/helper/utils";

interface FileNodeProps {
  node: FileSystemNodeProps;
  depth: number;
  selectedDocument?: FileSystemNodeProps;
  onDocumentSelect: (_file: FileSystemNodeProps) => void;
  handleDelete: (e: React.MouseEvent<HTMLButtonElement>, fileId: string) => Promise<void>;
  isDeleting: boolean
}

const FileNode = ({
  node,
  depth,
  selectedDocument,
  onDocumentSelect,
  handleDelete,
  isDeleting,
}: FileNodeProps) => {

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
            disabled={isDeleting}
            className="p-1 rounded-md hover:bg-gray-200/70 cursor-pointer"
            onClick={(e) => {
               e.preventDefault();
               handleDelete(e, node.id);
              }}
          >
            {isDeleting ? (
              <IconLoader />
            ) : (
              <Trash2 className="w-4 h-4 text-error hover:text-error-dark" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileNode;

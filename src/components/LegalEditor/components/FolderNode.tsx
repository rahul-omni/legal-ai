import { FileSystemNodeProps } from "@/types/fileSystem";
import { FilePlus, Folder, FolderOpen, Loader2 } from "lucide-react";
import { JSX } from "react";

interface FolderNodeProps {
  node: FileSystemNodeProps;
  depth: number;
  selectedDocument?: FileSystemNodeProps;
  onToggleExpand: (_node: FileSystemNodeProps) => void;
  onFileUpload: (
    _e: React.ChangeEvent<HTMLInputElement>,
    _parentId?: string
  ) => void;
  renderNode: (_node: FileSystemNodeProps, _depth: number) => JSX.Element;
  loader: boolean
}

const FolderNode = ({
  node,
  depth,
  selectedDocument,
  onToggleExpand,
  onFileUpload,
  renderNode,
  loader,
}: FolderNodeProps) => {
  return (
    <div key={node.id} className="relative">
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{
            left: `${depth * 20}px`,
            opacity: 0.7,
          }}
        />
      )}
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
        onClick={() => onToggleExpand(node)}
      >
        <div className="flex items-center w-full gap-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {node.isExpanded ? (
                <FolderOpen className="w-4 h-4 text-gray-500 shrink-0 fill-current" />
              ) : (
                <Folder className="w-4 h-4 text-gray-500 shrink-0 fill-current" />
              )}
              <span className="text-sm text-gray-700/80">{node.name}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <label
                htmlFor={`file-${node.id}`}
                className="p-1 rounded-md hover:bg-gray-200/70 cursor-pointer"
              >
                <FilePlus className="w-4 h-4 text-gray-500/80 hover:text-black" />
              </label>
              <input
                id={`file-${node.id}`}
                type="file"
                className="hidden"
                accept=".docx,.pdf,.txt, .png, .jpg, .jpeg"
                onChange={async (e) => {
                  e.stopPropagation();
                  await onFileUpload(e, node.id);
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {node.isExpanded &&  (
        <div className="ml-5">
          {loader ? <Loader2 className="w-4 h-4 animate-spin" /> : (Array.isArray(node.children) && node.children.length > 0 ? (
            node.children.map((child) => renderNode(child, depth + 1))
          ) : (
            <div className="text-xs text-gray-400 italic ml-6 mt-1">
              Empty folder
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderNode;

import FileIconDisplay from "./FileIconDisplay";
import { FileSystemNodeProps } from "@/types/fileSystem";

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
}: FileNodeProps) => (
  <div
    className={`
      flex items-center px-2 py-1.5 rounded-md cursor-pointer
      ${depth > 0 ? "pl-[28px]" : ""}
      ${
        selectedDocument?.id === node.id
          ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
          : "hover:bg-gray-200/70"
      }
      relative group transition-colors duration-150 ease-in-out
    `}
    onClick={() => onDocumentSelect(node)}
  >
    <div className="flex items-center gap-2 w-full">
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        <FileIconDisplay fileName={node.name} />
      </div>
      <span className="text-sm text-gray-600/80">{node.name}</span>
    </div>
  </div>
);

export default FileNode;

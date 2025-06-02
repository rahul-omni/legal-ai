"use client";
import {
  createNode,
  CreateNodePayload,
  fetchNodes,
} from "@/app/apiServices/nodeServices";
import { Spinner } from "@/components/Loader";
import { handleApiError } from "@/helper/handleApiError";
import { FileService } from "@/lib/fileService";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { extractPdfToHtml } from "@/utils/pdfUtils";
import { useParams } from "next/navigation";
import { FC, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileExplorerHeader } from "./FileHeader";
import FileNode from "./FileNode";
import FolderNode from "./FolderNode";

interface FileExplorerProps {
  selectedDocument?: FileSystemNodeProps;
  onDocumentSelect: (_file: FileSystemNodeProps) => void;
  isFolderPickerOpen?: boolean;
}

export const FileExplorer: FC<FileExplorerProps> = ({
  selectedDocument,
  onDocumentSelect,
  isFolderPickerOpen = false,
}) => {
  const params = useParams();
  const [nodes, setNodes] = useState<FileSystemNodeProps[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRootNodes();
  }, []);

  const handleParams = (nodes: FileSystemNodeProps[]) => {
    const { filePath } = params;
    if (!filePath) return;
    if (filePath.length === 1) {
      const file = nodes.find((node) => node.id === filePath[0]);
      if (file) {
        onDocumentSelect(file);
      }
      return;
    }
    if (filePath.length === 2) {
      const folder = nodes.find((node) => node.id === filePath[0]);
      if (folder) {
        toggleExpand(folder, filePath[1]);
      }
    }
  };

  const fetchRootNodes = async () => {
    try {
      const node = await fetchNodes();
      setNodes(() => node);
      handleParams(node);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (node: FileSystemNodeProps, fileId?: string) => {
    if (node.type !== "FOLDER") return;

    setNodes((prevNodes) =>
      updateNodeProperty(prevNodes, node.id, "isExpanded", !node.isExpanded)
    );

    if (!node.isExpanded && (!node.children || node.children.length === 0)) {
      await refreshNodes(node.id, fileId);
    }
  };

  const updateNodeProperty = (
    nodes: FileSystemNodeProps[],
    nodeId: string,
    key: keyof FileSystemNodeProps,
    value: boolean | string
  ): FileSystemNodeProps[] => {
    return nodes.map((node) => {
      if (node.id === nodeId) return { ...node, [key]: value };
      if (node.children) {
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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    parentId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content: string;

      console.log(
        "%c[DEBUG] File type detected:",
        "color: blue; font-weight: bold;",
        file.type
      );
      if (file.type === "application/pdf") {
        console.log(
          "%c[DEBUG] Parsing PDF file...",
          "color: green; font-weight: bold;"
        );
        content = await extractPdfToHtml(file);
        console.log(
          "%c[DEBUG] PDF parsed successfully",
          "color: green; font-weight: bold;"
        );
        toast.success("PDF Parsed Successfully");
      } else {
        console.log(
          "%c[DEBUG] Parsing non-PDF file...",
          "color: orange; font-weight: bold;"
        );
        content = await FileService.parseFile(file);
      }

      const newFile: CreateNodePayload = {
        name: file.name,
        type: "FILE",
        parentId,
        content,
      };

      await createNode(newFile);
      await refreshNodes(parentId);
    } catch (error) {
      handleApiError(error);
    }
  };

  const refreshNodes = async (parentId?: string, fileId?: string) => {
    const children = await fetchNodes(parentId);
    if (!parentId) {
      setNodes(children);
      return;
    }

    if (fileId && children.length >= 0) {
      const file = children.find((node) => node.id === fileId);
      if (file) {
        onDocumentSelect(file);
      }
    }

    setNodes((prevNodes) => updateNodeChildren(prevNodes, children, parentId));
  };

  const handleCreateFolder = async (e: React.MouseEvent) => {
    e.preventDefault();
    const folderName = prompt("Enter folder name:", "New Folder");
    if (!folderName) return;

    try {
      const folder: CreateNodePayload = {
        name: folderName,
        type: "FOLDER",
      };

      await createNode(folder);
      await refreshNodes();
    } catch (error) {
      handleApiError(error);
    }
  };

  const renderNode = (node: FileSystemNodeProps, depth = 0) => {
    if (node.type === "FOLDER") {
      return (
        <FolderNode
          key={node.id}
          node={node}
          depth={depth}
          selectedDocument={selectedDocument}
          onToggleExpand={toggleExpand}
          onFileUpload={handleFileUpload}
          isFolderPickerOpen={isFolderPickerOpen}
          renderNode={renderNode}
        />
      );
    }
    return (
      <FileNode
        key={node.id}
        node={node}
        depth={depth}
        selectedDocument={selectedDocument}
        onDocumentSelect={onDocumentSelect}
      />
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#f9f9f9]">
      <FileExplorerHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFolderPickerOpen={isFolderPickerOpen}
        fileInputRef={fileInputRef}
        handleCreateFolder={handleCreateFolder}
        handleFileUpload={handleFileUpload}
      />

      <div className="flex-1 overflow-y-auto p-2 bg-[#f9f9f9]">
        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-0.5">
            {Array.isArray(nodes) && nodes.length > 0 ? (
              nodes.map((node) => renderNode(node))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No files found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

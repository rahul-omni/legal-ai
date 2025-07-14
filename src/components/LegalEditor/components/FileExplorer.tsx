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
import { extractTextFromPDF, fileToBase64 } from "@/utils/pdfUtils";
import { isArray } from "lodash";
import { useParams } from "next/navigation";
import { FC, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { FileExplorerHeader } from "./FileHeader";
import FileNode from "./FileNode";
import FolderNode from "./FolderNode";
import { GlobalWorkerOptions, version } from 'pdfjs-dist/build/pdf';

GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;

interface FileExplorerProps {
  selectedDocument?: FileSystemNodeProps;
  onDocumentSelect: (_file: FileSystemNodeProps) => void;
}

export const FileExplorer: FC<FileExplorerProps> = ({
  selectedDocument,
  onDocumentSelect,
}) => {
  const params = useParams();
  const {
    explorerState: { fileTree },
    explorerDispatch,
  } = useExplorerContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedNode, setExpandedNode] = useState<string>("");

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
      explorerDispatch({ type: "LOAD_FILES", payload: node });
      handleParams(node);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (node: FileSystemNodeProps, fileId?: string) => {
    setExpandedNode(node.id);
    if (node.type !== "FOLDER") {
      return;
    }

    explorerDispatch({
      type: "UPDATE_NODE_PROPERTY",
      payload: {
        nodeId: node.id,
        key: "isExpanded",
        value: !node.isExpanded,
      },
    });

    const shouldFetchChildren =
      !node.isExpanded && (!node.children || node.children.length === 0);
    if (shouldFetchChildren) {
      await refreshNodes(node.id, fileId);
    }
    setExpandedNode("");
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    parentId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content: string;

      if (file.type === "application/pdf") {
        const { html } = await extractTextFromPDF(file);
        content = html;
        toast.success("PDF Parsed Successfully");
      }else if (["image/png", "image/jpg", "image/jpeg"].includes(file.type)) {
        const base64 = await fileToBase64(file); // 👈 Convert image to base64
        
        const res = await fetch("/api/parse-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base64Image: base64,
            mimeType: file.type,
            targetLanguage: "English", // Optional, default handled by server
          }),
        });

        const { html } = await res.json();
        content = html;
        toast.success("Image Parsed Successfully");
      } else {
        content = await FileService.parseFile(file);
      }

      const updatedFileName = file.name.replace(/\.[^/.]+$/, "") + ".docx";

      const newFile: CreateNodePayload = {
        name: updatedFileName,
        type: "FILE",
        parentId,
        content,
      };

      const newnode = await createNode(newFile);
      await refreshNodes(parentId);
      onDocumentSelect(newnode)
    } catch (error) {
      handleApiError(error);
    }
  };

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
          renderNode={renderNode}
          loader={expandedNode == node.id ? true : false}
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
        fileInputRef={fileInputRef}
        handleCreateFolder={handleCreateFolder}
        handleFileUpload={handleFileUpload}
      />

      <div className="flex-1 overflow-y-auto p-2 bg-[#f9f9f9]">
        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-0.5">
            {isArray(fileTree) ? (
              fileTree.map((node) => renderNode(node))
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

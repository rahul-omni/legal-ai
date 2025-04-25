"use client";
import {
  createNode,
  CreateNodePayload,
  fetchNodes,
} from "@/app/apiServices/nodeServices";
import { handleApiError } from "@/helper/handleApiError";
import { FileService } from "@/lib/fileService";
import { FileSystemNodeProps } from "@/types/fileSystem";
import {
  File,
  FileIcon,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Search,
  Upload,
} from "lucide-react";
 
import { useParams } from "next/navigation";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { FC, useEffect, useRef, useState } from "react";
import { useToast } from "./ui/toast";

interface FileExplorerProps {
  selectedDocument?: FileSystemNodeProps;
  onDocumentSelect: (file: FileSystemNodeProps) => void;
  onPdfParsed: (text: string) => void;
  onNodeSelect: (node: FileSystemNodeProps | null) => void; 
  
 // files: FileSystemNodeProps[]; 
}

export const FileExplorerV2: FC<FileExplorerProps> = ({
  selectedDocument,
  onDocumentSelect,
  onPdfParsed,
  onNodeSelect
 // files
}) => {
  const params = useParams();
  const [nodes, setNodes] = useState<FileSystemNodeProps[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

  useEffect(() => {
    fetchRootNodes();
  }, []);

  const handleNodeClick = (node: FileSystemNodeProps) => {
    onNodeSelect(node); // <-- Add this
    if (node.type === "FILE") {
      onDocumentSelect(node);
    } else {
      toggleExpand(node);
    }
  };

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
      handleApiError(error, showToast);
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
    value: any
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
     
  const checkDuplicateInTree = (
    nodes: FileSystemNodeProps[],
    name: string,
    type: string
  ): boolean => {
    for (const node of nodes) {
      if (node.name === name && node.type === type) return true;
      if (node.children && checkDuplicateInTree(node.children, name, type)) {
        return true;
      }
    }
    return false;
  };
  
  const handleAddDocument = (newDoc: FileSystemNodeProps, parentId: string | null) => {
    // Check the entire tree for a duplicate before adding
    if (checkDuplicateInTree(nodes, newDoc.name, newDoc.type)) {
      console.log("Duplicate found, showing alert and skipping addition.");
      alert(`A document named "${newDoc.name}" already exists somewhere in your tree.`);
      return; // Exit early – don't add duplicate
    }
    console.log("Not duplicate, proceeding to add.");
    const addRecursively = (nodes: FileSystemNodeProps[]): FileSystemNodeProps[] => {
      return nodes.map((node) => {
        if (node.id === parentId && node.type === "FOLDER") {
          const children = node.children || [];
          return {
            ...node,
            children: [...children, newDoc],
          };
        }
        if (node.type === "FOLDER" && node.children?.length) {
          return {
            ...node,
            children: addRecursively(node.children),
          };
        }
        return node;
      });
    };
  
    // Add at root level if no parent
    if (!parentId) {
      setNodes([...nodes, newDoc]);
    } else {
      setNodes(addRecursively(nodes));
    }
  };
  
   
// Then use debugSetNodes everywhere instead of setNodes temporarily


const handleFileUploadnew = async (
  event: React.ChangeEvent<HTMLInputElement>,
  parentId: string | null = null
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target?.result as string;

    const newFile: CreateNodePayload = {
      name: file.name,
      type: "FILE",
       
      parentId,
      content,
    };

    try {
      const uploadedNode = await createNode(newFile);
     // if (uploadedNode) {
        setNodes((prev) => [...prev, uploadedNode]);
     // }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(error.response?.data?.message || "Upload failed");
    }
  };

  reader.readAsText(file);
};

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(" ");
        fullText += `\n\nPage ${i}:\n${text}`;
      }

      return fullText;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw error;
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    parentId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      const content = await FileService.parseFile(file);
  
      const newFile: CreateNodePayload = {
        name: file.name,
        type: "FILE",
         
        parentId,
        content,
      };
  
      //await createNode(newFile);
       

      // Upload the file to the backend and get the real node object
      const uploadedNode = await createNode(newFile);
      const now = new Date();
  
      const localNode: FileSystemNodeProps = {
        id: uploadedNode?.id || Date.now().toString(),
        name: newFile.name,
        type: "FILE",
        userId:  "",
        children: [],
        createdAt: now,
        updatedAt: now,
      };
  
      handleAddDocument(localNode, parentId ?? null);
  
      await refreshNodes(parentId);
    } catch (error) {
      handleApiError(error, showToast);
    } 
  };
  
  const handleFileUploado = async (
    e: React.ChangeEvent<HTMLInputElement>,
    parentId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content: string;

      if (file.type === "application/pdf") {
        content = await extractTextFromPDF(file);
        onPdfParsed(content);
        showToast("PDF Parsed Successfully");
      } else {
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
      handleApiError(error, showToast);
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
      handleApiError(error, showToast);
    }
  };

  const renderNode = (node: FileSystemNodeProps, depth = 0) => (
    <div key={node.id} onClick={() => handleNodeClick(node)} className="relative">
      {/* Guide Lines */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l border-gray-400"
          style={{
            left: `${depth * 20}px`,
            opacity: 0.7,
          }}
        />
      )}

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
        onClick={() =>
          node.type === "FOLDER" ? toggleExpand(node) : onDocumentSelect(node)
        }
      >
        <div className="flex items-center w-full gap-2">
          {/* Folder/File Icon */}
          {node.type === "FOLDER" ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {node.isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-gray-500 shrink-0 fill-current" />
                ) : (
                  <Folder className="w-4 h-4 text-gray-500 shrink-0 fill-current" />
                )}
                <span className="text-sm text-gray-700/80">{node.name}</span>
              </div>

              {/* Folder Actions */}
              <div
                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 
                            transition-opacity"
              >
                <label
                  htmlFor={`file-${node.id}`}
                  className="p-1 rounded-md hover:bg-gray-200/70 cursor-pointer"
                >
                  <FilePlus className="w-4 h-4 text-gray-500/80" />
                </label>
                <input
                  id={`file-${node.id}`}
                  type="file"
                  className="hidden"
                  accept=".docx,.pdf,.txt"
                  onChange={async (e) => {
                    e.stopPropagation();
                    await handleFileUpload(e, node.id);
                    await refreshNodes(node.id);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              {/* File Icon based on extension */}
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {getFileIcon(node.name)}
              </div>
              <span className="text-sm text-gray-600/80">{node.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {node.isExpanded && node.children !== undefined && (
        <div className="ml-5">
          {node.children.length > 0 ? (
            node.children.map((child) => renderNode(child, depth + 1))
          ) : (
            <div className="text-xs text-gray-400 italic ml-6 mt-1">
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Add this helper function to get appropriate file icons
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return (
          <div className="flex items-center justify-center text-[10px] font-medium bg-gray-100 text-gray-600/80 rounded w-5 h-5">
            PDF
          </div>
        );
      case "docx":
      case "doc":
        return <FileText className="w-4 h-4 text-blue-500/80" />;
      case "txt":
        return <File className="w-4 h-4 text-gray-500/80" />;
      default:
        return <FileIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f9f9f9]">
      {/* Header */}
      <div className="p-4 bg-[#f9f9f9] sticky top-0 z-10">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                     placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Files Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500/80">
            FILES
          </h2>
          <div className="flex items-center gap-1">
            {/* Upload File Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              title="Upload File"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* New Folder Button */}
            <button
              onClick={handleCreateFolder}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>

            {/* Keep the hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept=".txt,.doc,.docx,.pdf"
            />
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 bg-[#f9f9f9]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="animate-spin mr-2">⏳</div> Loading...
          </div>
        ) : (
          <div className="space-y-0.5">
            {nodes.map((node) => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  );
};

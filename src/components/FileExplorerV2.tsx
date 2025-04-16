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
  FileIcon,
  FilePlus,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  Search,
} from "lucide-react";
import { FC, SetStateAction, useEffect, useState } from "react";
import { useToast } from "./ui/toast";

interface FileExplorerProps {
  userId: string;
  selectedDocument?: FileSystemNodeProps;
  onDocumentSelect: (file: FileSystemNodeProps) => void;
}

export const FileExplorerV2: FC<FileExplorerProps> = ({
  userId,
  selectedDocument,
  onDocumentSelect,
   
}) => {
  const [nodes, setNodes] = useState<FileSystemNodeProps[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Fetch root nodes on mount
  useEffect(() => {
    const fetchRootNodes = async () => {
      try {
        const node = await fetchNodes(userId);
        setNodes(node);
      } catch (error) {
        handleApiError(error, showToast);
      } finally {
        setLoading(false);
      }
    };
    fetchRootNodes();
  }, [userId]);

  // Toggle folder expand/collapse
  const toggleExpand = async (node: FileSystemNodeProps) => {
    if (node.type !== "FOLDER") return;

    // Optimistic UI update
    setNodes((prevNodes) =>
      updateNodeProperty(prevNodes, node.id, "isExpanded", !node.isExpanded)
    );

    // Fetch children if expanding for the first time
    if (!node.isExpanded && (!node.children || node.children.length === 0)) {
      await refreshNodes(node.id);
    }
  };
  console.log("nodes",nodes);
  
  // Helper: Update node properties immutably
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

  // Helper functions to update state immutably
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


const handleFileUpload = async (
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
      userId,
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

  const handleFileUploadold = async (
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
        userId: "1",
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
        userId: newFile.userId,
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
      const content = await FileService.parseFile(file);

      const newFile: CreateNodePayload = {
        name: file.name,
        type: "FILE",
        userId: "1",
        parentId,
        content,
      };

      await createNode(newFile);
      await refreshNodes(parentId);
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const refreshNodes = async (parentId?: string) => {
    const children = await fetchNodes(userId, parentId);
    if (!parentId) {
      setNodes(children);
      return;
    }
    setNodes((prevNodes) => updateNodeChildren(prevNodes, children, parentId));
  };

  const handleCreateFolder = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default action
    const folderName = prompt("Enter folder name:", "New Folder");
    if (!folderName) return;

    try {
      const folder: CreateNodePayload = {
        name: folderName,
        type: "FOLDER",
        userId: "1",
      };

      await createNode(folder);
      await refreshNodes();
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const renderNode = (node: FileSystemNodeProps) => (
    <div key={node.id} className="pl-2">
      <div
        className={`
          flex items-center gap-2 p-1 rounded-md cursor-pointer
          ${
            selectedDocument?.id === node.id
              ? "bg-primary/10 text-primary"
              : "hover:bg-gray-100"
          }
        `}
        onClick={() =>
          node.type === "FOLDER" ? toggleExpand(node) : onDocumentSelect(node)
        }
      >
        <div className="flex items-center w-full px-2">
          {node.type === "FOLDER" ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                {node.isExpanded ? (
                  <FolderOpenIcon className="w-4 h-4 mr-2 text-yellow-500" />
                ) : (
                  <FolderIcon className="w-4 h-4 mr-2 text-yellow-500" />
                )}
                <span className="text-sm">{node.name}</span>
              </div>

              <div className="">
                <label htmlFor={`file-${node.id}`} className="cursor-pointer">
                  <FilePlus className="w-4 h-4 text-blue-500" />
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
            <>
              <FileIcon className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm">{node.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Only render if expanded AND children exists (not undefined) */}
      {node.isExpanded && node.children !== undefined && (
        <div>
          {node.children.length > 0 ? (
            node.children.map(renderNode)
          ) : (
            <div className="text-xs text-gray-500 italic pl-4">
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col border-r border-border">
        {/* Header with search and actions */}

        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files..."
                className="w-full pl-8 pr-4 py-1 text-sm rounded-md border focus:border-primary focus:ring-1 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <label
              htmlFor="file-upload"
              className="p-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FilePlus className="h-4 w-4" />
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".docx,.pdf,.txt"
              onChange={handleFileUpload}
            />
            <button
              className="p-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              onClick={(e) => handleCreateFolder(e)}
            >
              <FolderPlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-64 h-[calc(100vh-76px)] border-r border-gray-200 overflow-y-auto">
        <div className="p-3 font-medium bg-gray-50">File Explorer</div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading...</div>
        ) : (
          <div className="py-1">{nodes.map((node) => renderNode(node))}</div>
        )}
      </div>
    </>
  );
};

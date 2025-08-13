"use client";
import { uploadFile, fetchNodes } from "@/app/apiServices/nodeServices";
import { Spinner } from "@/components/Loader";
import { handleApiError } from "@/helper/handleApiError";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { isArray } from "lodash";
import { useParams, useRouter } from "next/navigation";
import { FC, useEffect, useRef, useState } from "react";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import { FileExplorerHeader } from "./FileHeader";
import FileNode from "./FileNode";
import { GlobalWorkerOptions, version } from 'pdfjs-dist/build/pdf';
import useAxios from "@/hooks/api/useAxios";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";

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
  const [fileLoader, setFileLoader] = useState(false);
  const [deletingFile, setDeletingFile] = useState("");
  const router = useRouter()

  const fileInputRef = useRef<HTMLInputElement>(null);
  const parentId = params.id as string;
  const fileIdParam = params.fileId as string;
  const { fetchData } = useAxios();

  useEffect(() => {
    fetchRootNodes();
  }, []);

  const fetchRootNodes = async () => {
    try {
      if (parentId == "root" && params.fileId?.length){
        const node = await fetchNodes(parentId, fileIdParam);
        explorerDispatch({ type: "LOAD_FILES", payload: node });
        if (node.length){
          onDocumentSelect(node[0]);
        }
      }else if (parentId){
        const node = await fetchNodes(parentId);
        explorerDispatch({ type: "LOAD_FILES", payload: node });
        if (params.fileId?.length){
          const newFiles = await fetchNodes(parentId, fileIdParam);
          if (newFiles.length){
            onDocumentSelect(newFiles[0]);
          }
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoader(true);
    await uploadFile(e, parentId)
    setFileLoader(false);
    await fetchRootNodes();
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>, fileId: string) => {
    setDeletingFile(fileId);
    e.stopPropagation();
    await fetchData(apiRouteConfig.privateRoutes.node(fileId), "DELETE");
    if (fileIdParam){
      router.push(`/projects`);
    }else{
      await fetchRootNodes();
      setDeletingFile("");
    }
  };

  const renderNode = (node: FileSystemNodeProps, depth = 0) => {
    return (
      <FileNode
        key={node.id}
        node={node}
        depth={depth}
        selectedDocument={selectedDocument}
        onDocumentSelect={onDocumentSelect}
        handleDelete={handleDelete}
        isDeleting={deletingFile==node.id}
      />
    );
  };

  return (
    <div className="h-full flex flex-col bg-background-dark">
      <FileExplorerHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        fileLoader={fileLoader}
      />

      <div className="flex-1 overflow-y-auto p-2 bg-background-dark">
        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-2">
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

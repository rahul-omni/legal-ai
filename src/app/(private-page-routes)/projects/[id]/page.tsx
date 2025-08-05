"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { createNode, fetchNodes, uploadFile } from "@/app/apiServices/nodeServices";
import moment from "moment";
import { getDocument } from "pdfjs-dist";
import { extractTextFromPDF, fileToBase64 } from "@/utils/pdfUtils";
import { FileService } from "@/lib/fileService";
import toast from "react-hot-toast";
import { handleApiError } from "@/helper/handleApiError";
import FileIconDisplay from "@/components/LegalEditor/components/FileIconDisplay";
import useAxios from "@/hooks/api/useAxios";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import Header from "@/components/ui/Header";
import { FileExplorer } from "@/components/ui/FileExplorer";
import { FileSystemNodeProps } from "@/types/fileSystem";

interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  type: "FILE" | "FOLDER";
}

const ITEMS_PER_PAGE = 10;

const ProjectFolderTable: React.FC = () => {
  const params = useParams();
  const parentId = params?.id as string;
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { fetchData } = useAxios();
  const [deletingNode, setIsDeletingNode] = useState("113")

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetchNodes(parentId);
      setProjects(response);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (parentId) {
      loadProjects();
    }
  }, [parentId]);

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isRoot: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    await uploadFile(e, parentId);
    await loadProjects()
    setIsUploading(false);
    if (e.target) e.target.value = "";
  };

  const handleDelete = async (e: any, nodeId: string) => {
    setIsDeletingNode(nodeId)
    e.stopPropagation();
    await fetchData(apiRouteConfig.privateRoutes.node(nodeId), "DELETE");
    loadProjects()
    setIsDeletingNode("")
  };

  const onItemClick = (item: FileSystemNodeProps) => {
    router.push(`/projects/${parentId}/edit`)
  }

  return (
    <div className="w-full overflow-auto">
      <div className="px-6 py-4 flex items-start justify-between border-b">
        <Header headerTitle="Project Hub" subTitle="Manage your legal projects" />
        <div className="flex items-start gap-2">
          <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="bg-primary text-white min-w-32 px-4 py-3 rounded-md flex items-center gap-2 text-sm hover:bg-primary-dark">
            <Upload className="w-4 h-4" />
            {isUploading ? <Loader2 className="w-full h-4 animate-spin " /> : "Upload Files"}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, false)} />
        </div>
      
      </div>


      {/* <div className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, false)} />
        </div>
        <div className="mr-5">
          <button
            onClick={() => router.push(`/projects/${parentId}/edit`)}
            className="text-sm px-3 py-1 bg-info-light text-info hover:bg-info rounded mr-2"
          >
            Open Project
          </button>
        </div>
      </div> */}
      
      <div className="flex-1 p-6">
      <FileExplorer
          items={paginatedProjects}
          onItemClick={onItemClick}
          actions={[
            {
              label: 'Delete',
              onClick: (item: FileSystemNodeProps, e: React.MouseEvent) => handleDelete(e, item.id),
              variant: 'destructive',
            }
          ]}
          loading={loading}
          loadingItems={[deletingNode]}
          emptyMessage="No Projects Found"
        />
        </div>

     
    </div>
  );
};

export default ProjectFolderTable;

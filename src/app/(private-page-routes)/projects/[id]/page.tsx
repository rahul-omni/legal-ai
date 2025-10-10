"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { fetchNodes, uploadFile } from "@/app/apiServices/nodeServices";
import useAxios from "@/hooks/api/useAxios";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import Header from "@/components/ui/Header";
import { FileExplorer } from "@/components/ui/FileExplorer";
import { FileSystemNodeProps } from "@/types/fileSystem";
import Button from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useConfirmation } from "@/hooks/useConfirmation";
import { Spinner } from "@/components/Loader";

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
  const [projectName, setProjectName] = useState<string>("Project Hub");
  const [loading, setLoading] = useState(true);
  const [loadingProjectHeader, setLoadingProjectHeader] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { fetchData } = useAxios();
  const [deletingNode, setIsDeletingNode] = useState("");
  const { confirmationState, confirm, handleConfirm, handleClose } = useConfirmation();

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

  
  const getProjectName = async () => {
    try {
      setLoadingProjectHeader(true);
      const response = await fetchNodes('', parentId);
      setProjectName(response[0].name)
    } catch (error) {
      console.error("Failed to fetch project name:", error);
    } finally {
      setLoadingProjectHeader(false);
    }
  }

  // const getProjectName = async () => {
  //   const response = await fetchData(apiRouteConfig.privateRoutes.node(parentId), "GET");
  //   return response.name;
  // }
  useEffect(() => {
    if (parentId) {
      loadProjects();
      getProjectName();
    }  
  }, [parentId]);

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
    e.stopPropagation();
    
    // Find the item to get its name for the confirmation
    const itemToDelete = projects.find(project => project.id === nodeId);
    const itemName = itemToDelete?.name || 'this item';
    
    confirm(
      {
        title: 'Delete File',
        message: `Are you sure you want to delete? This action cannot be undone and will permanently remove the project and all its contents.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
      },
      async () => {
        setIsDeletingNode(nodeId);
        await fetchData(apiRouteConfig.privateRoutes.node(nodeId), "DELETE");
        loadProjects();
        setIsDeletingNode("");
      }
    );
  };

  const onItemClick = (item: FileSystemNodeProps) => {
    router.push(`/projects/${parentId}/edit/${item.id}`)
  }

  return (
    <>
    {loadingProjectHeader ? (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    ) : (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="px-6 pt-6 flex items-start justify-between md:flex-row space-y-2 flex-col">
        <Header headerTitle={projectName} subTitle="Manage your legal project" />
        <div className="flex items-start gap-2">
          <Button disabled={isUploading} onClick={() => fileInputRef.current?.click()} icon={<Upload className="w-4 h-4" />} loading={isUploading}>
            Upload Files
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, false)} />
        </div>
      
      </div>

      
      <div className="flex-1 p-6 overflow-auto min-h-0">
      <FileExplorer
          items={paginatedProjects}
          onItemClick={onItemClick}
          actions={[
            {
              label: 'Delete',
              onClick: (item: FileSystemNodeProps, e: React.MouseEvent) => handleDelete(e, item.id),
              variant: 'secondary',
            }
          ]}
          loading={loading}
          loadingItems={[deletingNode]}
          emptyMessage="No Projects Found"
          className="text-sm"
        />
        </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        icon={confirmationState.icon}
        isLoading={confirmationState.isLoading}
      />
    </div>
    )}
    </>
  );
};

export default ProjectFolderTable;

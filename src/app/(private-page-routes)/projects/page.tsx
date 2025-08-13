"use client";

import React, { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus, Upload, Loader2, Search,
  Folder
} from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { getDocument } from "pdfjs-dist";
import Link from "next/link"

import { fetchNodes, createNode, CreateNodePayload, uploadFile } from "@/app/apiServices/nodeServices";
import { useUserContext } from "@/context/userContext";
import { handleApiError } from "@/helper/handleApiError";
import { FileSystemNodeProps } from "@/types/fileSystem";
import FileIconDisplay from "@/components/LegalEditor/components/FileIconDisplay";
import useAxios from "@/hooks/api/useAxios";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { FileExplorer } from "@/components/ui/FileExplorer";
import Header from "@/components/ui/Header";
import Button from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useConfirmation } from "@/hooks/useConfirmation";

interface ProjectHubProps {
  projects: FileSystemNodeProps[];
  selectedProject?: FileSystemNodeProps;
  loading: boolean;
  createLoading: boolean;
  searchQuery: string;
  isNewProjectModalOpen: boolean;
  currentPage: number;
  rowsPerPage: number;
}

const reducer = (state: ProjectHubProps, action: any): ProjectHubProps => {
  switch (action.type) {
    case "SET_PROJECTS": return { ...state, projects: action.payload };
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_CREATE_LOADING": return { ...state, createLoading: action.payload };
    case "SET_SEARCH_QUERY": return { ...state, searchQuery: action.payload };
    case "SET_SELECTED_FOLDER": return { ...state, selectedProject: action.payload };
    case "SET_IS_NEW_PROJECT_MODAL_OPEN": return { ...state, isNewProjectModalOpen: action.payload };
    case "SET_PAGE": return { ...state, currentPage: action.payload };
    default: return state;
  }
};

const ProjectHub = () => {
  const { userState } = useUserContext();
  const router = useRouter();
  const { fetchData } = useAxios();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingNode, setIsDeletingNode] = useState("")

  const [folderName, setFolderName] = useState("");
  const { confirmationState, confirm, handleConfirm, handleClose } = useConfirmation();

  const handleCreateProject = async () => {
    if (!folderName.trim()) return toast.error("Folder name is required");
    dispatch({ type: "SET_CREATE_LOADING", payload: true });

    try {
      await createNode({
        name: folderName,
        type: "FOLDER",
        content: "",
      });
      toast.success("Folder created successfully");
      await loadProjects();
      dispatch({ type: "SET_IS_NEW_PROJECT_MODAL_OPEN", payload: false });
      setFolderName("");
    } catch (err) {
      handleApiError(err);
    } finally {
      dispatch({ type: "SET_CREATE_LOADING", payload: false });
    }
  };

  const [state, dispatch] = useReducer(reducer, {
    projects: [],
    selectedProject: undefined,
    loading: true,
    createLoading: false,
    searchQuery: "",
    isNewProjectModalOpen: false,
    currentPage: 1,
    rowsPerPage: 10,
  });

  const loadProjects = async (parentId?: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await fetchNodes(parentId);
      dispatch({ type: "SET_PROJECTS", payload: response });
    } catch (error) {
      handleApiError(error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isRoot: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    await uploadFile(e)
    await loadProjects(isRoot ? undefined : state.selectedProject?.id);
    setIsUploading(false);
    if (e.target) e.target.value = "";
  };

  const paginatedProjects = state.projects.slice(
    (state.currentPage - 1) * state.rowsPerPage,
    state.currentPage * state.rowsPerPage
  );

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (e: any, nodeId: string) => {
    e.stopPropagation();
    
    // Find the item to get its name for the confirmation
    const itemToDelete = state.projects.find(project => project.id === nodeId);
    const itemName = itemToDelete?.name || 'this item';
    
    confirm(
      {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone and will permanently remove the project and all its contents.`,
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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-6 flex items-start justify-between">
        <Header headerTitle="Project Hub" subTitle="Manage your legal projects" />
        <div className="flex items-start gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, false)} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} icon={<Upload className="w-4 h-4" />} loading={isUploading} variant="secondary">
            {isUploading ? <Loader2 className="w-full h-4 animate-spin " /> : "Upload Files"}
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, true)} accept=".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg" />

          <Button onClick={() => dispatch({ type: "SET_IS_NEW_PROJECT_MODAL_OPEN", payload: true })} icon={<FolderPlus className="w-4 h-4" />} loading={state.createLoading}>
            New Project
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
          <input type="text" value={state.searchQuery} onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })} placeholder="Search projects..." className="pl-10 pr-4 py-2 border border-border rounded-md w-64 text-sm focus:ring-2 focus:ring-border-dark" />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto min-h-0">
        <FileExplorer
          items={paginatedProjects}
          actions={[
            {
              label: 'Delete',
              onClick: (item: FileSystemNodeProps, e: React.MouseEvent) => handleDelete(e, item.id),
              variant: 'secondary',
            }
          ]}
          loading={state.loading}
          loadingItems={[deletingNode]}
          emptyMessage="No Projects Found"
          showPagination={true}
          onPageChange={(page) => dispatch({ type: "SET_PAGE", payload: page })}
          currentPage={state.currentPage}
          totalItems={state.projects.length}
          className="text-sm"
        />
      </div>
      {state.isNewProjectModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
            <input
              type="text"
              placeholder="Enter folder name"
              className="w-full border px-3 py-2 rounded mb-4"
              onChange={(e) => setFolderName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-muted-light hover:bg-muted"
                onClick={() => dispatch({ type: "SET_IS_NEW_PROJECT_MODAL_OPEN", payload: false })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark"
                onClick={handleCreateProject}
                disabled={state.createLoading}
              >
                {state.createLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  );
};

export default ProjectHub;

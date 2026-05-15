"use client";

import React, { useEffect, useReducer, useState } from "react";
import { Search } from "lucide-react";

import { fetchNodes } from "@/app/apiServices/nodeServices";
import { handleApiError } from "@/helper/handleApiError";
import { FileSystemNodeProps } from "@/types/fileSystem";
import useAxios from "@/hooks/api/useAxios";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { FileExplorer } from "@/components/ui/FileExplorer";
import Header from "@/components/ui/Header";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useConfirmation } from "@/hooks/useConfirmation";

interface ProjectHubProps {
  projects: FileSystemNodeProps[];
  loading: boolean;
  searchQuery: string;
  currentPage: number;
  rowsPerPage: number;
}

const reducer = (state: ProjectHubProps, action: any): ProjectHubProps => {
  switch (action.type) {
    case "SET_PROJECTS": return { ...state, projects: action.payload };
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_SEARCH_QUERY": return { ...state, searchQuery: action.payload };
    case "SET_PAGE": return { ...state, currentPage: action.payload };
    default: return state;
  }
};

const ProjectHub = () => {
  const { fetchData } = useAxios();

  const [deletingNode, setIsDeletingNode] = useState("")

  const { confirmationState, confirm, handleConfirm, handleClose } = useConfirmation();

  const [state, dispatch] = useReducer(reducer, {
    projects: [],
    loading: true,
    searchQuery: "",
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
      <div className="px-6 py-6 flex items-start justify-between md:flex-row space-y-2 flex-col">
        <Header headerTitle="Project Hub" subTitle="Manage your legal projects" />
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

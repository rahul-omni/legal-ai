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
    setIsDeletingNode(nodeId)
    e.stopPropagation();
    await fetchData(apiRouteConfig.privateRoutes.node(nodeId), "DELETE");
    loadProjects()
    setIsDeletingNode("")
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-800">Project Hub</h1>
        <p className="text-sm text-gray-500">Manage your legal projects</p>
      </header>

      <div className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => dispatch({ type: "SET_IS_NEW_PROJECT_MODAL_OPEN", payload: true })} className="bg-gray-900 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm hover:bg-gray-800">
            <FolderPlus className="w-4 h-4" /> New Project
          </button>

          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="border px-3 py-1.5 rounded-md flex items-center gap-2 text-sm hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload Files"}
          </button>

          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, true)} accept=".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg" />
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" value={state.searchQuery} onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })} placeholder="Search projects..." className="pl-10 pr-4 py-2 border rounded-md w-64 text-sm focus:ring-2 focus:ring-gray-200" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="w-full">
          {state.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700 w-32">Created On</th>
                <th className="px-4 py-3 font-semibold text-gray-700 w-32">Last Modified</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.map((project) => (
                <tr key={project.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={project.type == "FOLDER" ? `/projects/${project.id}` : `/projects/root/edit/${project.id}`}
                        className="flex items-center gap-3 hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                      >
                        {project.type == "FOLDER" ?
                          <Folder className="w-5 h-5 text-blue-500 shrink-0" /> :
                          <FileIconDisplay fileName={project.name} />
                        }
                        <span className="font-medium text-gray-900">{project.name}</span>
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {moment(project.createdAt).format("MMM D, YYYY")}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {moment(project.updatedAt).format("MMM D, YYYY")}
                  </td>
                  <td className="px-4 py-3 flex items-center justify-center">
                    <button
                      onClick={() => {
                        if (project.type == "FOLDER"){
                          router.push(`/projects/${project.id}/edit`)
                        }else{
                          router.push(`/projects/root/edit/${project.id}`)
                        }
                      }}
                      className="text-sm px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded mr-2"
                    >
                      Open
                    </button>
                    <button
                      onClick={(e) => {
                        if (window.confirm("Are you sure you want to delete this project?")) {
                          handleDelete(e, project.id);
                        }
                      }}
                      disabled={deletingNode == project.id}
                      className="text-sm px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                    >
                      {deletingNode == project.id ? (
                        <Loader2 className="w-4 h-5 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedProjects.length == 0 && <tr><td colSpan={4} className="p-6 text-center">No Projects Found</td></tr>}
            </tbody>
          </table>}
        </div>

        {!state.loading && <div className="flex justify-end mt-4 gap-2">
          <button disabled={state.currentPage === 1} onClick={() => dispatch({ type: "SET_PAGE", payload: state.currentPage - 1 })} className="px-3 py-1 text-sm bg-white border rounded disabled:opacity-50">Previous</button>
          <button disabled={state.currentPage * state.rowsPerPage >= state.projects.length} onClick={() => dispatch({ type: "SET_PAGE", payload: state.currentPage + 1 })} className="px-3 py-1 text-sm bg-white border rounded disabled:opacity-50">Next</button>
        </div>}
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
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => dispatch({ type: "SET_IS_NEW_PROJECT_MODAL_OPEN", payload: false })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleCreateProject}
                disabled={state.createLoading}
              >
                {state.createLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHub;

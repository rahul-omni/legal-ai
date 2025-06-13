"use client";
import {
  createNode,
  CreateNodePayload,
  fetchNodes,
} from "@/app/apiServices/nodeServices";
import { useToast } from "@/components/ui/toast";
import { useUserContext } from "@/context/userContext";
import { handleApiError } from "@/helper/handleApiError";
import { FileService } from "@/lib/fileService";
import { FileSystemNodeProps } from "@/types/fileSystem";
import {
  File,
  FilePlus,
  Folder,
  FolderPlus,
  MoreVertical,
  Search,
  Upload,
  X,
} from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { getDocument } from "pdfjs-dist";
import { Dispatch, FC, useEffect, useReducer, useRef, useState } from "react";

interface ProjectHubProps {
  projects: FileSystemNodeProps[];
  selectedProject?: FileSystemNodeProps;
  loading: boolean;
  createLoading: boolean;
  searchQuery: string;
  isNewProjectModalOpen: boolean;
}

type ProjectHubAction =
  | {
      type: "SET_PROJECTS";
      payload: FileSystemNodeProps[];
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CREATE_LOADING"; payload: boolean }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_SELECTED_FOLDER"; payload?: FileSystemNodeProps }
  | { type: "SET_IS_NEW_PROJECT_MODAL_OPEN"; payload: boolean };

interface ProjectReducerProps {
  projectHubState: ProjectHubProps;
  dispatchProjectHub: Dispatch<ProjectHubAction>;
  loadProjects: (parentId?: string) => void;
}

const reducer = (
  state: ProjectHubProps,
  action: ProjectHubAction
): ProjectHubProps => {
  switch (action.type) {
    case "SET_PROJECTS":
      return { ...state, projects: action.payload };
    case "SET_SELECTED_FOLDER":
      return {
        ...state,
        selectedProject: action.payload,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CREATE_LOADING":
      return { ...state, createLoading: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_IS_NEW_PROJECT_MODAL_OPEN":
      return { ...state, isNewProjectModalOpen: action.payload };
    default:
      return state;
  }
};

export default function ProjectHub() {
  const { userState } = useUserContext();
  const [projectHubState, dispatchProjectHub] = useReducer(reducer, {
    projects: [],
    createLoading: false,
    loading: true,
    searchQuery: "",
    isNewProjectModalOpen: false,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async (parentId?: string) => {
    try {
      dispatchProjectHub({ type: "SET_LOADING", payload: true });
      const response = await fetchNodes(parentId);
      dispatchProjectHub({ type: "SET_PROJECTS", payload: response });
    } catch (error) {
      handleApiError(error);
    } finally {
      dispatchProjectHub({ type: "SET_LOADING", payload: false });
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col">
        <ProjectHeader />

        <ProjectToolbar
          projectHubState={projectHubState}
          dispatchProjectHub={dispatchProjectHub}
          loadProjects={loadProjects}
        />

        <Breadcrumbs
          projectHubState={projectHubState}
          dispatchProjectHub={dispatchProjectHub}
          loadProjects={loadProjects}
        />

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {projectHubState.loading || projectHubState.createLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((key) => (
                <SekeletonProjectCard key={key} />
              ))}
            </div>
          ) : (
            <>
              {/* Show files if they exist */}
              {projectHubState.projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectHubState.projects.map((project) => (
                    <ProjectCard
                      loadProjects={loadProjects}
                      project={project}
                      projectHubState={projectHubState}
                      dispatchProjectHub={dispatchProjectHub}
                      key={project.id}
                    />
                  ))}
                </div>
              )}

              {/* Always show EmptyProject when a folder is selected to display the upload button */}
              {(projectHubState.selectedProject ||
                projectHubState.projects.length === 0) && (
                <EmptyProject
                  projectHubState={projectHubState}
                  dispatchProjectHub={dispatchProjectHub}
                  loadProjects={loadProjects}
                />
              )}
            </>
          )}
        </div>
      </div>
      <NewProjectModal
        projectHubState={projectHubState}
        dispatchProjectHub={dispatchProjectHub}
        loadProjects={loadProjects}
         
      />
    </>
  );
}

const ProjectHeader = () => {
  return (
    <header className="border-b bg-white">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-800">Project Hub</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your legal projects and documents
        </p>
      </div>
    </header>
  );
};

const Breadcrumbs: FC<
  ProjectReducerProps & {
    loadProjects: (parentId?: string) => void;
  }
> = ({ projectHubState, dispatchProjectHub, loadProjects }) => {
  const path = projectHubState.selectedProject
    ? projectHubState.selectedProject.name
    : [];

  if (!projectHubState.selectedProject) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 px-6 py-4">
      <button
        className="flex items-center space-x-1"
        onClick={() => {
          dispatchProjectHub({
            type: "SET_SELECTED_FOLDER",
          });
          loadProjects();
        }}
      >
        <span>←</span>
        <span>Back</span>
      </button>
      <span className="text-gray-400">/</span>
      <span className="text-gray-400">{path}</span>
    </nav>
  );
};

 
const ProjectToolbar: FC<ProjectReducerProps> = ({
  projectHubState,
  dispatchProjectHub,
  loadProjects,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null); // New ref for Upload Files 2
  const [isUploading, setIsUploading] = useState(false);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let fullHtml = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(" ");
        fullHtml += `<p><strong>Page ${i}:</strong><br>${text.replace(/\n/g, "<br>")}</p>`;
      }

      return fullHtml;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw error;
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isRootLevel: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let content: string;

      if (file.type === "application/pdf") {
        content = await extractTextFromPDF(file);
        showToast("PDF Parsed Successfully");
      } else {
        content = await FileService.parseFile(file);
      }

      const newFile: CreateNodePayload = {
        name: file.name,
        type: "FILE",
        parentId: isRootLevel ? undefined : projectHubState.selectedProject?.id,
        content,
      };

      await createNode(newFile);
      await loadProjects(isRootLevel ? undefined : projectHubState.selectedProject?.id);
      showToast("File uploaded successfully");
    } catch (error) {
      handleApiError(error, showToast);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {!projectHubState.selectedProject ? (
          <>
            <button
              onClick={() => {
                dispatchProjectHub({
                  type: "SET_IS_NEW_PROJECT_MODAL_OPEN",
                  payload: true,
                });
              }}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center gap-2 hover:bg-gray-800 transition-colors text-sm"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New Project
            </button>

            <button
              title="Upload File"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`px-3 py-1.5 border border-gray-200 rounded-md flex items-center gap-2 ${
                isUploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
              } transition-colors text-sm`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Files 
            </button>
          </>
        ) : (
          <button
            title="Upload File"
            onClick={() => fileInputRef2.current?.click()}
            disabled={isUploading}
            className={`px-3 py-1.5 border border-gray-200 rounded-md flex items-center gap-2 ${
              isUploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
            } transition-colors text-sm`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Files 
          </button>
        )}

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => handleFileUpload(e, true)} // true for root level
          accept=".txt,.doc,.docx,.pdf"
        />
        <input
          type="file"
          ref={fileInputRef2}
          className="hidden"
          onChange={(e) => handleFileUpload(e, false)} // false for folder level
          accept=".txt,.doc,.docx,.pdf"
        />
      </div>
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={projectHubState.searchQuery}
          onChange={(e) =>
            dispatchProjectHub({
              type: "SET_SEARCH_QUERY",
              payload: e.target.value,
            })
          }
          className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
        />
      </div>
    </div>
  );
};

const EmptyProject: FC<
  ProjectReducerProps & { loadProjects: (parentId?: string) => void }
> = ({ projectHubState, dispatchProjectHub, loadProjects }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let fullHtml = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(" ");
        fullHtml += `<p><strong>Page ${i}:</strong><br>${text.replace(/\n/g, "<br>")}</p>`;
      }

      return fullHtml;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw error;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content: string;
      if (file.type === "application/pdf") {
        content = await extractTextFromPDF(file);
        showToast("PDF Parsed Successfully");
      } else {
        content = await FileService.parseFile(file);
      }

      const newFile: CreateNodePayload = {
        name: file.name,
        type: "FILE",
        parentId: projectHubState.selectedProject?.id,
        content,
      };
      console.log("newFile2", newFile);

      await createNode(newFile);
      await loadProjects(projectHubState.selectedProject?.id);
      showToast("File uploaded successfully");
    } catch (error) {
      handleApiError(error, showToast);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {projectHubState.selectedProject ? (
          <FilePlus className="w-8 h-8 text-gray-400" />
        ) : (
          <FolderPlus className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {projectHubState.selectedProject ? "" : "No projects yet"}
      </h3>
       
      {/* {projectHubState.selectedProject && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border border-gray-200 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm mx-auto"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Files 2
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.doc,.docx,.pdf"
          />
        </>
      )
      } */}

      {!projectHubState.selectedProject && (
        <>
          <p className="text-gray-500 mb-4">
            Create your first project to get started
          </p>
          <button
            onClick={() =>
              dispatchProjectHub({
                type: "SET_IS_NEW_PROJECT_MODAL_OPEN",
                payload: true,
              })
            }
            className="px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center gap-2 hover:bg-gray-800 transition-colors text-sm mx-auto"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Project
          </button>
        </>
      )}
    </div>
  );
};
const ProjectCard: FC<
  ProjectReducerProps & {
    project: FileSystemNodeProps;
    loadProjects: (parentId?: string) => void;
  }
> = ({ projectHubState, project, dispatchProjectHub, loadProjects }) => {
  const router = useRouter();
  return (
    <div
      onClick={() => {
        if (project.type === "FOLDER") {
          dispatchProjectHub({
            type: "SET_SELECTED_FOLDER",
            payload: project,
          });

          loadProjects(project.id);
          return;
        }
        if (projectHubState.selectedProject) {
          router.push(
            `/editor/${projectHubState.selectedProject.id}/${project.id}`
          );
          return;
        }
        router.push(`/editor/${project.id}`);
      }}
      className="border border-gray-200 rounded-lg bg-white p-4 hover:shadow-md transition-all hover:border-gray-300 cursor-pointer"
    >
      <div className="flex gap-4">
        {project.type === "FOLDER" ? (
          <Folder className="w-8 h-8 text-yellow-400 mb-2" />
        ) : (
          <File className="w-8 h-8 text-blue-400 mb-2" />
        )}

        <div className="flex items-start justify-between flex-1">
          <div className="text-left">
            <h3 className="font-medium text-gray-900">{project.name}</h3>
            {project.type === "FILE" && (
              <p className="text-sm text-gray-500 mt-1">
                Last modified:{" "}
                {moment(project.updatedAt).format("MMM D, YYYY h:mm A")}
              </p>
            )}
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SekeletonProjectCard = () => {
  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
        <div className="flex items-start justify-between flex-1">
          <div className="w-40">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
          </div>
          <div className="p-1 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const NewProjectModal: FC<ProjectReducerProps> = ({
  projectHubState: projectHubState,
  dispatchProjectHub: dispatchProjectHub,
}) => {
  const { userState } = useUserContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateProject(userState.user!.id, name, description);
    setName("");
    setDescription("");
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

  const refreshProject = async (parentId?: string) => {
    const children = await fetchNodes(parentId);
    if (!parentId) {
      dispatchProjectHub({ type: "SET_PROJECTS", payload: children });
      return;
    }
    dispatchProjectHub({
      type: "SET_PROJECTS",
      payload: updateNodeChildren(projectHubState.projects, children, parentId),
    });
  };

  const handleCreateProject = async (
    userId: string,
    name: string,
    description: string
  ) => {
    try {
      dispatchProjectHub({ type: "SET_CREATE_LOADING", payload: true });
      dispatchProjectHub({
        type: "SET_IS_NEW_PROJECT_MODAL_OPEN",
        payload: false,
      });
      await createNode({ name: name, type: "FOLDER" });
      await refreshProject();
    } catch (error) {
      handleApiError(error);
    } finally {
      dispatchProjectHub({ type: "SET_CREATE_LOADING", payload: false });
    }
  };

  if (!projectHubState.isNewProjectModalOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Create New Project
          </h2>
          <button
            onClick={() =>
              dispatchProjectHub({
                type: "SET_IS_NEW_PROJECT_MODAL_OPEN",
                payload: false,
              })
            }
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                dispatchProjectHub({
                  type: "SET_IS_NEW_PROJECT_MODAL_OPEN",
                  payload: false,
                })
              }
              className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              disabled={projectHubState.createLoading}
              type="submit"
              className="px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

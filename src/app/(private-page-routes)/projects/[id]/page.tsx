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

  return (
    <div className="w-full overflow-auto">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-text-dark">Project Hub</h1>
        <p className="text-sm text-muted">Manage your legal projects</p>
      </header>

      <div className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="border px-3 py-1.5 rounded-md flex items-center gap-2 text-sm hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload Files"}
          </button>

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
      </div>
      <div className="flex-1 overflow-auto p-6 bg-background">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <table className="w-full table-auto border-collapse">
          <thead className="bg-background-dark text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-text-light">Name</th>
              <th className="px-4 py-3 font-semibold text-text-light w-32">Created On</th>
              <th className="px-4 py-3 font-semibold text-text-light w-32">Last Modified</th>
              <th className="px-4 py-3 text-center font-semibold text-text-light w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.map((project) => (
              <tr key={project.id} className="border-t hover:bg-background-dark transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/projects/${project.parentId}/edit/${project.id}`}
                      className="flex items-center gap-3 hover:bg-background-dark rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    >
                      <FileIconDisplay fileName={project.name} />
                      <span className="font-medium text-text">{project.name}</span>
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-light text-sm">
                  {moment(project.createdAt).format("MMM D, YYYY")}
                </td>
                <td className="px-4 py-3 text-text-light text-sm">
                  {moment(project.updatedAt).format("MMM D, YYYY")}
                </td>
                <td className="px-4 py-3 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      if (window.confirm("Are you sure you want to delete this file?")) {
                        handleDelete(e, project.id);
                      }
                    }}
                    disabled={deletingNode == project.id}
                    className="text-sm px-3 py-1 bg-error-light hover:bg-error-light text-error rounded"
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
          {paginatedProjects.length == 0 && <tr><td colSpan={4} className="p-6 text-center">No Files in this Project</td></tr>}
          </tbody>
        </table>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1 border rounded ${currentPage === index + 1
                ? "bg-primary text-white"
                : "bg-background-light text-text-light"
                }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectFolderTable;

import { FileSystemNodeProps } from "@/types/fileSystem";
import { FileType } from "@prisma/client";
import { apiClient } from ".";
import { AxiosResponse } from "axios";
import { apiRouteConfig } from "../api/lib/apiRouteConfig";
import toast from "react-hot-toast";
import { extractTextFromPDF, fileToBase64 } from "@/utils/pdfUtils";
import { FileService } from "@/lib/fileService";
import { handleApiError } from "@/helper/handleApiError";
export interface CreateNodePayload {
  name: string;
  type: FileType;
  parentId?: string | null;
  content?: string;
}

export const fetchNodes = async (
  parentId?: string,
  id?: string
): Promise<FileSystemNodeProps[]> => {
  const url = `${apiRouteConfig.privateRoutes.nodes}?parentId=${parentId || ""}&id=${id || ""}`;

  try {
    const requestPromise = apiClient.get(url).then((response) => {
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format: expected array");
      }
      return response.data;
    });

    return await requestPromise;
  } catch (error) {
    console.error("Error fetching nodes:", error);
    return []; // Return empty array instead of undefined
  }
};

export const createNode = async (
  node: CreateNodePayload
): Promise<FileSystemNodeProps> => {
  try {
    const response: AxiosResponse<FileSystemNodeProps> = await apiClient.post(
      apiRouteConfig.privateRoutes.nodes,
      node
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
};

export const fetchAllNodes = async (): Promise<FileSystemNodeProps[]> => {
  try {
    const response = await apiClient.get(apiRouteConfig.privateRoutes.nodeTree);
    return response.data;
  } catch (error) {
    console.error("Error fetching all nodes:", error);
    throw new Error("Failed to fetch all nodes");
  }
};

export const readFile = async (
  nodeId: string
): Promise<{ content: Blob; name: string }> => {
  try {
    const response = await apiClient.get(
      apiRouteConfig.privateRoutes.node(nodeId),
      {
        responseType: "blob",
      }
    );
    const blob = response.data as Blob;

    const contentDisposition = response.headers["content-disposition"];
    const nameMatch = contentDisposition?.match(/filename="?(.+)"?/);
    const name = nameMatch?.[1] || "file-from-server";
    console.log("✅ readFile blob type:", blob.type, "name:", name);

    return { content: blob, name };
  } catch (error) {
    console.error("Error reading file content:", error);
    throw new Error("Failed to read file content");
  }
};

export const updateNodeContent = async (
  nodeId: string,
  content: string,
  name?: string // optional if not renaming
): Promise<FileSystemNodeProps | null> => {
  if (!nodeId) {
    throw new Error("Node ID is required");
  }

  try {
    const payload: any = { content };
    if (name) payload.name = name;

    const response: AxiosResponse<FileSystemNodeProps> = await apiClient.put(
      apiRouteConfig.privateRoutes.node(nodeId),
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Error updating node content:", error);
    return null;
  }
};

export const createNewFile = async (
  payload: CreateNodePayload
): Promise<FileSystemNodeProps> => {
  // Set default values
  const { type, ...restPayload } = payload; // Exclude 'type' from payload
  const createPayload = {
    type: "FILE" as const,
    content: "",
    ...restPayload,
  };

  try {
    const response: AxiosResponse<FileSystemNodeProps> = await apiClient.post(
      apiRouteConfig.privateRoutes.nodes,
      createPayload
    );

    console.log("New file created:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error creating new file:", error);
    throw new Error("Failed to create new file");
  }
};

export const uploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    parentId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let content: string;

      if (file.type === "application/pdf") {
        const { html } = await extractTextFromPDF(file);
        content = html;
        toast.success("PDF Parsed Successfully");
      }else if (["image/png", "image/jpg", "image/jpeg"].includes(file.type)) {
        const base64 = await fileToBase64(file); // 👈 Convert image to base64
        
        const res = await fetch("/api/parse-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base64Image: base64,
            mimeType: file.type,
            targetLanguage: "English", // Optional, default handled by server
          }),
        });

        const { html } = await res.json();
        content = html;
        toast.success("Image Parsed Successfully");
      } else {
        content = await FileService.parseFile(file);
      }

      const updatedFileName = file.name.replace(/\.[^/.]+$/, "") + ".docx";

      const newFile: CreateNodePayload = {
        name: updatedFileName,
        type: "FILE",
        parentId,
        content,
      };

      const newnode = await createNode(newFile);
    } catch (error) {
      handleApiError(error);
    }
  };

import { FileType } from "@prisma/client";
import { apiClient } from ".";
import { FileSystemNodeProps } from "@/types/fileSystem";

export interface CreateNodePayload {
  name: string;
  type: FileType;
  userId: string;
  parentId?: string | null;
  content?: string;
}

export const fetchNodes = async (
  userId: string,
  parentId?: string
): Promise<FileSystemNodeProps[]> => {
  try {
    const url = `/nodes?parentId=${parentId || ""}&userId=${userId}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching nodes:", error);
    throw new Error("Failed to fetch nodes");
  }
};

export const createNode = async (node: CreateNodePayload) => {
  try {
    await apiClient.post("/nodes", node);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
};

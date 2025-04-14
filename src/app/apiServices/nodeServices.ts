import {  FileSystemNodeProps } from "@/types/fileSystem";
import { FileType } from "@prisma/client";
import { apiClient } from ".";

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
    console.log("fetchnodesrespose",response);
    console.log("fetchnodesrespose--data",response.data);
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


export const fetchAllNodes = async (): Promise<FileSystemNodeProps[]> => {
  try {
    const response = await apiClient.get("/system/tree?userId=1");
    console.log("response",response);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching all nodes:", error);
    throw new Error("Failed to fetch all nodes");
  }
};


export const readFile = async (nodeId: string): Promise<{ content: Blob; name: string }> => {
  try {
    const response = await apiClient.get(`/nodes/${nodeId}`, { responseType: 'blob' });
    const blob = response.data as Blob;

    const contentDisposition = response.headers['content-disposition'];
    const nameMatch = contentDisposition?.match(/filename="?(.+)"?/);
    const name = nameMatch?.[1] || 'file-from-server';
    console.log("✅ readFile blob type:", blob.type, "name:", name);

    return { content: blob, name };
  } catch (error) {
    console.error("Error reading file content:", error);
    throw new Error("Failed to read file content");
  }
};

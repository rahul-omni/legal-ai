import { FileSystemNodeProps } from "@/types/fileSystem";
import { FileType } from "@prisma/client";
import { apiClient } from ".";
import { AxiosResponse } from "axios";
import { apiRouteConfig } from "../api/lib/apiRouteConfig";
import { openai } from "@/lib/openai";
export interface CreateNodePayload {
  name: string;
  type: FileType;
  parentId?: string | null;
  content?: string;
}

export const fetchNodes = async (
  parentId?: string
): Promise<FileSystemNodeProps[]> => {
  const url = `${apiRouteConfig.privateRoutes.nodes}?parentId=${parentId || ""}`;

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

export const createNodeold = async (node: CreateNodePayload) => {
  try {
    await apiClient.post(apiRouteConfig.privateRoutes.nodes, node);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
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

export const parseImageWithOpenAI = async (
  imageFile: File
): Promise<{ html: string }> => {
  try {
    // Step 1: Convert File to base64
    const base64Image = await fileToBase64(imageFile);

    // Step 2: Send image to OpenAI with vision model
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract text from this image file. Preserve formatting and return rich HTML.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageFile.type};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const htmlContent = response.choices[0]?.message?.content || '';
    return {html: htmlContent.replace(/```html|```/g, '').trim()};
  } catch (error) {
    console.error('Error during OpenAI Vision processing:', error);
    throw new Error('Failed to process image');
  }
};

// Helper: Convert File to base64 string
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });

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

import { db } from "@/app/api/lib/db";
import { FileSystemNode, FileType } from "@prisma/client";
import { Transaction } from "../types";
import { ErrorApp, ErrorNotFound } from "../lib/errors";

interface CreateNodeInput {
  userId: string;
  name: string;
  type: FileType;
  content: string | null;
  parentId: string | null;
}

class FileSystemNodeService {
  async findNodeById(id: string): Promise<FileSystemNode | null> {
    try {
      return await db.fileSystemNode.findUnique({
        where: { id },
      });
    } catch {
      throw new Error("Failed to find node in the database");
    }
  }

  async getConcatenatedContentByIds(ids: string[]): Promise<string> {
    try {
      const nodes = await db.fileSystemNode.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          content: true, // Only fetch content
        },
      });
    return nodes.map((node) => node.content || "").join("\n"); // Join with newline or any separator
  } catch {
    throw new Error("Failed to retrieve and concatenate content from nodes");
  }
}

  async findNodesByParentId(
  userId: string,
  parentId: string | null,
): Promise<Pick<FileSystemNode, 'id' | 'name' | 'type' | 'parentId' | 'isExpanded' | 'createdAt' | 'updatedAt'>[]> {
  try {
    return await db.fileSystemNode.findMany({
      where: {
        parentId: parentId || null,
        userId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
        isExpanded: true,
        createdAt: true,
        updatedAt: true
      },
    });
  } catch {
    throw new ErrorNotFound("Failed to find nodes in the database");
  }
}

  async createNode(
    node: CreateNodeInput,
    tx?: Transaction
  ): Promise<FileSystemNode> {
    try {
      const prisma = tx || db;
      return await prisma.fileSystemNode.create({
        data: node,
      });
    } catch {
      throw new Error("Failed to create node in the database");
    }
  }

  async updateNodeById(node: FileSystemNode): Promise<FileSystemNode> {
    try {
      return await db.fileSystemNode.update({
        where: { id: node.id },
        data: node,
      });
    } catch {
      throw new ErrorNotFound("Node not found");
    }
  }

  async deleteNodeById(id: string): Promise<FileSystemNode> {
    try {
      return await db.fileSystemNode.delete({
        where: { id },
      });
    } catch {
      throw new ErrorNotFound("Node not found");
    }
  }

  async findExistingNode(
    userId: string,
    name: string,
    type: FileType,
    content: string | null,
    parentId: string | null
  ): Promise<FileSystemNode | null> {
    try {
      return await db.fileSystemNode.findFirst({
        where: {
          name,
          type,
          userId,
          content: type === "FILE" ? content || "" : null,
          parentId: parentId || null,
        },
      });
    } catch {
      throw new Error("Failed to find existing node in the database");
    }
  }
}

// Export default instance for easier usage
export const fileSystemNodeService = new FileSystemNodeService();

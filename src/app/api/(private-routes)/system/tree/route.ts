import { db } from "@/app/api/lib/db";
import { userFromSession } from "@/lib/auth";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth/nextAuthConfig";
import { handleError } from "@/app/api/lib/errors";

// Recursive function to build a nested tree structure
async function buildTree(parentId: string | null, userId: string) {
  // 1. Fetch all nodes at the current level
  const nodes = (await db.fileSystemNode.findMany({
    where: {
      parentId,
      userId,
    },
    orderBy: { type: "desc" }, // Folders first
  })) as unknown as FileSystemNodeProps[]; // Type assertion

  // 2. For each folder, recursively fetch its children
  for (const node of nodes) {
    if (node.type === "FOLDER") {
      node.children = await buildTree(node.id, userId);
    }
  }

  return nodes;
}

// GET: Fetch entire file system tree for a user
async function retrieveFileTreeStructure(request: NextAuthRequest) {
  try {
    const sessionUser = await userFromSession(request);

    // Build tree starting from root (NULL parentId)
    const tree = await buildTree(null, sessionUser.id);
    return NextResponse.json(tree);
  } catch (error) {
    return handleError(error);
  }
}

export const GET = auth(retrieveFileTreeStructure);

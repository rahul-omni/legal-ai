import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FileSystemNodeProps } from "@/types/fileSystem";

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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Build tree starting from root (NULL parentId)
    const tree = await buildTree(null, userId);
    return NextResponse.json(tree);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tree" },
      { status: 500 }
    );
  }
}

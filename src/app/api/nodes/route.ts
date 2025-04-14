import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper function for consistent error handling
function handleError(error: unknown, message: string, status = 500) {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
}

// GET: Fetch nodes (root level or children of a folder)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId"); // NULL for root items
    const userId = searchParams.get("userId"); // Required for multi-user systems

    // Validate user ID
    if (!userId) {
      return handleError(null, "User ID is required", 400);
    }

    // Query nodes from database
    const nodes = await db.fileSystemNode.findMany({
      where: {
        parentId: parentId || null, // NULL = root level
        userId: userId, // Only fetch user's files
      },
      orderBy: { type: "desc" }, // Folders first (FOLDER > FILE)
    });

    return NextResponse.json(nodes);
  } catch (error) {
    return handleError(error, "Failed to fetch nodes");
  }
}

// POST: Create a new file/folder
export async function POST(request: Request) {
  try {
    const { name, type, parentId, content, userId } = await request.json();

    // Validation
    if (!name || !type || !userId) {
      return handleError(null, "Name, type, and user ID are required", 400);
    }

    // Files must have content (folders can be empty)
    if (type === "FILE" && !content) {
      return handleError(null, "Content is required for files", 400);
    }

    // Create the node in database
    const newNode = await db.fileSystemNode.create({
      data: {
        name,
        type,
        content: type === "FILE" ? content || "" : null, // Folders = NULL
        parentId: parentId || null, // NULL = root level
        userId,
      },
    });

    return NextResponse.json(newNode);
  } catch (error) {
    return handleError(error, "Failed to create node");
  }
}

import { userFromSession } from "@/lib/auth";
import { db } from "@/app/api/lib/db";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "../../[...nextauth]/route";
import { FileSystemNode, FileType } from "@prisma/client";
import { ErrorValidation } from "../../lib/errors";

// Error handling utility
function handleError(error: unknown, message: string, status = 500) {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
}

// ===== Node Services =====

async function getNodesByParentId(
  userId: string,
  parentId: string | null
): Promise<FileSystemNode[]> {
  return db.fileSystemNode.findMany({
    where: {
      parentId: parentId || null,
      userId,
    },
    orderBy: { type: "desc" },
  });
}

async function findExistingNode(
  userId: string,
  name: string,
  type: FileType,
  content: string | null,
  parentId: string | null
): Promise<FileSystemNode | null> {
  return db.fileSystemNode.findFirst({
    where: {
      name,
      type,
      userId,
      content: type === "FILE" ? content || "" : null,
      parentId: parentId || null,
    },
  });
}

async function createNode(
  userId: string,
  name: string,
  type: FileType,
  content: string | null,
  parentId: string | null
): Promise<FileSystemNode> {
  return db.fileSystemNode.create({
    data: {
      name,
      type,
      content: type === "FILE" ? content || "" : null,
      parentId: parentId || null,
      userId,
    },
  });
}

// ===== Validation =====

function validateNodeInput(
  name: string,
  type: string,
  content: string | null
): string | null {
  if (!name || !type) {
    return "Name and type are required";
  }

  if (type === "FILE" && !content) {
    return "Content is required for files";
  }

  return null;
}

// ===== Controllers =====

async function getNodesController(request: NextAuthRequest) {
  try {
    const sessionUser = await userFromSession(request);
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    const nodes = await getNodesByParentId(sessionUser.id, parentId);
    return NextResponse.json(nodes);
  } catch (error) {
    return handleError(error, "Failed to fetch nodes");
  }
}

async function createNodeController(request: NextAuthRequest) {
  try {
    const sessionUser = await userFromSession(request);
    const { name, type, parentId, content } = await request.json();

    // Validate input
    const validationError = validateNodeInput(name, type, content);
    if (validationError) {
      throw new ErrorValidation("Invalid input");
    }

    // Check for duplicates
    const existingNode = await findExistingNode(
      sessionUser.id,
      name,
      type,
      content,
      parentId
    );

    if (existingNode) {
      return NextResponse.json(
        { error: "Duplicate file is present" },
        { status: 409 }
      );
    }

    // Create the node
    const newNode = await createNode(
      sessionUser.id,
      name,
      type,
      content,
      parentId
    );

    return NextResponse.json(newNode);
  } catch (error) {
    return handleError(error, "Failed to create node");
  }
}

// ===== Route Handlers =====

export const GET = auth(getNodesController);
export const POST = auth(createNodeController);

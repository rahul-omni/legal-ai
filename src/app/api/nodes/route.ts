import { userFromSession } from "@/lib/auth";

import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../lib/db";
import { auth } from "../[...nextauth]/route";

function handleError(error: unknown, message: string, status = 500) {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
}

export const GET = auth(async function (request: NextAuthRequest) {
  try {
    const sessionUser = await userFromSession(request);

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    const nodes = await db.fileSystemNode.findMany({
      where: {
        parentId: parentId || null,
        userId: sessionUser.id,
      },
      orderBy: { type: "desc" },
    });

    return NextResponse.json(nodes);
  } catch (error) {
    return handleError(error, "Failed to fetch nodes");
  }
});

export const POST = auth(async function (request: NextAuthRequest) {
  try {
    const sessionUser = await userFromSession(request);

    const { name, type, parentId, content } = await request.json();

    if (!name || !type) {
      return handleError(null, "Name, type, and user ID are required", 400);
    }

    if (type === "FILE" && !content) {
      return handleError(null, "Content is required for files", 400);
    }

    const existingNode = await db.fileSystemNode.findFirst({
      where: {
        name,
        type,
        userId: sessionUser.id,
        content: type === "FILE" ? content || "" : null,
        parentId: parentId || null, // root level or specific folder
      },
    });

    if (existingNode) {
      // return handleError(null, "Duplicate node: This file/folder already exists", 409);
      return NextResponse.json(
        { error: "Duplicate file is present" },
        { status: 409 }
      );
    }
    // Create the node in database
    const newNode = await db.fileSystemNode.create({
      data: {
        name,
        type,
        content: type === "FILE" ? content || "" : null,
        parentId: parentId || null,
        userId: sessionUser.id,
      },
    });

    return NextResponse.json(newNode);
  } catch (error) {
    return handleError(error, "Failed to create node");
  }
});

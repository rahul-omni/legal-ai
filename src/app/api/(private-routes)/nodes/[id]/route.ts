import { db } from "@/app/api/lib/db";
import { handleError } from "@/app/api/lib/errors";
import { NextRequest, NextResponse } from "next/server";

//api/nodes/id
export async function GET(_: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    const node = await db.fileSystemNode.findUnique({
      where: { id },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    if (!node.content) {
      return NextResponse.json(
        { error: "File content is missing" },
        { status: 500 }
      );
    }

    // If it's a binary file, return base64 encoded content
    const extension = node.name.split(".").pop()?.toLowerCase();
    const isBinary = ["pdf", "docx"].includes(extension ?? "");

    if (isBinary && node.content !== null) {
      const base64Content = Buffer.from(node.content, "utf-8").toString(
        "base64"
      );
      return NextResponse.json({ ...node, base64Content });
    }

    return NextResponse.json(node);
  } catch (error) {
    handleError(error);
  }
}

// PUT: Update a node (rename, move, etc.)
export async function PUT(
  request: NextRequest,
  context: any // Change here
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Node ID is  PUT nodes routes  required" },
        { status: 400 }
      );
    }
    const { name, content, parentId, isExpanded } = await request.json();

    // Partial update - only modify provided fields
    const updatedNode = await db.fileSystemNode.update({
      where: { id },
      data: {
        ...(name && { name }), // Update if name exists
        ...(content !== undefined && { content }), // Update if content provided
        ...(parentId !== undefined && { parentId }), // Can set to NULL
        ...(isExpanded !== undefined && { isExpanded }), // UI state
      },
    });

    return NextResponse.json(updatedNode);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE: Recursively delete a node and its children
export async function DELETE(_: NextRequest, context: any) {
  try {
    const { id } = await context.params;

    // First check if node exists
    const node = await db.fileSystemNode.findUnique({
      where: { id },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Recursive delete function
    async function deleteNode(nodeId: string) {
      // 1. Fetch all children
      const children = await db.fileSystemNode.findMany({
        where: { parentId: nodeId },
      });

      // 2. Recursively delete each child
      for (const child of children) {
        await deleteNode(child.id);
      }

      // 3. Delete the current node
      await db.fileSystemNode.delete({
        where: { id: nodeId },
      });
    }

    await deleteNode(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

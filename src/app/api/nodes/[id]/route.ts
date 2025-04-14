import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch a single node by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const node = await db.fileSystemNode.findUnique({
      where: { id: params.id },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    return NextResponse.json(node);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch node" },
      { status: 500 }
    );
  }
}

// PUT: Update a node (rename, move, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, content, parentId, isExpanded } = await request.json();

    // Partial update - only modify provided fields
    const updatedNode = await db.fileSystemNode.update({
      where: { id: params.id },
      data: {
        ...(name && { name }), // Update if name exists
        ...(content !== undefined && { content }), // Update if content provided
        ...(parentId !== undefined && { parentId }), // Can set to NULL
        ...(isExpanded !== undefined && { isExpanded }), // UI state
      },
    });

    return NextResponse.json(updatedNode);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update node" },
      { status: 500 }
    );
  }
}

// DELETE: Recursively delete a node and its children
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First check if node exists
    const node = await db.fileSystemNode.findUnique({
      where: { id: params.id },
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

    await deleteNode(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete node" },
      { status: 500 }
    );
  }
}

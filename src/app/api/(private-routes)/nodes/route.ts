import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../[...nextauth]/route";
import { handleError } from "../../lib/errors";
import { fileSystemNodeService } from "../../lib/services/fileSystemNodeService";

const nodeInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["FILE", "FOLDER"], { required_error: "Type is required" }),
  content: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
});

async function getNodesController(request: NextAuthRequest) {
  try {
    const sessionUser = await userFromSession(request);
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    const nodes = await fileSystemNodeService.findNodesByParentId(
      sessionUser.id,
      parentId
    );

    return NextResponse.json(nodes);
  } catch (error) {
    return handleError(error);
  }
}

async function createNodeController(request: NextAuthRequest) {
  try {
    const sessionUser = await userFromSession(request);
    const body = await request.json();

    const { name, type, parentId, content } = nodeInputSchema.parse(body);

    const existingNode = await fileSystemNodeService.findExistingNode(
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

    const newNode = await fileSystemNodeService.createNode({
      userId: sessionUser.id,
      name,
      type,
      content,
      parentId,
    });

    return NextResponse.json(newNode);
  } catch (error) {
    return handleError(error);
  }
}

export const GET = auth(getNodesController);
export const POST = auth(createNodeController);

import { userFromSession } from "@/lib/auth";
import { FileType } from "@prisma/client";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../[...nextauth]/route";
import { ErrorValidation, handleError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { fileSystemNodeService } from "../../services/fileSystemNodeService";

const nodeInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(FileType, { required_error: "Type is required" }),
  content: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
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
    logger.info("createNodeController: Start processing request");

    const sessionUser = await userFromSession(request);
    logger.info("createNodeController: Retrieved session user", sessionUser);

    const body = await request.json();
    logger.info("createNodeController: Parsed request body", body);

    let parsedInput;
    try {
      parsedInput = await nodeInputSchema.parseAsync(body);
    } catch (validationError) {
      logger.warn("createNodeController: Validation failed", validationError);
      throw new ErrorValidation("Invalid request data");
    }

    const { name, type, parentId, content } = parsedInput;

    logger.info("createNodeController: Validated input", {
      name,
      type,
      parentId,
      content: content ?? null,
    });

    const existingNode = await fileSystemNodeService.findExistingNode(
      sessionUser.id,
      name,
      type,
      content ?? null,
      parentId ?? null
    );
    logger.info(
      "createNodeController: Checked for existing node",
      existingNode
    );

    if (existingNode) {
      logger.warn("createNodeController: Duplicate node detected");
      return NextResponse.json(
        { error: "Duplicate file is present" },
        { status: 409 }
      );
    }

    const newNode = await fileSystemNodeService.createNode({
      userId: sessionUser.id,
      name,
      type,
      content: content ?? null,
      parentId: parentId ?? null,
    });
    logger.info("createNodeController: Created new node", newNode);

    return NextResponse.json(newNode);
  } catch (error) {
    logger.error("createNodeController: Error occurred", error);
    return handleError(error);
  }
}

export const GET = auth(getNodesController);
export const POST = auth(createNodeController);

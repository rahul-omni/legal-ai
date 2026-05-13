import { db } from "@/app/api/lib/db";
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { ensureAssistantChatTables } from "../../../_lib/chatTables";

type AttachmentInput = { nodeId?: string; fileName?: string };

async function createAttachmentMessageController(
  request: NextAuthRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const { conversationId } = await context.params;

    const body = (await request.json()) as {
      attachments?: AttachmentInput[];
      message?: string;
    };

    const attachments = Array.isArray(body.attachments)
      ? body.attachments
          .map((a) => ({
            nodeId: typeof a?.nodeId === "string" ? a.nodeId : "",
            fileName: typeof a?.fileName === "string" ? a.fileName : "",
          }))
          .filter((a) => a.nodeId && a.fileName)
      : [];

    if (!attachments.length) {
      return NextResponse.json(
        { error: "attachments are required" },
        { status: 400 }
      );
    }

    const conversation = await (db as any).chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const content =
      typeof body.message === "string" && body.message.trim()
        ? body.message.trim().slice(0, 50_000)
        : `Attached document(s):\n${attachments
            .map((a) => `- ${a.fileName}`)
            .join("\n")}`;

    const createdMessage = await (db as any).chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    for (const a of attachments) {
      await db.$executeRawUnsafe(
        `INSERT INTO chat_message_documents (message_id, node_id, file_name)
         VALUES ($1::uuid, $2::uuid, $3::text)`,
        createdMessage.id,
        a.nodeId,
        a.fileName
      );
    }

    // Also upsert to conversation-level documents for context accumulation.
    for (const a of attachments) {
      await (db as any).chatConversationDocument.upsert({
        where: {
          chat_conversation_node_unique: {
            conversationId: conversation.id,
            nodeId: a.nodeId,
          },
        },
        update: {
          fileName: a.fileName,
        },
        create: {
          conversationId: conversation.id,
          nodeId: a.nodeId,
          fileName: a.fileName,
        },
      });
    }

    await (db as any).chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      message: {
        id: createdMessage.id,
        role: "user",
        content,
        createdAt: createdMessage.createdAt,
        attachments,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = auth(createAttachmentMessageController);


import { db } from "@/app/api/lib/db";
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { ensureAssistantChatTables } from "../../../_lib/chatTables";

async function getMessagesController(
  request: NextAuthRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const { conversationId } = await context.params;

    const allowedRows = await db.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "chat_conversations"
      WHERE "id" = ${conversationId}::uuid
        AND "user_id" = ${user.id}::uuid
        AND "source" = 'AI_ASSISTANT'
        AND "is_archived" = false
      LIMIT 1;
    `;

    if (!allowedRows[0]) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const conversation = await (db as any).chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
        isArchived: false,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          select: {
            nodeId: true,
            fileName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const messageDocsRows = (await db.$queryRawUnsafe(
      `SELECT md.message_id AS "messageId",
              md.node_id AS "nodeId",
              md.file_name AS "fileName",
              md.created_at AS "createdAt"
       FROM chat_message_documents md
       INNER JOIN chat_messages m ON m.id = md.message_id
       WHERE m.conversation_id = $1::uuid
       ORDER BY md.created_at ASC`,
      conversation.id
    )) as Array<{
      messageId: string;
      nodeId: string;
      fileName: string;
      createdAt: string;
    }>;

    const attachmentsByMessageId = new Map<
      string,
      { nodeId: string; fileName: string; createdAt: string }[]
    >();

    for (const row of messageDocsRows) {
      const list = attachmentsByMessageId.get(row.messageId) ?? [];
      list.push({ nodeId: row.nodeId, fileName: row.fileName, createdAt: row.createdAt });
      attachmentsByMessageId.set(row.messageId, list);
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: conversation.messages.map((message: any) => ({
        id: message.id,
        role: String(message.role).toLowerCase(),
        content: message.content,
        createdAt: message.createdAt,
        attachments: attachmentsByMessageId.get(message.id) ?? [],
      })),
      attachments: conversation.documents,
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = auth(getMessagesController);

async function clearConversationDocumentsController(
  request: NextAuthRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const { conversationId } = await context.params;

    const conversationRows = await db.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "chat_conversations"
      WHERE "id" = ${conversationId}::uuid
        AND "user_id" = ${user.id}::uuid
        AND "source" = 'AI_ASSISTANT'
        AND "is_archived" = false
      LIMIT 1;
    `;
    const conversation = conversationRows[0];

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const result = await (db as any).chatConversationDocument.deleteMany({
      where: {
        conversationId: conversation.id,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count ?? 0,
    });
  } catch (error) {
    return handleError(error);
  }
}

export const DELETE = auth(clearConversationDocumentsController);

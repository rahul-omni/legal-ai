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

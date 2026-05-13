import { db } from "@/app/api/lib/db";
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { ensureAssistantChatTables } from "../../_lib/chatTables";

async function deleteConversationController(
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

    await (db as any).chatConversation.update({
      where: { id: conversation.id },
      data: {
        isArchived: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export const DELETE = auth(deleteConversationController);


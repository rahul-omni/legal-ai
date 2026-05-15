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

    await db.$executeRaw`
      UPDATE "chat_conversations"
      SET "is_archived" = true,
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${conversation.id}::uuid;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export const DELETE = auth(deleteConversationController);


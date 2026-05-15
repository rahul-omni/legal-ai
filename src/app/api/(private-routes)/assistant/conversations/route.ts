import { db } from "@/app/api/lib/db";
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { ensureAssistantChatTables } from "../_lib/chatTables";

async function getConversationsController(request: NextAuthRequest) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const conversations = await db.$queryRaw<{
      id: string;
      title: string;
      updatedAt: Date;
      createdAt: Date;
      preview: string | null;
    }[]>`
      SELECT
        c."id",
        c."title",
        c."updated_at" AS "updatedAt",
        c."created_at" AS "createdAt",
        (
          SELECT LEFT(m."content", 140)
          FROM "chat_messages" m
          WHERE m."conversation_id" = c."id"
          ORDER BY m."created_at" DESC
          LIMIT 1
        ) AS "preview"
      FROM "chat_conversations" c
      WHERE c."user_id" = ${user.id}::uuid
        AND c."is_archived" = false
        AND c."source" = 'AI_ASSISTANT'
      ORDER BY c."updated_at" DESC;
    `;

    return NextResponse.json({
      conversations: conversations.map((conversation) => ({
        ...conversation,
        preview: conversation.preview || "",
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

async function createConversationController(
  request: NextAuthRequest
) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
    };
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "New conversation";

    const rows = await db.$queryRaw<{
      id: string;
      title: string;
      createdAt: Date;
      updatedAt: Date;
    }[]>`
      INSERT INTO "chat_conversations" (
        "user_id",
        "title",
        "source",
        "thread_kind",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${user.id}::uuid,
        ${title},
        'AI_ASSISTANT',
        'CUSTOM',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING
        "id",
        "title",
        "created_at" AS "createdAt",
        "updated_at" AS "updatedAt";
    `;
    const conversation = rows[0];

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export const GET = auth(getConversationsController);
export const POST = auth(createConversationController);

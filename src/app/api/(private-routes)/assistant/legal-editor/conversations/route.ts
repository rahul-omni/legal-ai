import { db } from "@/app/api/lib/db";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { handleError } from "@/app/api/lib/errors";
import { assertWorkspaceAccessAllowed } from "@/app/api/lib/subscriptionLimits";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { ensureAssistantChatTables } from "../../_lib/chatTables";

type LegalEditorMode = "CHAT" | "DOCUMENT";
type ConversationRow = {
  id: string;
  mode: LegalEditorMode;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }[];
};

async function assertContext(userId: string, workspaceId: string, fileId: string) {
  const rows = await db.$queryRaw<{ workspaceId: string; fileId: string }[]>`
    WITH RECURSIVE workspace_tree AS (
      SELECT fsn."id", fsn."parent_id"
      FROM "workspaces" w
      INNER JOIN "file_system_nodes" fsn ON fsn."id" = w."project_folder_id"
      WHERE w."id" = ${workspaceId}::uuid
        AND w."user_id" = ${userId}::uuid
        AND fsn."user_id" = ${userId}::uuid

      UNION ALL

      SELECT child."id", child."parent_id"
      FROM "file_system_nodes" child
      INNER JOIN workspace_tree parent ON parent."id" = child."parent_id"
      WHERE child."user_id" = ${userId}::uuid
    )
    SELECT ${workspaceId}::uuid AS "workspaceId", wt."id" AS "fileId"
    FROM workspace_tree wt
    WHERE wt."id" = ${fileId}::uuid
    LIMIT 1;
  `;

  return Boolean(rows[0]);
}

async function getOrCreateConversation(userId: string, workspaceId: string, fileId: string, mode: LegalEditorMode) {
  const title = mode === "CHAT" ? "Editor Chat" : "Editor Drafting";
  const rows = await db.$queryRaw<ConversationRow[]>`
    INSERT INTO "chat_conversations" (
      "user_id",
      "title",
      "source",
      "workspace_id",
      "file_id",
      "mode",
      "thread_kind",
      "created_at",
      "updated_at"
    )
    VALUES (
      ${userId}::uuid,
      ${title},
      'LEGAL_EDITOR',
      ${workspaceId}::uuid,
      ${fileId}::uuid,
      ${mode},
      'DEFAULT',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("user_id", "source", "workspace_id", "file_id", "mode", "thread_kind")
    WHERE "source" = 'LEGAL_EDITOR'
      AND "thread_kind" = 'DEFAULT'
      AND "workspace_id" IS NOT NULL
      AND "file_id" IS NOT NULL
      AND "mode" IS NOT NULL
    DO UPDATE SET "updated_at" = "chat_conversations"."updated_at"
    RETURNING
      "id",
      "mode" AS "mode",
      "title",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt";
  `;

  const conversation = rows[0];
  if (!conversation) throw new Error("Failed to load legal editor conversation");

  const messages = await db.$queryRaw<ConversationRow["messages"]>`
    SELECT
      "id",
      "role"::text AS "role",
      "content",
      "created_at" AS "createdAt"
    FROM "chat_messages"
    WHERE "conversation_id" = ${conversation.id}::uuid
    ORDER BY "created_at" ASC;
  `;

  return { ...conversation, messages };
}

function serializeConversation(conversation: any) {
  return {
    id: conversation.id,
    mode: conversation.mode,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: (conversation.messages || []).map((message: any) => ({
      id: message.id,
      role: String(message.role).toLowerCase(),
      content: message.content,
      createdAt: message.createdAt,
      canApplyToDocument: conversation.mode === "DOCUMENT" && String(message.role) === "ASSISTANT",
    })),
  };
}

async function getLegalEditorConversationsController(request: NextAuthRequest) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const workspaceId = (request.nextUrl.searchParams.get("workspaceId") || "").trim();
    const fileId = (request.nextUrl.searchParams.get("fileId") || "").trim();

    if (!workspaceId || !fileId) {
      return NextResponse.json({ error: "workspaceId and fileId are required" }, { status: 400 });
    }

    await assertWorkspaceAccessAllowed(user.id, workspaceId);
    const hasAccess = await assertContext(user.id, workspaceId, fileId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Workspace file not found" }, { status: 404 });
    }

    const chat = await getOrCreateConversation(user.id, workspaceId, fileId, "CHAT");
    const document = await getOrCreateConversation(user.id, workspaceId, fileId, "DOCUMENT");

    return NextResponse.json({
      conversations: {
        chat: serializeConversation(chat),
        document: serializeConversation(document),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = auth(getLegalEditorConversationsController);

async function clearLegalEditorConversationController(request: NextAuthRequest) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const workspaceId = (request.nextUrl.searchParams.get("workspaceId") || "").trim();
    const fileId = (request.nextUrl.searchParams.get("fileId") || "").trim();
    const mode = (request.nextUrl.searchParams.get("mode") || "").trim().toUpperCase();

    if (!workspaceId || !fileId || (mode !== "CHAT" && mode !== "DOCUMENT")) {
      return NextResponse.json({ error: "workspaceId, fileId, and mode are required" }, { status: 400 });
    }

    await assertWorkspaceAccessAllowed(user.id, workspaceId);
    const hasAccess = await assertContext(user.id, workspaceId, fileId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Workspace file not found" }, { status: 404 });
    }

    const conversationRows = await db.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "chat_conversations"
      WHERE "user_id" = ${user.id}::uuid
        AND "source" = 'LEGAL_EDITOR'
        AND "workspace_id" = ${workspaceId}::uuid
        AND "file_id" = ${fileId}::uuid
        AND "mode" = ${mode}
        AND "thread_kind" = 'DEFAULT'
        AND "is_archived" = false
      LIMIT 1;
    `;
    const conversation = conversationRows[0];

    if (!conversation) {
      return NextResponse.json({ success: true, deletedCount: 0 });
    }

    const result = await (db as any).chatMessage.deleteMany({
      where: { conversationId: conversation.id },
    });

    await (db as any).chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, deletedCount: result.count ?? 0 });
  } catch (error) {
    return handleError(error);
  }
}

export const DELETE = auth(clearLegalEditorConversationController);

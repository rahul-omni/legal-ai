import { db } from "@/app/api/lib/db";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { assertWorkspaceAccessAllowed } from "@/app/api/lib/subscriptionLimits";
import { fileSystemNodeService } from "@/app/api/services/fileSystemNodeService";
import { userFromSession } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { ensureAssistantChatTables } from "../../_lib/chatTables";
import { assertAiUsageAllowed, estimateTokens, recordAiUsage } from "../../_lib/aiUsage";

type LegalEditorMode = "CHAT" | "DOCUMENT";

const OFF_TOPIC_MESSAGE =
  "I didn’t understand that, or it isn’t related to legal work or your document. Nothing was added to the document. Please ask something about this document, drafting, contracts, notices, procedure, or Indian law.";

function isDraftLikeRequest(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return (
    /\bdraft\b/.test(p) ||
    (/\b(drafting|prepare|prepare a|make a|create a)\b/.test(p) &&
      /\b(application|petition|affidavit|complaint|bail|anticipatory|quash|discharge|revision|appeal)\b/.test(p))
  );
}

function bnssDraftingInstruction() {
  return `BNSS drafting standard (India) — when the user asks for a "draft":

- Produce a court-ready draft in a conventional Indian pleading format aligned with the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) terminology.
- Use structured headings and numbering. Prefer clear, formal language.
- Always include placeholders for missing Court/Forum, Case/FIR/Crime No., Police Station, Sections/Offences, Parties, Jurisdiction/Place.
- Output must be suitable to directly insert into a rich-text editor (HTML).`;
}

async function classifyLegalRelevance(prompt: string, hasDocumentContext: boolean) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You classify user messages for "Vakeel Assist", a legal document editor.

Return a JSON object ONLY: {"relevant": true} or {"relevant": false}.

Set relevant to TRUE when the user is clearly asking about the open document, legal drafting, reviewing, Indian law, courts, procedure, contracts, notices, pleadings, affidavits, compliance, or legal business work.
Set relevant to FALSE for gibberish, empty input, or clearly off-topic chit-chat.
If unsure but plausibly legal/document work, prefer TRUE.`,
      },
      {
        role: "user",
        content: `User message:\n"""${prompt.slice(0, 8000)}"""\n\nDocument or excerpt included in request: ${hasDocumentContext ? "yes" : "no"}`,
      },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return true;
  try {
    return Boolean((JSON.parse(raw) as { relevant?: boolean }).relevant);
  } catch {
    return true;
  }
}

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

async function findConversation(userId: string, workspaceId: string, fileId: string, mode: LegalEditorMode) {
  const rows = await db.$queryRaw<{ id: string; mode: string; title: string }[]>`
    SELECT
      "id",
      "mode",
      "title"
    FROM "chat_conversations"
    WHERE "user_id" = ${userId}::uuid
      AND "source" = 'LEGAL_EDITOR'
      AND "workspace_id" = ${workspaceId}::uuid
      AND "file_id" = ${fileId}::uuid
      AND "mode" = ${mode}
      AND "thread_kind" = 'DEFAULT'
      AND "is_archived" = false
    LIMIT 1;
  `;

  return rows[0] ?? null;
}

export const POST = auth(async (request: NextAuthRequest) => {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const body = (await request.json()) as {
      workspaceId?: string;
      fileId?: string;
      mode?: string;
      prompt?: string;
      text?: string;
      files?: string[];
    };

    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
    const fileId = typeof body.fileId === "string" ? body.fileId : "";
    const mode: LegalEditorMode = body.mode === "DOCUMENT" || body.mode === "document" ? "DOCUMENT" : "CHAT";
    const promptText = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!workspaceId || !fileId) {
      return NextResponse.json({ error: "workspaceId and fileId are required" }, { status: 400 });
    }
    if (!promptText) {
      return NextResponse.json({ relevant: false, message: OFF_TOPIC_MESSAGE }, { status: 200 });
    }

    await assertWorkspaceAccessAllowed(user.id, workspaceId);
    const hasAccess = await assertContext(user.id, workspaceId, fileId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Workspace file not found" }, { status: 404 });
    }

    const conversation = await findConversation(user.id, workspaceId, fileId, mode);
    if (!conversation) {
      return NextResponse.json({ error: "Legal editor conversation not found" }, { status: 404 });
    }

    const files = Array.isArray(body.files) ? body.files : [];
    const attachedText = files.length ? await fileSystemNodeService.getConcatenatedContentByIds(files) : "";
    const documentText = typeof body.text === "string" ? body.text : "";
    const userContent = attachedText
      ? `${promptText}:\n\n${attachedText}`
      : documentText.trim()
        ? `${promptText}\n\n--- Current open document (HTML from the editor). Use this as the basis when the user asks to draft, revise, summarize, or edit "this document". ---\n${documentText}`
        : promptText;

    const relevant = await classifyLegalRelevance(promptText, Boolean(documentText.trim() || attachedText.trim()));
    if (!relevant) {
      await (db as any).chatMessage.create({
        data: { conversationId: conversation.id, role: "USER", content: promptText },
      });
      await (db as any).chatMessage.create({
        data: { conversationId: conversation.id, role: "ASSISTANT", content: OFF_TOPIC_MESSAGE },
      });
      return NextResponse.json({ relevant: false, message: OFF_TOPIC_MESSAGE }, { status: 200 });
    }

    const historyMessages = await (db as any).chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 24,
      select: { role: true, content: true },
    });

    const sanitizedHistory = historyMessages
      .map((message: any) => ({
        role: String(message.role).toLowerCase(),
        content: String(message.content || "").slice(0, 30_000),
      }))
      .filter((message: { role: string; content: string }) => (message.role === "user" || message.role === "assistant") && Boolean(message.content)) as {
      role: "user" | "assistant";
      content: string;
    }[];

    await (db as any).chatMessage.create({
      data: { conversationId: conversation.id, role: "USER", content: promptText },
    });

    const systemChat = `You are a legal assistant in Vakeel Assist. The user is in Chat mode inside Legal Editor: answer questions about the open document, selected excerpt, or legal issue. Do not output a full replacement draft unless explicitly asked. Use light HTML only when useful.`;
    const systemDocument = `You are a legal document assistant for Vakeel Assist. The user is in Editor mode: output may be previewed and applied into the legal editor. Use HTML suitable for a rich-text editor.`;
    const system = mode === "DOCUMENT" && isDraftLikeRequest(promptText)
      ? `${systemDocument}\n\n${bnssDraftingInstruction()}`
      : mode === "DOCUMENT"
        ? systemDocument
        : systemChat;

    const openaiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: system },
      ...sanitizedHistory,
      { role: "user", content: userContent },
    ];

    const inputTokens = estimateTokens(openaiMessages.map((message) => message.content).join("\n"));
    const usageReservation = await assertAiUsageAllowed(user.id, inputTokens);
    const model = "gpt-4o";
    const stream = await openai.chat.completions.create({
      model,
      messages: openaiMessages,
      stream: true,
      temperature: mode === "DOCUMENT" ? 0.7 : 0.6,
    });

    const encoder = new TextEncoder();
    let assistantFull = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              assistantFull += content;
              controller.enqueue(encoder.encode(content));
            }
          }
          await (db as any).chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: "ASSISTANT",
              content: assistantFull.trim() || "(No response generated)",
            },
          });
          await (db as any).chatConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });
          await recordAiUsage({
            userId: user.id,
            subscriptionId: usageReservation.subscriptionId,
            feature: mode === "DOCUMENT" ? "LEGAL_EDITOR_DOCUMENT" : "LEGAL_EDITOR_CHAT",
            model,
            inputTokens,
            outputTokens: estimateTokens(assistantFull),
            metadata: { conversationId: conversation.id, workspaceId, fileId, mode },
          });
          controller.close();
        } catch (streamError) {
          controller.error(streamError);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ error: message }, { status });
  }
});

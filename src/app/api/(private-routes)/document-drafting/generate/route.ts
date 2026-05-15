import {
  getDraftTemplateById,
  renderDraftFromTemplate,
} from "@/lib/document-drafting/templates";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { assertDocumentDraftingAllowed } from "@/app/api/lib/subscriptionLimits";
import { userFromSession } from "@/lib/auth";
import { ensureAiUsageTables, recordAiUsage } from "../../assistant/_lib/aiUsage";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

async function postController(request: NextAuthRequest) {
  try {
    const user = await userFromSession(request);
    const body = (await request.json()) as {
      templateId?: string;
      fields?: Record<string, string>;
    };
    const templateId = typeof body.templateId === "string" ? body.templateId : "";
    const fields =
      body.fields && typeof body.fields === "object" && !Array.isArray(body.fields)
        ? body.fields
        : null;

    if (!templateId) {
      return NextResponse.json({ error: "Template is required" }, { status: 400 });
    }

    if (!fields || Object.keys(fields).length === 0) {
      return NextResponse.json(
        { error: "At least one input field is required" },
        { status: 400 }
      );
    }

    const template = getDraftTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Invalid template selected" }, { status: 400 });
    }

    await ensureAiUsageTables();
    const usageReservation = await assertDocumentDraftingAllowed(user.id);
    const { html } = renderDraftFromTemplate(template, fields);
    await recordAiUsage({
      userId: user.id,
      subscriptionId: usageReservation.subscriptionId,
      feature: "DOCUMENT_DRAFTING",
      model: "template",
      inputTokens: 0,
      outputTokens: 0,
      metadata: {
        templateId,
        fieldCount: Object.keys(fields).length,
      },
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An error occurred";
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export const POST = auth(postController);

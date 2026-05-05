import {
  getDraftTemplateById,
  renderDraftFromTemplate,
} from "@/lib/document-drafting/templates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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

    const { html } = renderDraftFromTemplate(template, fields);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { fileSystemNodeService } from "../../services/fileSystemNodeService";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OFF_TOPIC_MESSAGE =
  "I didn’t understand that, or it isn’t related to legal work or your document. Nothing was added to the document. Please ask something about this document, drafting, contracts, notices, procedure, or Indian law.";

function isDraftLikeRequest(prompt: string): boolean {
  const p = prompt.toLowerCase();
  // "Draft" can also mean contract drafts; keep the heuristic broad but still intent-focused.
  // We treat these as "drafting requests" that should return a properly formatted legal draft.
  return (
    /\bdraft\b/.test(p) ||
    /\b(drafting|prepare|prepare a|make a|create a)\b/.test(p) &&
      /\b(application|petition|affidavit|complaint|bail|anticipatory|quash|discharge|revision|appeal)\b/.test(p)
  );
}

function bnssDraftingInstruction(): string {
  return `BNSS drafting standard (India) — when the user asks for a "draft":

- Produce a court-ready draft in a conventional Indian pleading format aligned with the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) terminology.
- Use structured headings and numbering. Prefer clear, formal language.
- Always include (use placeholders if missing): Court/Forum, Case/FIR/Crime No., Police Station, Sections/Offences, Parties (Applicant/Accused, State/Complainant), Jurisdiction/Place.
- Suggested structure (use <h2>/<h3>/<p>/<ol>/<ul>):
  1) Cause Title (IN THE COURT OF …; case number; parties)
  2) Application/Petition Title (e.g., "Application for Bail under BNSS …")
  3) Most Respectfully Showeth / Brief Facts
  4) Grounds (numbered)
  5) Prayer/Reliefs (clearly enumerated)
  6) Interim Prayer (if requested/appropriate)
  7) Verification
  8) Place/Date; Advocate details (placeholders)
  9) List of Annexures (if any are referenced)

- If the open document already contains facts/parties/sections, use them consistently and do not invent new ones.
- If critical inputs are missing, keep the draft usable by inserting explicit placeholders like "[FIR No. ___]" and "[Police Station ___]" instead of guessing.
- Output must be suitable to directly insert into a rich-text editor (HTML).`;
}

async function classifyLegalRelevance(prompt: string, hasDocumentContext: boolean): Promise<boolean> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You classify user messages for "Vakeel Assist", a legal document editor.

Return a JSON object ONLY: {"relevant": true} or {"relevant": false}.

Set relevant to TRUE when the user is clearly asking for something related to:
- The open document, editing, drafting, reviewing, or summarizing legal text
- Contracts, agreements, notices, pleadings, affidavits, compliance, corporate/legal business
- Indian law, courts, procedure, citations, legal research, or definitions in a legal context
- Short but meaningful legal questions (even one sentence)

Set relevant to FALSE for:
- Random keyboard mashing, gibberish, or meaningless character strings
- Clearly off-topic chit-chat (recipes, sports, coding tutorials, general trivia) with no legal angle
- Empty or nonsense input

If unsure but the message could plausibly be legal/document work, prefer TRUE.
If the message is obvious noise or clearly not legal/document-related, use FALSE.`,
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
    const parsed = JSON.parse(raw) as { relevant?: boolean };
    return Boolean(parsed.relevant);
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { text, prompt, files: filesRaw, mode: modeRaw } = body as {
      text?: string;
      prompt?: string;
      files?: string[];
      /** "chat" = Q&A only; "document" = output intended for Apply / editor insertion */
      mode?: string;
    };
    const files = Array.isArray(filesRaw) ? filesRaw : [];
    const promptText = typeof prompt === "string" ? prompt : "";
    const assistantMode = modeRaw === "document" ? "document" : "chat";

    if (!promptText.trim()) {
      return NextResponse.json(
        { relevant: false, message: OFF_TOPIC_MESSAGE },
        { status: 200 }
      );
    }

    const newText = files.length ? await fileSystemNodeService.getConcatenatedContentByIds(files) : "";
    const textStr = typeof text === "string" ? text : "";
    const userContent = files.length
      ? `${promptText}:\n\n${newText}`
      : textStr.trim()
        ? `${promptText}\n\n--- Current open document (HTML from the editor). Use this as the basis when the user asks to draft, revise, summarize, or edit "this document". ---\n${textStr}`
        : promptText;

    const hasDocumentContext = Boolean(textStr.trim().length > 0 || files.length > 0);

    const relevant = await classifyLegalRelevance(promptText, hasDocumentContext);
    if (!relevant) {
      return NextResponse.json(
        { relevant: false, message: OFF_TOPIC_MESSAGE },
        { status: 200 }
      );
    }

    const systemChat = `You are a legal assistant in Vakeel Assist. The user is in **Chat mode**: they want answers and explanations about their open document, not a full replacement draft in the editor.

When the user message includes "Current open document (HTML from the editor)", that HTML is the file they have open—use it to answer questions (e.g. who are the parties, what does clause X mean, summarize risks). Be concise. Use light HTML (<p>, <ul>, <strong>) only when it helps readability.

Do NOT tell the user to "apply changes", "paste into the document", or imply they must insert your reply into the file. Do NOT output a full rewritten contract or lengthy replacement document unless they clearly ask to rewrite or replace the whole document.`;

    const systemDocument = `You are a legal document assistant for Vakeel Assist. The user is in **Document mode**: output may be applied to the end of their editor.

When the user message includes "Current open document (HTML from the editor)", that HTML is the file they have open—use it to draft, rewrite, expand, or produce insertable text. Do not ask them to paste the document again unless it is clearly empty. When producing document text, use HTML (e.g. <p>, <h2>, <ul>) suitable for a rich-text editor.`;

    const systemDocumentWithDrafting = isDraftLikeRequest(promptText)
      ? `${systemDocument}\n\n${bnssDraftingInstruction()}`
      : systemDocument;

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: assistantMode === "document" ? systemDocumentWithDrafting : systemChat,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      stream: true,
      temperature: 0.7,
    });

    // Create a TransformStream for streaming the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Assistant-Relevant": "true",
      },
    });
  } catch (error: any) {
    return new Response(error.message || "An error occurred", { status: 500 });
  }
}

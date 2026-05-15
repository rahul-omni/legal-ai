import { marked } from "marked";
import TurndownService from "turndown";
import { openai } from "@/lib/openai";
import { translateWithSarvam } from "@/lib/translation/sarvamTranslator";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { assertAiUsageAllowed, estimateTokens, recordAiUsage } from "../assistant/_lib/aiUsage";

function chunkMarkdownByParagraphs(
  markdown: string,
  maxCharsPerChunk = 1000
): string[] {
  const paragraphs = markdown.split(/\n\s*\n/);
  const chunks: string[] = [];

  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length > maxCharsPerChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += "\n\n" + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export const POST = auth(async (req: NextAuthRequest) => {
  try {
    const user = await userFromSession(req);
    const { vendor, sourceText, targetLanguage, mode = "formal" } =
      await req.json();

    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(sourceText);
    const chunks = chunkMarkdownByParagraphs(markdown, 1000);
    const model = vendor === "sarvam" ? "sarvam:mayura:v1" : "gpt-4o";
    const inputTokens = estimateTokens(
      [
        `Translate to ${targetLanguage} in a ${mode} tone. Preserve markdown.`,
        markdown,
      ].join("\n")
    );
    const usageReservation = await assertAiUsageAllowed(user.id, inputTokens);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let translatedOutput = "";
        for (const chunk of chunks) {
          let translated = "";

          if (vendor === "sarvam") {
            translated = await translateWithSarvam(chunk, targetLanguage);
          } else {
            const completion = await openai.chat.completions.create({
              messages: [
                {
                  role: "system",
                  content: `You are a translator. Translate to ${targetLanguage} in a ${mode} tone. Preserve markdown.`,
                },
                { role: "user", content: chunk },
              ],
              model: "gpt-4o",
            });

            translated = completion.choices[0].message.content || "";
          }
          translatedOutput += `\n\n${translated}`;
          const html = marked(translated || "");
          controller.enqueue(encoder.encode(html + "\n\n")); // send it immediately
        }

        await recordAiUsage({
          userId: user.id,
          subscriptionId: usageReservation.subscriptionId,
          feature: "TRANSLATION",
          model,
          inputTokens,
          outputTokens: estimateTokens(translatedOutput),
          metadata: {
            vendor,
            targetLanguage,
            mode,
            chunkCount: chunks.length,
          },
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Streaming translation error:", error);
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "Translation failed";
    return new Response(message, { status });
  }
});





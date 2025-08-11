import { marked } from "marked";
import TurndownService from "turndown";
import { openai } from "@/lib/openai";
import { translateWithSarvam } from "@/lib/translation/sarvamTranslator";

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

export async function POST(req: Request) {
  try {
    const { vendor, sourceText, targetLanguage, mode = "formal" } =
      await req.json();

    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(sourceText);
    const chunks = chunkMarkdownByParagraphs(markdown, 1000);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
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
          const html = marked(translated || "");
          controller.enqueue(encoder.encode(html + "\n\n")); // send it immediately
        }

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
    return new Response("Translation failed", { status: 500 });
  }
}





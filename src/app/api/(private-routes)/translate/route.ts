import { openai } from "@/lib/openai";
import { translateWithSarvam } from "@/lib/translation/sarvamTranslator";
import { TranslationOptions } from "@/lib/translation/types";
import { NextResponse } from "next/server";
import { handleError } from "../../lib/errors";
import TurndownService from 'turndown';
import { marked } from 'marked';

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
    const body = await req.json();

    const {
      vendor,
      sourceText,
      targetLanguage,
      mode = "formal",
    } = body as TranslationOptions;

    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(sourceText);

    // 🔹 Break large markdown into safe-size chunks
    const markdownChunks = chunkMarkdownByParagraphs(markdown, 1000); // ~1k char per chunk

    const translatedChunks: string[] = [];

    for (const chunk of markdownChunks) {
      if (vendor === "sarvam") {
        const translated = await translateWithSarvam(chunk, targetLanguage);
        translatedChunks.push(translated);
      } else {
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following text to ${targetLanguage} in a ${mode} tone. Preserve markdown formatting.`,
            },
            {
              role: "user",
              content: chunk,
            },
          ],
          model: "gpt-3.5-turbo",
        });

        translatedChunks.push(completion.choices[0].message.content || "");
      }
    }

    const finalTranslatedMarkdown = translatedChunks.join("\n\n");
    const translatedHtml = marked(finalTranslatedMarkdown);

    return NextResponse.json({ translation: translatedHtml });
  } catch (error) {
    return handleError(error);
  }
}


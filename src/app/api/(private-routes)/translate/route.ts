import { openai } from "@/lib/openai";
import { translateWithSarvam } from "@/lib/translation/sarvamTranslator";
import { TranslationOptions } from "@/lib/translation/types";
import { NextResponse } from "next/server";
import { handleError } from "../../lib/errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      vendor,
      sourceText,
      targetLanguage,
      mode = "formal",
    } = body as TranslationOptions;

    let translatedText: string;

    if (vendor === "sarvam") {
      translatedText = await translateWithSarvam(sourceText, targetLanguage);
    } else {
      // OpenAI translation
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a translator. Translate the following text to ${targetLanguage}. Maintain the original formatting.`,
          },
          {
            role: "user",
            content: sourceText,
          },
        ],
        model: "gpt-3.5-turbo",
      });

      translatedText = completion.choices[0].message.content || "";
    }

    return NextResponse.json({ translation: translatedText });
  } catch (error) {
    return handleError(error);
  }
}

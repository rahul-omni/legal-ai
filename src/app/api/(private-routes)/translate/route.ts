import { NextResponse } from 'next/server';
import { translateWithSarvam } from '@/lib/translation/sarvamTranslator';
import { openai } from '@/lib/openai';
import { TranslationOptions } from '@/lib/translation/types';

export async function POST(req: Request) {
  try {
    const { vendor, sourceText, targetLanguage, mode = 'formal' } = await req.json() as TranslationOptions;

    let translatedText: string;

    if (vendor === 'sarvam') {
      translatedText = await translateWithSarvam(sourceText, targetLanguage);
    } else {
      // OpenAI translation
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a translator. Translate the following text to ${targetLanguage}. Maintain the original formatting.`
          },
          {
            role: "user",
            content: sourceText
          }
        ],
        model: "gpt-3.5-turbo",
      });

      translatedText = completion.choices[0].message.content || '';
    }

    return NextResponse.json({ translation: translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
} 
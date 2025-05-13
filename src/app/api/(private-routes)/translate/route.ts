import { NextResponse } from 'next/server';
import { translateWithSarvam } from '@/lib/translation/sarvamTranslator';
import { openai } from '@/lib/openai';
import { TranslationOptions } from '@/lib/translation/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[Translate API] Request body:', body);

    const { vendor, sourceText, targetLanguage, mode = 'formal' } = body as TranslationOptions;

    let translatedText: string;

    if (vendor === 'sarvam') {
      console.log('[Translate API] Using Sarvam translator');
      translatedText = await translateWithSarvam(sourceText, targetLanguage);
      console.log('[Translate API] Sarvam translation result:', translatedText);
    } else {
      // OpenAI translation
      console.log('[Translate API] Using OpenAI translator');
      console.log('[Translate API] Target language:', targetLanguage);
      console.log('[Translate API] Source text:', sourceText);
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
      console.log('[Translate API] OpenAI translation result:', translatedText);
    }

    return NextResponse.json({ translation: translatedText });
  } catch (error) {
    console.error('[Translate API] Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
} 
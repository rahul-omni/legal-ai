import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { openai } from '@/lib/openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST: Receives base64 image and returns translated HTML
export async function POST(request: Request) {
  console.log('[API] POST request received');

  try {
    const body = await request.json();

    const { base64Image, mimeType} = body;

    if (!base64Image || !mimeType) {
      return NextResponse.json(
        { error: 'Missing image data or MIME type' },
        { status: 400 }
      );
    }

    console.log('[API] Sending image to OpenAI gpt-4o...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract the text from the image. Preserve formatting and return rich HTML only.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const rawHtml = completion.choices[0]?.message?.content || '';
    const cleanedHtml = rawHtml.replace(/```html|```/g, '').trim();

    console.log('[API] Translation complete.');
    return NextResponse.json({ html: `<div>${cleanedHtml}</div>` });

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

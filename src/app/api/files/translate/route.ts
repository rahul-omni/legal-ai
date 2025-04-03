import { NextResponse } from 'next/server';
import { FileService } from '@/lib/fileService';

export async function POST(req: Request) {
  try {
    const { content, language } = await req.json();
    const translated = await FileService.translateContent(content, language);
    return NextResponse.json({ translated });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate content' },
      { status: 500 }
    );
  }
} 
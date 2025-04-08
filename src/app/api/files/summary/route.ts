import { NextResponse } from 'next/server';
import { FileService } from '@/lib/fileService';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const summary = await FileService.generateSummary(content);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 
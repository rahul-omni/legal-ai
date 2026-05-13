import { NextResponse } from 'next/server';
import pdf2md from '@opendocsg/pdf2md';

// Configure the runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Simple GET handler to test the route
export async function GET() {
  console.log('[API] GET request received');
  return NextResponse.json({ message: "PDF API working" });
}

// Start with a basic POST handler
export async function POST(request: Request) {
  console.log('[API] POST request received');
  try {
    const body = await request.json();
    
    if (!body.base64PDF) {
      return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
    }

    console.log('[API] Converting base64 to buffer...');
    const base64PDF =
      typeof body.base64PDF === 'string'
        ? body.base64PDF.replace(/^data:application\/pdf;base64,/, '')
        : '';
    const dataBuffer = Buffer.from(base64PDF, 'base64');
    console.log('[API] Buffer size:', dataBuffer.length);
    
    console.log('[API] Starting PDF parsing...');
    const markdown = await pdf2md(dataBuffer, {});
    console.log('[API] PDF converted to markdown successfully');
    
    return NextResponse.json({
      text: markdown,
    });

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ 
      error: "Failed to parse PDF: " + (error as Error).message 
    }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';

// Configure the runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Dynamic import for pdf-parse
async function parsePDF(buffer: Buffer) {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    return await pdfParse(buffer);
  } catch (error) {
    console.error('[PDF Parse Error]:', error);
    throw error;
  }
}

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
    const dataBuffer = Buffer.from(body.base64PDF, 'base64');
    console.log('[API] Buffer size:', dataBuffer.length);
    
    console.log('[API] Starting PDF parsing...');
    // Import and use pdf-parse in one step
    const data = await (await import('pdf-parse')).default(dataBuffer);
    console.log('[API] PDF parsed successfully');
    
    return NextResponse.json({
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata
      }
    });

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ 
      error: "Failed to parse PDF: " + (error as Error).message 
    }, { status: 500 });
  }
}


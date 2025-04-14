import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await request.json();
    
    const document = await prisma.document.update({
      where: { id: params.id },
      data: { content }
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to update document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
} 
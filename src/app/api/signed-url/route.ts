import { NextRequest, NextResponse } from "next/server";
import { Storage } from '@google-cloud/storage';

export async function POST(request: NextRequest) {
  try {
    const { filePath, bucketName, expirationMinutes = 30 } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Initialize Google Cloud Storage with environment variables
    const storage = new Storage({
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON 
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
        : undefined,
    });

    const bucket = storage.bucket(bucketName || process.env.HIGH_COURT_PDF_BUCKET!);
    const file = bucket.file(filePath);

    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + (expirationMinutes * 60 * 1000),
    });

    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
} 
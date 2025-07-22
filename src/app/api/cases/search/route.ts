
 
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
 
import { z } from "zod";
 
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const searchSchema = z.object({
  diaryNumber: z.string().min(1, "Diary number is required"),
  year: z.string().length(4, "Year must be 4 digits"),
  court: z.string().optional().default("Supreme Court"),
  judgmentType: z.string().optional(),
  caseType: z.string().optional()
});

export async function GET(request: NextAuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      diaryNumber: searchParams.get('diaryNumber'),
      year: searchParams.get('year'),
      court: searchParams.get('court') ? decodeURIComponent(searchParams.get('court')!) : undefined,
      judgmentType: searchParams.get('judgmentType') || '',
      caseType: searchParams.get('caseType') || ''
    };
    
    const validated = searchSchema.parse(queryParams);
    
    const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;

    // Build where conditions dynamically
    const whereConditions: any = {
        diaryNumber: {
          equals: fullDiaryNumber,
          mode: 'insensitive'
        },
        court: {
          contains: validated.court,
          mode: 'insensitive'
        }
    };

    // Only add judgmentType filter if it has a value
    if (validated.judgmentType && validated.judgmentType.trim() !== '') {
      whereConditions.judgmentType = {
        contains: validated.judgmentType,
        mode: 'insensitive'
      };
    }

    // Only add caseType filter if it has a value
    if (validated.caseType && validated.caseType.trim() !== '') {
      whereConditions.caseType = {
        contains: validated.caseType,
        mode: 'insensitive'
      };
    }

    const caseData = await prisma.caseManagement.findMany({
      where: whereConditions
    });

    if (caseData.length === 0) {  // Check if array is empty
      return NextResponse.json(
        { 
          success: false,
          message: 'No matching cases found',
          searchedParams: {
            diaryNumber: fullDiaryNumber,
            court: validated.court
          }
        }, 
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Case found successfully',
      data: caseData
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          message: "Validation failed",
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    console.error("Search error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error" 
      },
      { status: 500 }
    );
  }
}
 

import { auth } from "@/app/api/[...nextauth]/route";
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
 
const createUserCasesSchema = z.object({
  diaryNumbers: z.array(z.string()).min(1, "At least one diary number is required")
});


export const POST = auth(async (request: NextAuthRequest) => {
  try {
    // Authentication
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse input - now only accepting diaryNumbers
    const body = await request.json();
    const { diaryNumbers } = body;
    
    if (!diaryNumbers || !Array.isArray(diaryNumbers) || diaryNumbers.length === 0) {
      return NextResponse.json(
        { success: false, message: "No diary numbers provided" },
        { status: 400 }
      );
    }

    // Check for existing diary numbers
    const existingUserCases = await prisma.userCase.findMany({
      where: {
        diaryNumber: { in: diaryNumbers }
      },
      select: {
        diaryNumber: true
      }
    });

    const existingDiaryNumbers = existingUserCases.map(uc => uc.diaryNumber);
    
    if (existingDiaryNumbers.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Some cases already exist",
        data: {
          duplicateDiaryNumbers: existingDiaryNumbers,
          duplicateCount: existingDiaryNumbers.length
        }
      }, { status: 409 });
    }

    // Create new user cases
    const createdCases = await prisma.$transaction(
      diaryNumbers.map(diaryNumber => 
        prisma.userCase.create({
          data: {
            userId: sessionUser.id,
            diaryNumber: diaryNumber,
            status: "PENDING"
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCases.length} cases`,
      data: {
        createdCases,
        createdCount: createdCases.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error in POST /api/cases/user-cases:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});
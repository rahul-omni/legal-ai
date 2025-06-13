 
 
import { userFromSession } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../lib/auth/nextAuthConfig";

const prisma = new PrismaClient();
 
const createUserCaseSchema = z.object({
  diaryNumber: z.string().min(1, "Diary number is required")
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

    // Parse input - now accepting single diaryNumber
    const body = await request.json();
    const { diaryNumber } = createUserCaseSchema.parse(body);
    
    if (!diaryNumber) {
      return NextResponse.json(
        { success: false, message: "Diary number is required" },
        { status: 400 }
      );
    }

    // Check for existing diary number
    const existingCase = await prisma.userCase.findFirst({
      where: {
        diaryNumber: diaryNumber,
        userId: sessionUser.id // Also check user ownership
      }
    });
    
    if (existingCase) {
      return NextResponse.json({
        success: false,
        message: "Case already exists",
        data: {
          duplicateDiaryNumber: diaryNumber
        }
      }, { status: 409 });
    }

    // Create new user case
    const createdCase = await prisma.userCase.create({
      data: {
        userId: sessionUser.id,
        diaryNumber: diaryNumber,
        status: "PENDING"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Successfully created case",
      data: {
        createdCase
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
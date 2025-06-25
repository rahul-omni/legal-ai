 
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { auth } from "../../lib/auth/nextAuthConfig";

const prisma = new PrismaClient();

export const GET = auth(async (request: NextAuthRequest) => {
  try {
    // Get the user from request
    const sessionUser = await userFromSession(request);
    
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract diaryNumber from query parameters
    const { searchParams } = new URL(request.url);
    const diaryNumber = searchParams.get('diaryNumber');

    if (!diaryNumber) {
      return NextResponse.json(
        { success: false, message: "Diary number is required" },
        { status: 400 }
      );
    }

    // Check if the diary number exists in userCase table for this user
    const userCase = await prisma.userCase.findFirst({
      where: {
        userId: sessionUser.id,
        diaryNumber: diaryNumber
      }
    });

    if (!userCase) {
      return NextResponse.json(
        { 
          success: false,
          message: 'You do not have access to this case or it does not exist'
        }, 
        { status: 403 }
      );
    }

    // Find the case in caseManagement table
    const caseData = await prisma.caseManagement.findMany({
      where: {
        diaryNumber: diaryNumber
      }
    });

    if (!caseData) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Case not found in case management system'
        }, 
        { status: 404 }
      );
    }
   //.log("[GET /api/cases/dairynumber] Case retrieved successfully:", caseData);
   
    return NextResponse.json({
      success: true,
      message: 'Case retrieved successfully',
      data: caseData
    });

  } catch (error) {
    console.error("Error fetching case:", error);
    return handleError(error);
  }
});
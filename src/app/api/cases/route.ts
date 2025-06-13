 // import { auth } from "@/app/api/[...nextauth]/route";
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
 
import { PrismaClient } from '@prisma/client';
import { auth } from "../lib/auth/nextAuthConfig";
 

  
const prisma = new PrismaClient();

export const  GET = auth(async     (  request: NextAuthRequest)  => {
  console.log("[GET /api/cases] Fetching user cases...");
  try {
   
    // Get the user from request
   const sessionUser = await userFromSession(request);
     
   if (!sessionUser?.id) {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
}

 
    // Get all diary numbers from user_cases for this user
    const userCases = await prisma.userCase.findMany({
      where: {
        userId:  sessionUser.id
      },
      select: {
        diaryNumber: true
      }
    });
     

    console.log("User cases found:", userCases);
    if (!userCases || userCases.length === 0) {
      return NextResponse.json(
        { 
          success: true,
          message: 'No cases found for this user',
          data: []
        }, 
        { status: 200 }
      );
    }

    // Extract just the diary numbers
    const diaryNumbers = userCases.map(uc => uc.diaryNumber);

    // Find all matching cases in caseManagement table
    const caseData = await prisma.caseManagement.findMany({
      where: {
        diaryNumber: {
          in: diaryNumbers
        }
      },
      orderBy: {
        diaryNumber: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User cases retrieved successfully',
      data: caseData,
      count: caseData.length
    });

  } catch (error) {
    console.error("Error fetching user cases:", error);
    return handleError(error);
  }
}
)
 
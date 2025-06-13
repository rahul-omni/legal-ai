 // import { auth } from "@/app/api/[...nextauth]/route";
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
 
import { PrismaClient } from '@prisma/client';
import { auth } from "@/app/api/[...nextauth]/route";

  
const prisma = new PrismaClient();

// export async function POST(request: Request) {
//   try {
//     // Parse the incoming JSON data
//     const jsonData = await request.json();
    
//     // Transform the data to match your Prisma model
//     const caseData = {
//       serialNumber: jsonData["Serial Number"] || '',
//       diaryNumber: jsonData["Diary Number"] || '', // Fixed typo from "Diary"
//       caseNumber: jsonData["Case Number"] || '',
//       parties: jsonData["Petitioner / Respondent"] || '',
//       advocates: jsonData["Petitioner/Respondent Advocate"] || '',
//       bench: jsonData["Bench"] || '',
//       judgmentBy: jsonData["Judgment By"] || '',
//       judgmentDate: jsonData["Judgment"]?.split(" ")[0] || '', // First part
//       judgmentText: jsonData["Judgment"]?.split(" ")[1] || '', // Second part
//       judgmentUrl: jsonData.judgmentLinks?.[0]?.url || '', // First URL only
//       court: "Supreme Court", // Hardcoded as per your requirement
//       // date, createdAt, updatedAt will be auto-filled
//     };

//     // Insert into database
//     const newCase = await prisma.caseManagement.create({
//       data: caseData
//     });
//     console.log('New case created:', newCase);
    
//     return NextResponse.json(newCase, { status: 201 });
//   } catch (error) {
//     console.error('Error creating case:', error);
//     return NextResponse.json(
//       { message: 'Error creating case record' },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
//  }
 



export const  GET = auth(async     (  request: NextAuthRequest)  => {
  console.log("[GET /api/cases] Fetching user cases...");
  try {
   
    // Get the user from request
   const sessionUser = await userFromSession(request);
    console.log("[GET /api/cases] Session user:", sessionUser.id);
    
   if (!sessionUser?.id) {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
}

console.log("SessionUser:", sessionUser.id);

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
 
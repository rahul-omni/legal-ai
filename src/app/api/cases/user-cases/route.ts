 
 
import { userFromSession } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../lib/auth/nextAuthConfig";

const prisma = new PrismaClient();
 
const createUserCaseSchema = z.object({
  selectedCases: z.array(z.object({
    id: z.string(),
    diaryNumber: z.string(),
    caseNumber: z.string().nullable().optional(),
    court: z.string(),
    case_type: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    parties: z.string().nullable().optional(),
    advocates: z.string().nullable().optional(),
    bench: z.string().nullable().optional(),
    judgmentBy: z.string().nullable().optional(),
    judgmentDate: z.string().nullable().optional()
  })).min(1, "Select at least one case")
});

export const POST = auth(async (request: NextAuthRequest) => {
  // try {
  //   // Authentication
  //   const sessionUser = await userFromSession(request);
  //   if (!sessionUser?.id) {
  //     return NextResponse.json(
  //       { success: false, message: "Unauthorized" },
  //       { status: 401 }
  //     );
  //   }

  //   // Parse input - now accepting array of complete case data
  //   const body = await request.json();
  //   const { selectedCases } = createUserCaseSchema.parse(body);
  //   console.log(selectedCases, "selectedCases");
    
  //   if (!selectedCases || selectedCases.length === 0) {
  //     return NextResponse.json(
  //       { success: false, message: "At least one case is required" },
  //       { status: 400 }
  //     );
  //   }

  //   const results = [];
  //   const errors = [];

  //   for (const caseData of selectedCases) {
  //     try {
  //       console.log(`Processing case: ${caseData.diaryNumber}`);
        
  //       // Check for existing diary number
  //       const existingCase = await prisma.userCase.findFirst({
  //         where: {
  //           diaryNumber: caseData.diaryNumber,
  //           userId: sessionUser.id
  //         }
  //       });
        
  //       if (existingCase) {
  //         console.log(`Duplicate case found: ${caseData.diaryNumber}`);
  //         errors.push(`Case with diary number ${caseData.diaryNumber} already exists`);
  //         continue;
  //       }

  //       console.log(`Creating UserCase for: ${caseData.diaryNumber}`);
  //       console.log(`Case data:`, {
  //         diaryNumber: caseData.diaryNumber,
  //         caseType: caseData.case_type,
  //         court: caseData.court,
  //         city: caseData.city,
  //         district: caseData.district
  //       });

  //       // Create new user case with data from selectedCases (no need to fetch from CaseManagement)
  //       const createdCase = await prisma.userCase.create({
  //         data: {
  //           userId: sessionUser.id,
  //           diaryNumber: caseData.diaryNumber,
  //           status: "PENDING",
  //           caseType: caseData.case_type || "",
  //           court: caseData.court || "",  // court is required in schema
  //           city: caseData.city || "",
  //           district: caseData.district || ""
  //         }
  //       });

  //       console.log(`Successfully created case: ${createdCase.id}`);
  //       results.push(createdCase);

  //     } catch (error) {
  //       console.error(`Detailed error for diary number ${caseData.diaryNumber}:`, {
  //         error: error,
  //         message: error instanceof Error ? error.message : 'Unknown error',
  //         stack: error instanceof Error ? error.stack : undefined,
  //         caseData: caseData
  //       });
  //       errors.push(`Failed to process diary number ${caseData.diaryNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     }
  //   }

  //   // Return response based on results
  //   if (results.length === 0) {
  //     return NextResponse.json({
  //       success: false,
  //       message: "No cases were created",
  //       errors: errors
  //     }, { status: 400 });
  //   }

  //   const responseMessage = results.length === selectedCases.length 
  //     ? `Successfully created ${results.length} case${results.length > 1 ? 's' : ''}`
  //     : `Created ${results.length} out of ${selectedCases.length} cases`;

  //   return NextResponse.json({
  //     success: true,
  //     message: responseMessage,
  //     data: {
  //       createdCases: results,
  //       errors: errors.length > 0 ? errors : undefined
  //     }
  //   }, { status: 201 });

  // } catch (error) {
  //   console.error("Error in POST /api/cases/user-cases:", error);
  //   return NextResponse.json(
  //     { 
  //       success: false, 
  //       message: "Internal server error", 
  //       error: error instanceof Error ? error.message : "Unknown error" 
  //     },
  //     { status: 500 }
  //   );
  // } finally {
  //   await prisma.$disconnect();
  // }

   try {
    // Authentication
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse input - now accepting array of complete case data
    const body = await request.json();
    const { selectedCases } = createUserCaseSchema.parse(body);
    console.log(selectedCases, "selectedCases");

    if (!selectedCases || selectedCases.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one case is required" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const caseData of selectedCases) {
      try {
        console.log(`Processing case: ${caseData.diaryNumber}`);

        // Check for existing diary number
        const existingCase = await prisma.userCase.findFirst({
          where: {
            diaryNumber: caseData.diaryNumber,
            userId: sessionUser.id
          }
        });

        if (existingCase) {
          console.log(`Duplicate case found: ${caseData.diaryNumber}`);
          errors.push(`Case with diary number ${caseData.diaryNumber} already exists`);
          continue;
        }

        console.log(`Creating UserCase for: ${caseData.diaryNumber}`);
        console.log(`Case data:`, {
          diaryNumber: caseData.diaryNumber,
          caseType: caseData.case_type,
          court: caseData.court,
          city: caseData.city,
          district: caseData.district
        });

        // Create new user case with data from selectedCases (no need to fetch from CaseManagement)
        const createdCase = await prisma.userCase.create({
          data: {
            userId: sessionUser.id,
            diaryNumber: caseData.diaryNumber,
            status: "PENDING",
            caseType: caseData.case_type || "",
            court: caseData.court || "",
            city: caseData.city || "",
            district: caseData.district || ""
          }
        });

        console.log(`Successfully created case: ${createdCase.id}`);
        results.push(createdCase);

      } catch (error) {
        console.error(`Detailed error for diary number ${caseData.diaryNumber}:`, {
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          caseData: caseData
        });
        errors.push(`Failed to process diary number ${caseData.diaryNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Return response based on results
    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No cases were created",
        errors: errors
      }, { status: 400 });
    }

    // If all cases were created (no errors), do not include errors in response
    if (results.length === selectedCases.length) {
      return NextResponse.json({
        success: true,
        message: `Successfully created ${results.length} case${results.length > 1 ? 's' : ''}`,
        data: {
          createdCases: results
        }
      }, { status: 201 });
    }

    
    // If some cases were not created, show errors
    return NextResponse.json({
      success: true,
      message: `Created ${results.length} out of ${selectedCases.length} cases`,
      data: {
        createdCases: results,
        errors: errors
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

 

 

    // If all cases were created (no errors), do


export const GET = auth(async (request: NextAuthRequest) => {
  try {
    // Authentication
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all diary numbers for this user
    const userCases = await prisma.userCase.findMany({
      where: {
        userId: sessionUser.id
      },
      select: {
        id:true,
        diaryNumber: true,
        createdAt: true,
        status: true,
        caseType: true,
        court: true,
        city: true,
        district: true
      },
      orderBy: {
        createdAt: 'asc' // Optional: order by creation date
      }
    });

    return NextResponse.json({
  success: true,
  message: userCases.length === 0 
    ? "No cases found for this user" 
    : "Successfully retrieved diary numbers",
  data: userCases
});

  } catch (error) {
    console.error("Error in GET /api/cases/user-cases:", error);
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
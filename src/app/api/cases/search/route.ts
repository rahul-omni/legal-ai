
 
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { DELHI_COURT_CASE_TYPES_VALUE_MAPPING } from "@/lib/constants";
 
import { z } from "zod";
 
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const searchSchema = z.object({
  diaryNumber: z.string().min(1, "Diary number is required"),
  year: z.string().length(4, "Year must be 4 digits"),
  court: z.string().optional().default("Supreme Court"),
  judgmentType: z.string().optional(),
  caseType: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional()
}).refine((data) => {
  // For High Court, caseType and city are required
  if (data.court === "High Court") {
    return data.caseType && data.caseType.trim() !== '' && 
           data.city && data.city.trim() !== '';
  }
  return true;
}, {
  message: "Case type and city are required for High Court cases",
  path: ["caseType", "city"]
});




export async function GET(request: NextAuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      diaryNumber: searchParams.get('diaryNumber'),
      year: searchParams.get('year'),
      court: searchParams.get('court') ? decodeURIComponent(searchParams.get('court')!) : undefined,
      judgmentType: searchParams.get('judgmentType') || '',
      caseType: searchParams.get('caseType') || '',
      city: searchParams.get('city') || '',
      district: searchParams.get('district') || ''
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
      whereConditions.judgment_type = {
        contains: validated.judgmentType,
        mode: 'insensitive'
      };
    }

    // Only add caseType filter if it has a value
    if (validated.caseType && validated.caseType.trim() !== '') {
      whereConditions.case_type = {
        contains: validated.caseType,
        mode: 'insensitive'
      };
    }

    if(validated.city && validated.city.trim() !== ''){
      whereConditions.city = {
        contains: validated.city,
        mode: 'insensitive'
      };
    }

    if(validated.district && validated.district.trim() !== ''){
      whereConditions.district = {
        contains: validated.district,
        mode: 'insensitive'
      };
    }

    let caseData = [];

    console.log(whereConditions, "whereConditions");
    

    caseData = await prisma.caseManagement.findMany({
      where: whereConditions
    });

    let scrapeResult = [];

    if (caseData.length === 0 && validated.court === "High Court") {
      const scrapeURL = process.env.SERVICE_URL + "/fetchHighCourtJudgments";
      
      // Ensure caseType exists before using it as index
      if (!validated.caseType || !DELHI_COURT_CASE_TYPES_VALUE_MAPPING[validated.caseType as keyof typeof DELHI_COURT_CASE_TYPES_VALUE_MAPPING]) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Invalid case type for High Court',
            searchedParams: {
              diaryNumber: fullDiaryNumber,
              court: validated.court,
              city: validated.city,
              district: validated.district,
              caseType: validated.caseType,
              judgmentType: validated.judgmentType
            }
          }, 
          { status: 400 }
        );
      }
      
      const payload = {
          highCourt: "High Court of Delhi",
          bench: "Principal Bench at Delhi",
          diaryNumber: fullDiaryNumber,
          caseTypeValue: DELHI_COURT_CASE_TYPES_VALUE_MAPPING[validated.caseType as keyof typeof DELHI_COURT_CASE_TYPES_VALUE_MAPPING].toString()
      }
      
      try {

        const response = await fetch(scrapeURL, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        scrapeResult = data?.result || [];
        
        // Re-fetch from database after scraping
        caseData = await prisma.caseManagement.findMany({
          where: whereConditions
        });
      } catch (err) {
        console.error("Error fetching High Court judgments:", err);
      }
    }

    if (caseData.length === 0 && scrapeResult.length === 0) {  // Check if array is empty
      return NextResponse.json(
        { 
          success: false,
          message: 'No matching cases found',
          searchedParams: {
            diaryNumber: fullDiaryNumber,
            court: validated.court,
            city: validated.city,
            district: validated.district,
            caseType: validated.caseType,
            judgmentType: validated.judgmentType
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
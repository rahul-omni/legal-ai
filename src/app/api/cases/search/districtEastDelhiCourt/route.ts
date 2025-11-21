import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient, Prisma } from '@prisma/client';
import { log } from "winston";

const prisma = new PrismaClient();

const searchSchema = z.object({
    diaryNumber: z.string().nullable(),
    year: z.string().nullable(),
    court: z.string().default("District Court"),
    caseType: z.string().optional(),
    district: z.string().optional(),
    courtComplex: z.string().optional(),
}).refine((data) => {
    // Both diaryNumber and year must be provided and non-empty
    return data.diaryNumber && data.diaryNumber.trim() !== "" &&
        data.year && data.year.trim() !== "";
}, {
    message: "Both diary number and year are required",
    path: ["diaryNumber", "year"]
});

export async function GET(request: NextAuthRequest) {
    try {
        let caseData: any[] = [];
        const { searchParams } = new URL(request.url);

        let queryParams = {
            diaryNumber: searchParams.get('diaryNumber')?.trim(),
            year: searchParams.get('year')?.trim(),
            court: searchParams.get('court')?.trim() || "",
            caseType: searchParams.get('caseType')?.trim() || "",
            district: searchParams.get('district')?.trim() || "",
            courtComplex: searchParams.get('courtComplex')?.trim() || "",
        };
      
        const validated = searchSchema.parse(queryParams);
        const fullDiaryNumber = validated.diaryNumber + "/" + validated.year;
        
        // Build where clause with required fields
        const whereClause: any = {
            diaryNumber: {
                equals: fullDiaryNumber,
                mode: Prisma.QueryMode.insensitive
            },
            district: {
                equals: validated.district,
                mode: Prisma.QueryMode.insensitive
            },
            courtComplex: {
                equals: validated.courtComplex,
                mode: Prisma.QueryMode.insensitive
            },
            court: {
                equals: validated.court,
                mode: Prisma.QueryMode.insensitive
            }
        };

        // Add case_type filter only if provided
        // if (validated.caseType && validated.caseType.trim() !== "") {
        //     whereClause.case_type = {
        //         contains: validated.caseType,
        //         mode: Prisma.QueryMode.insensitive
        //     };
        // }
        console.log("whereClause--",whereClause);
        // Check database first
        caseData = await prisma.caseManagement.findMany({
            where: whereClause
        });

        if (caseData.length > 0) {
            return NextResponse.json({
                success: true,
                message: `Found ${caseData.length} case(s) in database`,
                data: caseData,
                source: "database"
            });
        }

        // If not found, call scraper
        const scrapperURL = process.env.SERVICE_URL + "fetchEastDelhiDistrictJudgments";
        
        let payload = {
            diaryNumber: fullDiaryNumber,
            courtName: validated.district,
            courtComplex: validated.courtComplex,
            caseTypeValue: validated.caseType,
            court: validated.court
        };

        console.log("payload--",payload);
        

        const response = await fetch(scrapperURL, {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Wait for database update
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Re-check database with same filters
            caseData = await prisma.caseManagement.findMany({
                where: whereClause
            });
        }

        // Return results
        if (caseData.length === 0) {
            return NextResponse.json({
                success: false,
                message: `No cases found for diary number ${fullDiaryNumber} in  ${validated.district}. Please try again later.`,
                data: [],
                source: "none"
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Found ${caseData.length} case(s) via scraper`,
            data: caseData,
            source: "scraper"
        });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof z.ZodError
                    ? "Invalid request parameters"
                    : "Internal server error",
                error: error instanceof Error ? error.message : String(error)
            },
            { status: error instanceof z.ZodError ? 400 : 500 }
        );
    }
}














 
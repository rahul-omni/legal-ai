

import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();


const searchSchema = z.object({
    diaryNumber: z.string().nullable(),
    year: z.string().nullable(),
    court: z.string().default("Supreme Court"),
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
        const whereClause = {
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
            }, 
            case_type: {
                equals: validated.caseType,
                mode: Prisma.QueryMode.insensitive
            }
        }

        caseData = await prisma.caseManagement.findMany({
            where: whereClause
        });

        if(caseData.length > 0){
            return NextResponse.json({
                success: true,
                message: "Cases found",
                data: caseData
            });
        }

        const scrapperURL = process.env.SERVICE_URL + "fetchDistrictCourtJudgments";
        
        let payload = {
            diaryNumber: fullDiaryNumber,
            courtName: validated.district,
            courtComplex: validated.courtComplex,
            caseTypeValue: validated.caseType,
            court: validated.court
        }


        const response = await fetch(scrapperURL, {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(payload)
        });

        if(response.ok){
            caseData = await prisma.caseManagement.findMany({
                where: {
                    diaryNumber: {
                        equals: fullDiaryNumber,
                        mode: Prisma.QueryMode.insensitive
                    }
                }
            });
        }

        // Return results
        if (caseData.length === 0) {
            return NextResponse.json({
                success: false,
                message: `No cases found with the provided case number search parameters`,
                data: []
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Cases found",
            data: caseData
        });

    } catch (error) {
        console.error("Search error: End catch", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof z.ZodError
                    ? "Invalid request parameters"
                    : "Internal server error"
            },
            { status: error instanceof z.ZodError ? 400 : 500 }
        );
    }
}
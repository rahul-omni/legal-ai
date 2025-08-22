

import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from '@prisma/client';
import { getCaseNumber } from "@/helper/utils";

const prisma = new PrismaClient();

// Helper function to check if a string is non-empty
const isValidString = (str: string | null | undefined): boolean => {
    return str !== null && str !== undefined && str.trim() !== "";
};


const searchSchema = z.object({
    diaryNumber: z.string().nullable(),
    year: z.string().nullable(),
    court: z.string().default("Supreme Court"),
    caseType: z.string().optional(),
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
        console.log("Search params:", searchParams);

        let queryParams = {
            diaryNumber: searchParams.get('diaryNumber'),
            year: searchParams.get('year'),
            court: searchParams.get('court') || "",
            caseType: searchParams.get('caseType') || "",
        };

        const validated = searchSchema.parse(queryParams);
        console.log("Validated:", validated);
        console.log("Query params:", queryParams);

        const hasDiaryNumberSearch = isValidString(validated.diaryNumber) && isValidString(validated.year);

        const hasCaseType = isValidString(validated.caseType);

        const hasCourt = isValidString(validated.court);


        if (hasDiaryNumberSearch && hasCaseType) {

            const caseNumbersArray = getCaseNumber(validated.diaryNumber!, validated.year!, validated.caseType!);
            console.log("Case numbers array:", caseNumbersArray);

            caseData = await prisma.caseManagement.findMany({
                where: {
                    OR: [
                        {
                            caseNumber: {
                                equals: caseNumbersArray[0],
                                mode: 'insensitive'
                            }
                        },
                        {
                            caseNumber: {
                                equals: caseNumbersArray[1],
                                mode: 'insensitive'
                            }
                        }
                    ],
                    ...(hasCourt && {
                        court: {
                            equals: validated.court,
                            mode: 'insensitive'
                        }
                    })
                }
            });
            console.log("Case data from case number search:", caseData);

        } else if (hasDiaryNumberSearch) {

            const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;
            console.log("Full diary number:", fullDiaryNumber);

            caseData = await prisma.caseManagement.findMany({
                where: {
                    diaryNumber: {
                        equals: fullDiaryNumber,
                        mode: 'insensitive'
                    },
                    ...(hasCourt && {
                        court: {
                            equals: validated.court,
                            mode: 'insensitive'
                        }
                    })
                }
            });
            console.log("Case data from diary number search:", caseData);
        } else {
            return NextResponse.json({
                success: false,
                message: "No valid search parameters provided. Please provide diary number and year.",
                data: []
            }, { status: 400 });
        }

        if(caseData.length > 0){
            return NextResponse.json({
                success: true,
                message: "Cases found",
                data: caseData
            });
        }

        const scrapperURL = process.env.SERVICE_URL + "supremeCourtOTF";
        
        let payload = {}

        if (hasDiaryNumberSearch && hasCaseType) {
            payload = {
                caseNumber: validated.diaryNumber,
                caseYear: validated.year,
                caseType: validated.caseType
            }

        } else if (hasDiaryNumberSearch) {
            payload = {
                diaryNumber: validated.diaryNumber + "/" + validated.year,
            }
        }

        const response = await fetch(scrapperURL, {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(payload)
        });
        const scrapperResponse = await response.json();
        // Extract case number from the first element of the scraper response
        let caseNumberResponse: string | null = null;

        if (scrapperResponse.success && scrapperResponse.data && Array.isArray(scrapperResponse.data) && scrapperResponse.data.length > 0) {
            caseNumberResponse = scrapperResponse.data[0]['case_number'] || null;
        }
         
        if(caseNumberResponse){
            caseData = await prisma.caseManagement.findMany({
                where: {
                    caseNumber: {
                        equals: caseNumberResponse,
                        mode: 'insensitive'
                    }
                }
            });
        }

        // Return results
        if (caseData.length === 0) {
            const searchType = hasCaseType ? "case number" : "diary number";
            return NextResponse.json({
                success: false,
                message: `No cases found with the provided ${searchType} search parameters`,
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
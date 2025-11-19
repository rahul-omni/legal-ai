

import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient, Prisma } from '@prisma/client';
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
    caseType: z.string()
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

        const queryParams = {
            diaryNumber: searchParams.get('diaryNumber')?.trim(),
            year: searchParams.get('year')?.trim(),
            court: searchParams.get('court')?.trim() || "",
            caseType: searchParams.get('caseType')?.trim() || "",
        };

        const validated = searchSchema.parse(queryParams);

        const hasDiaryNumberSearch = isValidString(validated.diaryNumber) && isValidString(validated.year);

        const hasCaseType = isValidString(validated.caseType);

        const hasCourt = isValidString(validated.court);


        if (hasDiaryNumberSearch && hasCaseType && validated.caseType !== "Diary Number") {

            const caseNumbersArray = getCaseNumber(validated.diaryNumber!, validated.year!, validated.caseType!);
            console.log("Case numbers array:", caseNumbersArray);

            // Create OR conditions for all case number variations
            const caseNumberConditions = caseNumbersArray.map(caseNumber => ({
                caseNumber: {
                    equals: caseNumber,
                    mode: Prisma.QueryMode.insensitive
                }
            }));

            caseData = await prisma.caseManagement.findMany({
                where: {
                    OR: caseNumberConditions,
                    ...(hasCourt && {
                        court: {
                            equals: validated.court,
                            mode: Prisma.QueryMode.insensitive
                        }
                    })
                }
            });
            console.log("Case data from case number search");

        } else if (hasDiaryNumberSearch && validated.caseType === "Diary Number") {

            const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;

            caseData = await prisma.caseManagement.findMany({
                where: {
                    diaryNumber: {
                        equals: fullDiaryNumber,
                        mode: Prisma.QueryMode.insensitive
                    },
                    ...(hasCourt && {
                        court: {
                            equals: validated.court,
                            mode: Prisma.QueryMode.insensitive
                        }
                    })
                }
            });
            console.log("Case data from diary number search");
        } else {
            console.log("No valid search parameters provided. Please provide diary number and year.");
            return NextResponse.json({
                success: false,
                message: "No valid search parameters provided. Please provide diary number and year.",
                data: []
            }, { status: 400 });
        }

        if (caseData.length > 0) {
            return NextResponse.json({
                success: true,
                message: "Cases found",
                data: caseData
            });
        }

        const scrapperURL = process.env.SERVICE_URL + "supremeCourtOTF";

        let payload = {}

        if (hasDiaryNumberSearch && hasCaseType && validated.caseType !== "Diary Number") {
            payload = {
                caseNumber: validated.diaryNumber,
                caseYear: validated.year,
                caseType: validated.caseType
            }

        } else if (hasDiaryNumberSearch && validated.caseType === "Diary Number") {
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

        if (caseNumberResponse) {
            caseData = await prisma.caseDetails.findMany({
                where: {
                    caseNumber: {
                        equals: caseNumberResponse,
                        mode: Prisma.QueryMode.insensitive
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
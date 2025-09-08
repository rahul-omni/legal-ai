


import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Simple validation schema
const searchSchema = z.object({
    diaryNumber: z.string().min(1, "Diary number is required"),
    year: z.string().min(4, "Year is required"),
    court: z.string().default("Nclt Court"),
    caseType: z.string().optional(),
    bench: z.string().optional(),
});
 

    
 

export async function POST(request: NextRequest) {
    try {
        console.log('[API] NCLT search request received');
        
        const payload = await request.json();
        console.log('[API] Received payload:', payload);
        
        const validated = searchSchema.parse(payload);
        console.log('[API] Validated payload:', validated);

        // 1. Check database first - SIMPLIFIED QUERY like District Court
        console.log('[API] Checking database for existing records...');
        
        const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;
        
        const whereClause: any = {
            diaryNumber: {
                equals: fullDiaryNumber,
                mode: Prisma.QueryMode.insensitive
            },
            court: {
                equals: validated.court,
                mode: Prisma.QueryMode.insensitive
            },
            // bench: {
            //     equals: validated.bench,
            //     mode: Prisma.QueryMode.insensitive
            // }
        };
         // Only add bench filter if bench is provided and not the default
if (validated.bench) {
    whereClause.bench = {
        contains: validated.bench,
        mode: Prisma.QueryMode.insensitive
    };
}

        // Only add case_type if provided
        if (validated.caseType) {
            whereClause.case_type = {
                equals: validated.caseType,
                mode: Prisma.QueryMode.insensitive
            };
        }

        console.log('[API] Database query where clause:', JSON.stringify(whereClause, null, 2));

        let caseData = await prisma.caseManagement.findMany({ 
            where: whereClause
        });

        console.log('[API] Database query returned:', caseData.length, 'records');

 
// If found in database, return immediately
if (caseData.length > 0) {
    console.log(`[API] Found ${caseData.length} cases in database`);
    
    // Return cases found in database (no validation needed for existing records)
    return NextResponse.json({ 
        success: true, 
        message: "Cases found in database", 
        data: caseData,
        source: "database"
    });
}

 
        // 2. Only scrape if not found in database
        console.log('[API] No records in database, calling scraper...');
        
        const scrapperURL = process.env.SERVICE_URL + "fetchNCLTCourtJudgments";
        
        if (!scrapperURL || !process.env.SERVICE_URL) {
            throw new Error('SERVICE_URL environment variable not configured');
        }

        const scrapperResponse = await fetch(scrapperURL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(validated)
        });

        if (!scrapperResponse.ok) {
            return NextResponse.json({
                success: false,
                message: "Failed to scrape NCLT data",
                data: []
            }, { status: 503 });
        }

        const scrapperResult = await scrapperResponse.json();

        // 3. After scraping, check database again (like District Court)
        if (scrapperResponse.ok) {
            caseData = await prisma.caseManagement.findMany({
                where: whereClause
            });

             
        }

         // 4. Return results
        if (caseData.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No NCLT cases found with the provided parameters",
                data: []
            }, { status: 404 });
        }

        console.log('[API] Database query returned:', caseData.length, 'records');

        return NextResponse.json({
            success: true,
            message: "Cases found via Scraping",
            data: caseData,
            source: "database_after_scraping"
        });

    } catch (error) {
        console.error('[API] Error:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: "Invalid request parameters",
                data: []
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            message: "Internal server error",
            data: []
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
 
// Optional: Support GET method for backward compatibility
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        const payload = {
            diaryNumber: searchParams.get('diaryNumber') || '',
            year: searchParams.get('year') || '',
            court: searchParams.get('court') || 'Nclt Court',
            caseType: searchParams.get('caseType') || undefined,
            bench: searchParams.get('bench') || ''
        };

        // Validate
        const validated = searchSchema.parse(payload);

        // Create a new request with the payload and call POST method
        const postRequest = new Request(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validated)
        });

        return await POST(postRequest as NextRequest);

    } catch (error) {
        console.error('[API] GET Error:', error);
        
        return NextResponse.json({
            success: false,
            message: error instanceof z.ZodError ? "Invalid query parameters" : "Internal server error",
            data: []
        }, { status: error instanceof z.ZodError ? 400 : 500 });
    }
}
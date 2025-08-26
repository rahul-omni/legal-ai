
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
 
import { z } from "zod";
import { PrismaClient } from '@prisma/client';
import { ca } from "zod/v4/locales";
import { HIGH_COURT_SCRAPERS, resolveCaseTypeValue } from "@/lib/highCourtScrapers";
import { scraperCircuitBreaker } from "@/lib/scraper";
const prisma = new PrismaClient();

 
const searchSchema = z.object({
  diaryNumber: z.string().min(1, "Diary number is required"),
  year: z.string().length(4, "Year must be 4 digits"),
  court: z.string().optional().default("Supreme Court"),
  judgmentType: z.string().optional(),
  caseType: z.string().optional(),
  bench: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional()
})
// Add helper functions before the preferred filter
function normalize(s?: string) {
  return (s || '').toString().trim().toLowerCase();
}

function flexibleMatch(stored?: string, requested?: string) {
  const ns = normalize(stored);
  const nr = normalize(requested);
  if (!ns || !nr) return !nr; // if no requested value, accept any stored value
  return ns.includes(nr) || nr.includes(ns);
}
 
async function logSearchAttempt(params: any, result: any) {
  const logEntry = {
    timestamp: new Date(),
    params,
    result: {
      dbCount: result.caseData?.length || 0,
      scrapeSuccess: result.scrapeResult?.success,
      scrapeCount: result.scrapeResult?.result?.length || 0,
      error: result.error
    },
    metadata: {
      endpoint: 'cases/search',
      user: 'system'
    }
  };
  
 
  // In production, you'd want to store this in a logging system
}

export async function GET(request: NextAuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let queryParams = {
      diaryNumber: searchParams.get('diaryNumber'),
      year: searchParams.get('year'),
      court: searchParams.get('court') ? decodeURIComponent(searchParams.get('court')!) : undefined,
      judgmentType: searchParams.get('judgmentType') ?? undefined,
      caseType: searchParams.get('caseType') || '',
      bench: searchParams.get('bench') || '',
      city: searchParams.get('city') || '',
      district: searchParams.get('district') || ''
    };
 
    const validated = searchSchema.parse(queryParams);
    const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;

    // Build where condition

    let caseData: any[] = [];
        if (validated.court === "High Court") {
      // High Court: Full search with fallback  scraping capability
      const whereConditions: any = {
        diaryNumber: { equals: fullDiaryNumber, mode: 'insensitive' as const},
        court: { equals: validated.court, mode: 'insensitive' as const},
      }; 
      
      if (validated.city && validated.city.trim() !== "") {
        whereConditions.city = { equals: validated.city, mode: 'insensitive' };
      }
      
      if (validated.bench && validated.bench.trim() !== "") {
        whereConditions.bench = { equals: validated.bench, mode: 'insensitive' };
      }
      
      if (validated.caseType && validated.caseType.trim() !== "") {
        whereConditions.case_type = { contains: validated.caseType, mode: 'insensitive' };
      }
      
      if (validated.judgmentType && validated.judgmentType.toString().trim() !== "") {
        const jt = validated.judgmentType.toString();
        const parts = jt.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length === 1) {
          whereConditions.judgment_type = { equals: parts[0], mode: 'insensitive' };
        } else if (parts.length > 1) {
          whereConditions.OR = parts.map(p => ({ judgment_type: { equals: p, mode: 'insensitive' } }));
        }
      }

  
    console.log("High Court search - Where conditions:", whereConditions);
      caseData = await prisma.caseManagement.findMany({ where: whereConditions });
      console.log("High Court initial DB result:", caseData.length);
      
      const canScrape = validated.city && validated.city.trim() !== ""
       && validated.caseType && validated.caseType.trim() !== "";
 
   // Fallback: if nothing matched with filters (bench/case_type/city), try diaryNumber-only
   // This prevents unnecessary scraping when the diary number exists but other fields differ.
if (caseData.length === 0 && fullDiaryNumber) {
  const fallback = await prisma.caseManagement.findMany({
    where: {
      diaryNumber: { equals: fullDiaryNumber, mode: 'insensitive' }
    }
  });
  if (fallback.length > 0) {
    console.log("Fallback DB match by diaryNumber found, skipping scraper:", fallback.length, fallback);
    
         console.log("Fallback DB match by diaryNumber found:", fallback.length);
          
          const preferred = fallback.filter(r => {
            if (!r.court || !normalize(r.court).includes(normalize(validated.court))) {
              return false;
            }
            if (validated.city && validated.city.trim() !== '') {
              if (!flexibleMatch(r.city ?? undefined, validated.city)) return false;
            }
            if (validated.bench && validated.bench.trim() !== '') {
              if (!flexibleMatch(r.bench ?? undefined, validated.bench)) return false;
            }
            if (validated.caseType && validated.caseType.trim() !== '') {
              if (!flexibleMatch(r.case_type ?? undefined, validated.caseType)) return false;
            }
            return true;
          });

     // ...existing code...
        if (validated.judgmentType && validated.judgmentType.toString().trim() !== "") {
          const parts = validated.judgmentType.toString()
            .split(',')
            .map(p => p.trim().toLowerCase())
            .filter(Boolean);

          const preferredWithJudgment = preferred.filter(r =>
            parts.includes((r.judgment_type || '').toLowerCase())
          );

          if (preferredWithJudgment.length > 0) {
            console.log("Returning preferred rows matching requested court + judgmentType:", preferredWithJudgment.length);
            caseData = preferredWithJudgment;
          } else {
         // Requested judgmentType not present in DB for this diary -> do NOT scrape or return unrelated row          
            // judgmentType provided but no matching rows - treat as optional and allow fallback/scraping
            console.log("No DB rows matched requested judgmentType - treating as optional for High Court.");
            if (preferred.length > 0) {
              console.log("Returning available preferred rows (judgmentType not matched but treating as optional).");
              caseData = preferred;
            } else if (canScrape) {
              console.log("No preferred rows and judgmentType not matched; will attempt High Court scrape.");
              // leave caseData empty to trigger scraper
            } else {
             console.log("No preferred rows, judgmentType not matched, scraping not allowed - returning fallback.");
            caseData = fallback;
            }
          }
        } else {
          console.log("DiaryNumber exists but no row matches requested court+judgmentType; available courts:", Array.from(new Set(fallback.map(r => r.court))));
          // No judgmentType requested: accept preferred if any, otherwise decide whether to scrape or return fallback
          if (preferred.length > 0) {
            console.log("Returning preferred rows matching requested court:", preferred.length);
            caseData = preferred;

          } else if (canScrape) {
            console.log("No preferred rows found; will attempt High Court scrape.");
            // leave caseData empty so scraper may run
          } else {
            console.log("Returning diary-only fallback rows (no scrape).");
            caseData = fallback;
          }
        }
// ...existing code...
  }
}

 
    let scrapeResult: any = { success: false };

    // Only attempt scraping when DB returned nothing AND we have required params

    const shouldScrape = caseData.length === 0 && canScrape;

    let scrapedAndInserted = false;
    
   if (shouldScrape) {
  const highCourtConfig = HIGH_COURT_SCRAPERS[validated.city as keyof typeof HIGH_COURT_SCRAPERS];
   

  if (!highCourtConfig) {
    const response = { 
      success: false,
      message: `Scraping not supported for ${validated.city} High Court`,
      searchedParams: {
        ...validated,
        diaryNumber: fullDiaryNumber,
        bench: validated.bench || ''
      }
    };
    await logSearchAttempt(validated, response);
    return NextResponse.json(response, { status: 400 });
  }

  // Additional validation for benches
  if (highCourtConfig.requiresBench && !validated.bench?.trim()) {
    const response = { 
      success: false,
      message: `Bench is required for ${validated.city} High Court cases`,
      searchedParams: {
        ...validated,
        diaryNumber: fullDiaryNumber,
        bench: ''
      }
    };
    await logSearchAttempt(validated, response);
    return NextResponse.json(response, { status: 400 });
  }
 

  // ...existing code...
// inside GET(), replace the caseTypeMapping + payload block with this:
  // pick mapping: global or bench-specific mapping (if present)
  let caseTypeMapping: Record<string, number | null> | undefined = undefined;
  if ("caseTypeMapping" in highCourtConfig) {
    caseTypeMapping = (highCourtConfig as any).caseTypeMapping;
  } else if (highCourtConfig.benchMappings && validated.bench) {
    caseTypeMapping = (highCourtConfig as any).benchMappings[validated.bench as keyof typeof highCourtConfig.benchMappings];
  }

  // resolve numeric value for the selected caseType label (handles keys with "-<num>" suffix and cleaned labels)
  const resolvedCaseTypeValue = resolveCaseTypeValue(caseTypeMapping, validated.caseType);
 console.log('Case type mapping keys (sample 10):', caseTypeMapping ? Object.keys(caseTypeMapping).slice(0,10) : 'none');
  console.log('Selected caseType label:', validated.caseType);
  console.log('Resolved caseTypeValue:', resolvedCaseTypeValue);
  console.log('Validated bench:', validated.bench, 'highCourtConfig.defaultBench:', highCourtConfig?.defaultBench);

  if (!validated.caseType || !caseTypeMapping || resolvedCaseTypeValue === undefined) {
    const response = { 
      success: false,
      message: `Invalid case type for ${validated.city} High Court`,
      searchedParams: {
        ...validated,
        diaryNumber: fullDiaryNumber,
        bench: validated.bench || highCourtConfig.defaultBench
      }
    };
    await logSearchAttempt(validated, response);
    return NextResponse.json(response, { status: 400 });
  }

  const scrapeURL = `${process.env.SERVICE_URL}${highCourtConfig.endpoint}`;
  const payload = {
    highCourt: highCourtConfig.highCourtName,
    bench: validated.bench || highCourtConfig.defaultBench,
    diaryNumber: fullDiaryNumber,
    caseType: validated.caseType,
    caseTypeValue: String(resolvedCaseTypeValue),
    judgmentType: validated.judgmentType,
    city: validated.city
  };
console.log('Attempting to scrape with payload:', payload);
// ...existing code...
// ...existing code...
  
  try {
    scrapeResult = await scraperCircuitBreaker.fire(scrapeURL, payload);
    console.log('Scrape result:', scrapeResult);

    // If scraping succeeded but got no results, wait and retry once
    if (scrapeResult.success && scrapeResult.result.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      scrapeResult = await scraperCircuitBreaker.fire(scrapeURL, payload);
      console.log('Retry scrape result:', scrapeResult);
    }

     // ...existing code...
   
// If scraping found results, save to database
if (scrapeResult.success && scrapeResult.result.length > 0) {
  try {
    // Filter out cases that already exist in DB
    const casesToInsert = [];
    for (const resultObj of scrapeResult.result) {
      const processedResults = resultObj.processedResults || [];
      for (const caseItem of processedResults) {
        // const diaryNumberToCheck = caseItem["Diary Number"] || caseItem.diaryNumber || fullDiaryNumber;
        const existing = await prisma.caseManagement.findFirst({
          where: {
            diaryNumber: { equals:  fullDiaryNumber, mode: 'insensitive' },
            court: { contains: validated.court, mode: 'insensitive' },
             bench: { contains: validated.bench, mode: 'insensitive' },
            case_type: { contains: validated.caseType, mode: 'insensitive' }
          }
        });
        if (!existing) {
          casesToInsert.push({
            diaryNumber: fullDiaryNumber,
            caseNumber: caseItem["Case Number"] || caseItem.caseNumber || '',
            parties: caseItem["Petitioner / Respondent"] || caseItem.parties || '',
            advocates: caseItem["Petitioner/Respondent Advocate"] || caseItem.advocates || '',
            bench: caseItem["Bench"] || caseItem.bench || payload.bench,
            judgmentBy: caseItem["Judgment By"] || caseItem.judgmentBy || '',
            judgmentDate: caseItem["judgment_date"] || caseItem.judgmentDate || '',
            judgmentText: Array.isArray(caseItem.judgment_text)
              ? caseItem.judgment_text
              : caseItem.judgment_text ? [caseItem.judgment_text] : [],
            judgmentUrl: Array.isArray(caseItem.judgment_url)
              ? caseItem.judgment_url
              : caseItem.judgment_url ? [caseItem.judgment_url] :
                Array.isArray(caseItem.judgmentLinks)
                  ? caseItem.judgmentLinks.map((j: any) => j.url)
                  : caseItem.judgmentLinks?.url ? [caseItem.judgmentLinks.url] : [],
            court: caseItem.court || validated.court,
            judgment_type: caseItem["judgment_type"] || caseItem.judgmentType || caseItem.Judgment || '',
            case_type: caseItem["case_type"] || caseItem.caseType || validated.caseType,
            city: caseItem.city || validated.city,
            district: caseItem.district || validated.district,
            file_path: caseItem.file_path || '',
            serialNumber: caseItem["Serial Number"] || caseItem.serialNumber || ''
          });
        }
      }
    }

    if (casesToInsert.length > 0) {
      await prisma.caseManagement.createMany({
        data: casesToInsert,
        skipDuplicates: true
      });
      scrapedAndInserted = true;
    }

    
    // Refresh caseData from database
    caseData = await prisma.caseManagement.findMany({ where: whereConditions });
  } catch (dbError) {
    console.error('Failed to save scraped cases:', dbError);
  }
}

// ...existing code...
  } catch (scrapeError:any) {
    console.error('Try Again for Scrape:', scrapeError);
    scrapeResult = {
      success: false,
      error:  scrapeError.message || 'Scraping Unknown error',
      isTimeout: !!scrapeError?.isTimeout 
    };
  }
}
   let response;
let status = 200;

if (caseData.length > 0) {
  // Case 1: Found in database
  console.log("Found cases in database:", caseData);

  
  response = {
    success: true,
    message: scrapedAndInserted
      ? 'CasesNumber found via scraping'
      : 'Cases found successfully',
    data: caseData
  
  };
} else if (scrapeResult.success) {
  // Case 2: Scraping succeeded - check for results
  // ...existing code...
let results: any[] = [];
if (Array.isArray(scrapeResult.processedResults)) {
  results = scrapeResult.processedResults;
} else if (scrapeResult.processedResults?.processedResults) {
  results = scrapeResult.processedResults.processedResults;
} else if (scrapeResult.result?.processedResults) {
  results = scrapeResult.result.processedResults;
}
// ...existing code...
  if (results.length > 0) {
    // Case 2a: Scraping found results
    console.log("Found cases via scraping:", results);


      const flatItems = results.flatMap(r => r.processedResults ?? r);

  const normalizedResults = flatItems.map((item: any) => {
    const diary = item["Diary Number"] || item.diaryNumber || "";
    const serial = item["Serial Number"] || item.serialNumber || "0";
    const id = item.id || `${diary}-${serial}`;

    const judgmentUrl = Array.isArray(item.judgment_url)
      ? item.judgment_url
      : item.judgment_url
        ? [item.judgment_url]
        : Array.isArray(item.judgmentLinks)
          ? item.judgmentLinks.map((j: any) => j.url)
          : item.judgmentLinks?.url
            ? [item.judgmentLinks.url]
            : [];

    return {
      id,
      diaryNumber: diary,
      caseNumber: item["Case Number"] || item.caseNumber || "",
      court: item.court || validated.court || "",
      caseType: item.case_type || item.caseType || item["case_type"] || "",
      city: item.city || validated.city || "",
      district: item.district || item.District || validated.district || "",
      parties: item["Petitioner / Respondent"] || item.parties || "",
      advocates: item["Petitioner/Respondent Advocate"] || item.advocates || "",
      bench: item["Bench"] || item.bench ||  validated.bench || "",
      judgmentBy: item["Judgment By"] || item.judgmentBy || "",
      judgmentDate: item["judgment_date"] || item.judgmentDate || "",
      judgmentType: item["judgment_type"] || item.judgmentType || item.Judgment || "",
      judgmentText: Array.isArray(item.judgment_text)
        ? item.judgment_text
        : item.judgment_text ? [item.judgment_text] : [],
      judgmentUrl,
      file_path: item.file_path || "",
      serialNumber: serial
    };
  });

  console.log("Found cases via scraping:", normalizedResults);

  response = {
    success: true,
    message: 'CasesNumber found via scraping',
    data: normalizedResults
  };
  } else {
    // Case 2b: Scraping succeeded but found nothing
    response = {
      success: false,
      message: 'High Court Website that CaseNumber No updated for Scrape yet',
      searchedParams: {
        ...validated,
        diaryNumber: fullDiaryNumber,
        bench: validated.bench || HIGH_COURT_SCRAPERS[validated.city as keyof typeof HIGH_COURT_SCRAPERS]?.defaultBench || ''
      },
      scrapingAttempted: true,
      scrapingSuccessful: true,
      isTimeout: false
    };
    status = 404;
  }
} else {
  // Case 3: No results and scraping failed (or wasn't attempted)
  response = {
    success: false,
    message: scrapeResult.error 
      ? `Scraping failed: ${scrapeResult.error}` 
      : 'No matching casesNumber found',
    searchedParams: {
      ...validated,
      diaryNumber: fullDiaryNumber,
      bench: validated.bench || HIGH_COURT_SCRAPERS[validated.city as keyof typeof HIGH_COURT_SCRAPERS]?.defaultBench || ''
    },
    scrapingAttempted: shouldScrape,
    scrapingSuccessful: scrapeResult.success,
    isTimeout: scrapeResult.isTimeout
  };
  status = scrapeResult.error ? 500 : 404;
}

await logSearchAttempt(validated, { caseData, scrapeResult });
return NextResponse.json(response, { status });

  }} catch (error) {
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

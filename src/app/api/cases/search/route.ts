
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { DELHI_COURT_CASE_TYPES_VALUE_MAPPING, APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING, NAGPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, ORIGINAL_SIDE_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, GOA_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, SPECIAL_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, AURANGABAD_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING } from "@/lib/constants";
import { z } from "zod";
import { PrismaClient } from '@prisma/client';
import { ca } from "zod/v4/locales";

const prisma = new PrismaClient();


 const HIGH_COURT_SCRAPERS = {
  "Delhi": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Principal Bench at Delhi",
    caseTypeMapping: DELHI_COURT_CASE_TYPES_VALUE_MAPPING,
    highCourtName: "High Court of Delhi",
    requiresBench: false
  },
  "Mumbai": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Appellate Side,Bombay",
    benchMappings: {
      "Appellate Side,Bombay": APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING,
      "Bench at Aurangabad":   AURANGABAD_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "Bench at Nagpur":  NAGPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "Original Side,Bombay":  ORIGINAL_SIDE_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "High court of Bombay at Goa":  GOA_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "Special Court (TORTS) Bombay":  SPECIAL_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "Bombay High Court",
    requiresBench: false
  }
};
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

// .refine((data) => {
//   if (data.court === "High Court") {
//     return data.caseType && data.caseType.trim() !== '' && 
//            data.city && data.city.trim() !== '';
//   }
//   return true;
// }, {
//   message: "Case type and city are required for High Court cases",
//   path: ["caseType", "city"]
// });

class ScraperCircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF" = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();

  constructor(
    private request: Function,
    private options = {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 60000
    }
  ) {}

  async fire(...args: any[]) {
    if (this.state === "OPEN") {
      if (this.nextAttempt <= Date.now()) {
        this.state = "HALF";
      } else {
        throw new Error("Circuit breaker is OPEN - scraping temporarily disabled");
      }
    }
    
    try {
      const response = await this.request(...args);
      return this.success(response);
    } catch (err) {
      console.error("Scraping error:", err);
      const error = err instanceof Error ? err : new Error(String(err));
    return this.fail(error);
    }
  }

  private success(response: any) {
    if (this.state === "HALF") {
      this.successCount++;
      if (this.successCount > this.options.successThreshold) {
        this.successCount = 0;
        this.state = "CLOSED";
      }
    }
    this.failureCount = 0;
    return response;
  }

  private fail(err: Error) {
    this.failureCount++;
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.options.timeout;
    }
    throw err;
  }
}

async function scrapeHighCourt(url: string, payload: any) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

    const response = await fetch(url, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Scraper responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.error) {
      console.error('Scraper service error:', data.error);
      return { success: false, error: data.error };
    }
    
    return {
      success: true,
      result: data.result || data.data || [],
      processedResults: data.processedResults || data.result || []
    };
  } catch (err) {
    console.error("Scraping error:", err);
    return { 
      success: false, 
      error:   'Unknown error',
        
    };
  }
}

 
const scraperCircuitBreaker = new ScraperCircuitBreaker(scrapeHighCourt);

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
      judgmentType: searchParams.get('judgmentType') || '',
      caseType: searchParams.get('caseType') || '',
      bench: searchParams.get('bench') || '',
      city: searchParams.get('city') || '',
      district: searchParams.get('district') || ''
    };
 
    const validated = searchSchema.parse(queryParams);
    const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;
// Force bench for Delhi High Court
if (validated.city === "Delhi") {
  validated.bench = "Principal Bench at Delhi";
}


// Ensure Mumbai uses default bench when none provided so bench-specific mappings work
if (validated.city === "Mumbai" && (!validated.bench || validated.bench.trim() === "")) {
  validated.bench = HIGH_COURT_SCRAPERS["Mumbai"].defaultBench;
}

 

    // Build where conditions
     
 const whereConditions: any = {
  diaryNumber: { equals: fullDiaryNumber, mode: 'insensitive' },
  court: { equals: validated.court, mode: 'insensitive' },
   
}; 

if (validated.city && validated.city.trim() !== "") {
  whereConditions.city = { equals: validated.city, mode: 'insensitive' };
}

if (validated.bench && validated.bench.trim() !== "") {
  whereConditions.bench = { equals: validated.bench, mode: 'insensitive' };
}

// make case_type flexible so "WP" can match "WP(Cr. ...)" stored values
if (validated.caseType && validated.caseType.trim() !== "") {
  whereConditions.case_type = { contains: validated.caseType, mode: 'insensitive' };
}

 // judgmentType: optional — when provided, support comma-separated values
if (validated.judgmentType && validated.judgmentType.toString().trim() !== "") {
  const jt = validated.judgmentType.toString();
  const parts = jt.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    whereConditions.judgment_type = { equals: parts[0], mode: 'insensitive' };
  } else if (parts.length > 1) {
    // add OR clause for multiple judgment types
    whereConditions.OR = parts.map(p => ({ judgment_type: { equals: p, mode: 'insensitive' } }));
  }
}

console.log("Where conditions:", whereConditions);


    // First try database lookup
    let caseData = await prisma.caseManagement.findMany({ where: whereConditions });
    console.log("Initial case data from DB:", caseData.length, caseData);
    const canScrape = validated.court === "High Court"
  && validated.city && validated.city.trim() !== ""
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
   // caseData = fallback;
     // Prefer rows matching requested court
        const preferred = fallback.filter(r =>
          (r.court || '').toLowerCase().includes((validated.court || '').toLowerCase())
        );

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
            // Requested judgmentType not present in DB for this diary -> do NOT scrape or return unrelated rows
            console.log("Requested judgmentType not present in DB for diary; returning empty result (no scrape).");
            await logSearchAttempt(validated, { caseData: [], scrapeResult: null });
            return NextResponse.json({
              success: false,
              message: 'No case found with requested judgmentType',
              data: []
            }, { status: 404 });
          }
        } else {
      console.log("DiaryNumber exists but no row matches requested court+judgmentType; available courts:", Array.from(new Set(fallback.map(r => r.court))));
           // No judgmentType requested: accept preferred if any, otherwise decide whether to scrape or return fallback
          if (preferred.length > 0) {
            console.log("Returning preferred rows matching requested court:", preferred.length);
            caseData = preferred;
          } else if (validated.court === "High Court" && canScrape) {
            console.log("No preferred rows found; will attempt High Court scrape.");
            // leave caseData empty so scraper may run
          } else {
            console.log("Returning diary-only fallback rows (no scrape).");
            caseData = fallback;
          }

      }
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

  // --- UPDATED: Use bench-specific mapping for Mumbai ---
  let caseTypeMapping;
  if ("caseTypeMapping" in highCourtConfig) {
    caseTypeMapping = highCourtConfig.caseTypeMapping;
  } else if (validated.city === "Mumbai" && highCourtConfig.benchMappings && validated.bench) {
    caseTypeMapping = highCourtConfig.benchMappings[validated.bench as keyof typeof highCourtConfig.benchMappings];
  }

  if (!validated.caseType || !caseTypeMapping) {
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
    caseTypeValue: String(caseTypeMapping[validated.caseType as keyof typeof caseTypeMapping]),
    judgmentType: validated.judgmentType,
    city: validated.city
  };
  
  console.log('Attempting to scrape with payload:', payload);
  
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
    console.error('Scraping failed:', scrapeError);
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

    // response = {
    //   success: true,
    //   message: 'CasesNumber found via scraping',
    //   data: results
    // };

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
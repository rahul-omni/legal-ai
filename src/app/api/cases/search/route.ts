
 
// import { handleError } from "@/app/api/lib/errors";
// import { userFromSession } from "@/lib/auth";
// import { NextAuthRequest } from "next-auth";
// import { NextResponse } from "next/server";
// import { DELHI_COURT_CASE_TYPES_VALUE_MAPPING ,APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING } from "@/lib/constants";
 
// import { z } from "zod";
 
// import { PrismaClient } from '@prisma/client';
 
// const prisma = new PrismaClient();

// const searchSchema = z.object({
//   diaryNumber: z.string().min(1, "Diary number is required"),
//   year: z.string().length(4, "Year must be 4 digits"),
//   court: z.string().optional().default("Supreme Court"),
//   judgmentType: z.string().optional(),
//   caseType: z.string().optional(),
//   bench: z.string().optional(),
//   city: z.string().optional(),
//   district: z.string().optional()
// }).refine((data) => {
//   // For High Court, caseType and city are required
//   if (data.court === "High Court") {
//     return data.caseType && data.caseType.trim() !== '' && 
//            data.city && data.city.trim() !== '';
//   }
//   return true;
// }, {
//   message: "Case type and city are required for High Court cases",
//   path: ["caseType", "city"]
// });




// export async function GET(request: NextAuthRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const queryParams = {
//       diaryNumber: searchParams.get('diaryNumber'),
//       year: searchParams.get('year'),
//       court: searchParams.get('court') ? decodeURIComponent(searchParams.get('court')!) : undefined,
//       judgmentType: searchParams.get('judgmentType') || '',
//       caseType: searchParams.get('caseType') || '',
//       bench: searchParams.get('bench') || '',
//       city: searchParams.get('city') || '',
//       district: searchParams.get('district') || ''
//     };
    
//     const validated = searchSchema.parse(queryParams);
    
//     const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;

//     // Build where conditions dynamically
//     const whereConditions: any = {
//         diaryNumber: {
//           equals: fullDiaryNumber,
//           mode: 'insensitive'
//         },
//         court: {
//           contains: validated.court,
//           mode: 'insensitive'
//         }
//     };

//     // Only add judgmentType filter if it has a value
//     if (validated.judgmentType && validated.judgmentType.trim() !== '') {
//       whereConditions.judgment_type = {
//         contains: validated.judgmentType,
//         mode: 'insensitive'
//       };
//     }

//     // Only add caseType filter if it has a value
//     if (validated.caseType && validated.caseType.trim() !== '') {
//       whereConditions.case_type = {
//         contains: validated.caseType,
//         mode: 'insensitive'
//       };
//     }

//     if(validated.city && validated.city.trim() !== ''){
//       whereConditions.city = {
//         contains: validated.city,
//         mode: 'insensitive'
//       };
//     }

//     if(validated.district && validated.district.trim() !== ''){
//       whereConditions.district = {
//         contains: validated.district,
//         mode: 'insensitive'
//       };
//     }

//     let caseData = [];

//     console.log(whereConditions, "whereConditions");
    

//     caseData = await prisma.caseManagement.findMany({
//       where: whereConditions
//     });

//     let scrapeResult = [];

//     if (caseData.length === 0 && validated.court === "High Court") {
//       const scrapeURL = process.env.SERVICE_URL + "/fetchHighCourtJudgments";
      
//       // Ensure caseType exists before using it as index
//       if (!validated.caseType || !DELHI_COURT_CASE_TYPES_VALUE_MAPPING[validated.caseType as keyof typeof DELHI_COURT_CASE_TYPES_VALUE_MAPPING]) {
//         return NextResponse.json(
//           { 
//             success: false,
//             message: 'Invalid case type for High Court',
//             searchedParams: {
//               diaryNumber: fullDiaryNumber,
//               court: validated.court,
//               city: validated.city,
//               district: validated.district,
//               caseType: validated.caseType,
//               bench:validated.bench,
//               judgmentType: validated.judgmentType
//             }
//           }, 
//           { status: 400 }
//         );
//       }
      
//       const payload = {
//           highCourt: "High Court of Delhi",
//           bench: "Principal Bench at Delhi",
//           diaryNumber: fullDiaryNumber,
//           caseTypeValue: DELHI_COURT_CASE_TYPES_VALUE_MAPPING[validated.caseType as keyof typeof DELHI_COURT_CASE_TYPES_VALUE_MAPPING].toString()
//       }
      
//       try {

//         const response = await fetch(scrapeURL, {
//           method: "POST",
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(payload)
//         });
        
//         const data = await response.json();
//         scrapeResult = data?.result || [];
        
//         // Re-fetch from database after scraping
//         caseData = await prisma.caseManagement.findMany({
//           where: whereConditions
//         });
//       } catch (err) {
//         console.error("Error fetching High Court judgments:", err);
//       }
//     }

//     if (caseData.length === 0 && scrapeResult.length === 0) {  // Check if array is empty
//       return NextResponse.json(
//         { 
//           success: false,
//           message: 'No matching cases found',
//           searchedParams: {
//             diaryNumber: fullDiaryNumber,
//             court: validated.court,
//             city: validated.city,
//             district: validated.district,
//             caseType: validated.caseType,
//             judgmentType: validated.judgmentType
//           }
//         }, 
//         { status: 200 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: 'Case found Backend successfully',
//       data: caseData
//     });

//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { 
//           success: false,
//           message: "Validation failed",
//           errors: error.errors 
//         },
//         { status: 400 }
//       );
//     }
    
//     console.error("Search error:", error);
//     return NextResponse.json(
//       { 
//         success: false,
//         message: "Internal server error" 
//       },
//       { status: 500 }
//     );
//   }
// }


// import { handleError } from "@/app/api/lib/errors";
// import { userFromSession } from "@/lib/auth";
// import { NextAuthRequest } from "next-auth";
// import { NextResponse } from "next/server";
// import { DELHI_COURT_CASE_TYPES_VALUE_MAPPING, APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING } from "@/lib/constants";
// import { z } from "zod";
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// const HIGH_COURT_SCRAPERS = {
//   "Delhi": {
//     endpoint: "fetchHighCourtJudgments",
//     defaultBench: "Principal Bench at Delhi",
//     caseTypeMapping: DELHI_COURT_CASE_TYPES_VALUE_MAPPING,
//     highCourtName: "High Court of Delhi",
//     requiresBench: false
//   },
//   "Mumbai": {
//     endpoint: "fetchHighCourtJudgments",
//     defaultBench: "Appellate Side",
//     caseTypeMapping: APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING,
//     highCourtName: "Bombay High Court",
//     requiresBench: true
//   }
// };

// const searchSchema = z.object({
//   diaryNumber: z.string().min(1, "Diary number is required"),
//   year: z.string().length(4, "Year must be 4 digits"),
//   court: z.string().optional().default("Supreme Court"),
//   judgmentType: z.string().optional(),
//   caseType: z.string().optional(),
//   bench: z.string().optional(),
//   city: z.string().optional(),
//   district: z.string().optional()
// }).refine((data) => {
//   if (data.court === "High Court") {
//     return data.caseType && data.caseType.trim() !== '' && 
//            data.city && data.city.trim() !== '';
//   }
//   return true;
// }, {
//   message: "Case type and city are required for High Court cases",
//   path: ["caseType", "city"]
// });

// async function scrapeHighCourt(url: string, payload: any) {
//   try {
//     console.log('Calling scraper endpoint:', url);
//     console.log('With payload:', payload);
    
//     const response = await fetch(url, {
//       method: "POST",
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload)
//     });

//     const responseText = await response.text();
//     console.log('Raw scraper response:', responseText.substring(0, 500)); // Log first 500 chars
    
//     try {
//       const data = JSON.parse(responseText);
//       if (!data || typeof data !== 'object') {
//         throw new Error('Invalid JSON response');
//       }
//       return data?.result || [];
//     } catch (jsonError) {
//       if (responseText.includes('Service Unavailable') || 
//           responseText.includes('Error') || 
//           responseText.startsWith('<html')) {
//         console.error('Scraper service error:', responseText.substring(0, 200));
//         return [];
//       }
//       console.error('Unexpected scraper response format');
//       return [];
//     }
//   } catch (err) {
//     console.error("Network error fetching judgments:", err);
//     return [];
//   }
// }



// export async function GET(request: NextAuthRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const queryParams = {
//       diaryNumber: searchParams.get('diaryNumber'),
//       year: searchParams.get('year'),
//       court: searchParams.get('court') ? decodeURIComponent(searchParams.get('court')!) : undefined,
//       judgmentType: searchParams.get('judgmentType') || '',
//       caseType: searchParams.get('caseType') || '',
//       bench: searchParams.get('bench') || '',
//       city: searchParams.get('city') || '',
//       district: searchParams.get('district') || ''
//     };
    
//     const validated = searchSchema.parse(queryParams);
//     const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;

//     // Build where conditions
//     const whereConditions: any = {
//       diaryNumber: { equals: fullDiaryNumber, mode: 'insensitive' },
//       court: { contains: validated.court, mode: 'insensitive' }
//     };

//     // Add optional filters
//     if (validated.judgmentType?.trim()) {
//       whereConditions.judgment_type = { contains: validated.judgmentType, mode: 'insensitive' };
//     }
//     if (validated.caseType?.trim()) {
//       whereConditions.case_type = { contains: validated.caseType, mode: 'insensitive' };
//     }
//     if (validated.city?.trim()) {
//       whereConditions.city = { contains: validated.city, mode: 'insensitive' };
//     }
//     if (validated.district?.trim()) {
//       whereConditions.district = { contains: validated.district, mode: 'insensitive' };
//     }
//     if (validated.bench?.trim()) {
//       whereConditions.bench = { contains: validated.bench, mode: 'insensitive' };
//     }

//     let caseData = await prisma.caseManagement.findMany({ where: whereConditions });
//     let scrapeResult = [];

//     if (caseData.length === 0 && validated.court === "High Court") {
//       const highCourtConfig = HIGH_COURT_SCRAPERS[validated.city as keyof typeof HIGH_COURT_SCRAPERS];
      
//       if (!highCourtConfig) {
//         return NextResponse.json(
//           { 
//             success: false,
//             message: `Scraping not supported for ${validated.city} High Court`,
//             searchedParams: {
//               ...validated,
//               diaryNumber: fullDiaryNumber,
//               bench: validated.bench || ''
//             }
//           }, 
//           { status: 400 }
//         );
//       }

//       // Additional validation for benches
//       if (highCourtConfig.requiresBench && !validated.bench?.trim()) {
//         return NextResponse.json(
//           { 
//             success: false,
//             message: `Bench is required for ${validated.city} High Court cases`,
//             searchedParams: {
//               ...validated,
//               diaryNumber: fullDiaryNumber,
//               bench: ''
//             }
//           }, 
//           { status: 400 }
//         );
//       }

//       if (!validated.caseType || !highCourtConfig.caseTypeMapping[validated.caseType as keyof typeof highCourtConfig.caseTypeMapping]) {
//         return NextResponse.json(
//           { 
//             success: false,
//             message: `Invalid case type for ${validated.city} High Court`,
//             searchedParams: {
//               ...validated,
//               diaryNumber: fullDiaryNumber,
//               bench: validated.bench || highCourtConfig.defaultBench
//             }
//           }, 
//           { status: 400 }
//         );
//       }
      
//       const scrapeURL = `${process.env.SERVICE_URL}${highCourtConfig.endpoint}`;
//       const payload = {
//         highCourt: highCourtConfig.highCourtName,
//         bench: validated.bench || highCourtConfig.defaultBench,
//         diaryNumber: fullDiaryNumber,
//         caseType: validated.caseType,
//         caseTypeValue: String(highCourtConfig.caseTypeMapping[validated.caseType as keyof typeof highCourtConfig.caseTypeMapping]),
//         judgmentType: validated.judgmentType,
//         city: validated.city
//       };
      
//       console.log('Attempting to scrape with payload:', payload);
//       scrapeResult = await scrapeHighCourt(scrapeURL, payload);
//       console.log('Scrape result count:', scrapeResult.length);
      
//       // Re-fetch from database after scraping
//       if (scrapeResult.length > 0) {
//         caseData = await prisma.caseManagement.findMany({ where: whereConditions });
//       }
//     }

//     if (caseData.length === 0 && scrapeResult.length === 0) {
//       return NextResponse.json(
//         { 
//           success: false,
//           message: 'No matching cases found',
//           searchedParams: {
//             ...validated,
//             diaryNumber: fullDiaryNumber,
//             bench: validated.bench || HIGH_COURT_SCRAPERS[validated.city as keyof typeof HIGH_COURT_SCRAPERS]?.defaultBench || ''
//           },
//           scrapingAttempted: validated.court === "High Court",
//           scrapingSuccessful: scrapeResult.length > 0
//         }, 
//         { status: 200 }
//       );
//     }

//     // If DB is empty but scrapeResult exists, return scraped results
// if (caseData.length === 0 && scrapeResult?.processedResults?.length > 0) {
//   return NextResponse.json({
//     success: true,
//     message: 'Case found via scraping',
//     data: scrapeResult.processedResults
//   });
// }

//     return NextResponse.json({
//       success: true,
//       message: 'DB Case found successfully',
//       data: caseData
//     });

//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { success: false, message: "Validation failed", errors: error.errors },
//         { status: 400 }
//       );
//     }
    
//     console.error("Search error:", error);
//     return NextResponse.json(
//       { success: false, message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }


import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { DELHI_COURT_CASE_TYPES_VALUE_MAPPING, APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING, NAGPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, ORIGINAL_SIDE_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, GOA_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, SPECIAL_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, AURANGABAD_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING } from "@/lib/constants";
import { z } from "zod";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HIGH_COURT_SCRAPERS1 = {
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
    caseTypeMapping: APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING,
    highCourtName: "Bombay High Court",
    requiresBench: true
  }
};
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
}).refine((data) => {
  if (data.court === "High Court") {
    return data.caseType && data.caseType.trim() !== '' && 
           data.city && data.city.trim() !== '';
  }
  return true;
}, {
  message: "Case type and city are required for High Court cases",
  path: ["caseType", "city"]
});

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

     // --- Auto-populate caseType and city from DB if missing ---
    if (
      queryParams.court === "High Court" &&
      (!queryParams.caseType || !queryParams.city)
    ) {
      const fullDiaryNumber = `${queryParams.diaryNumber}/${queryParams.year}`;
      const dbCase = await prisma.caseManagement.findFirst({
        where: {
          diaryNumber: { equals: fullDiaryNumber, mode: 'insensitive' },
          court: { contains: queryParams.court, mode: 'insensitive' }
        }
      });
      if (dbCase) {
        if (!queryParams.caseType) queryParams.caseType = dbCase.case_type || '';
        if (!queryParams.city) queryParams.city = dbCase.city || '';
      }
    }
      console.log("queryParams after DB lookup:", queryParams);

    const validated = searchSchema.parse(queryParams);
    const fullDiaryNumber = `${validated.diaryNumber}/${validated.year}`;

    // Build where conditions
    const whereConditions: any = {
      diaryNumber: { equals: fullDiaryNumber, mode: 'insensitive' },
      court: { contains: validated.court, mode: 'insensitive' }
    };

    // Add optional filters
    if (validated.judgmentType?.trim()) {
      whereConditions.judgment_type = { contains: validated.judgmentType, mode: 'insensitive' };
    }
    if (validated.caseType?.trim()) {
      whereConditions.case_type = { contains: validated.caseType, mode: 'insensitive' };
    }
    if (validated.city?.trim()) {
      whereConditions.city = { contains: validated.city, mode: 'insensitive' };
    }
    if (validated.district?.trim()) {
      whereConditions.district = { contains: validated.district, mode: 'insensitive' };
    }
    if (validated.bench?.trim()) {
      whereConditions.bench = { contains: validated.bench, mode: 'insensitive' };
    }

    // First try database lookup
    let caseData = await prisma.caseManagement.findMany({ where: whereConditions });
    let scrapeResult: any = { success: false };

    const shouldScrape = caseData.length === 0 && validated.court === "High Court";

  
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

  if (!validated.caseType || !caseTypeMapping || !caseTypeMapping[validated.caseType as keyof typeof caseTypeMapping]) {
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

    // If scraping found results, save to database
    if (scrapeResult.success && scrapeResult.result.length > 0) {
      try {
        await prisma.caseManagement.createMany({
          data: scrapeResult.result.flatMap((resultObj: any) =>
            (resultObj.processedResults || []).map((caseItem: any) => ({
              diaryNumber: caseItem["Diary Number"] || caseItem.diaryNumber || fullDiaryNumber,
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
            }))
          ),
          skipDuplicates: true
        });
        // Refresh caseData from database
        caseData = await prisma.caseManagement.findMany({ where: whereConditions });
      } catch (dbError) {
        console.error('Failed to save scraped cases:', dbError);
      }
    }
  } catch (scrapeError) {
    console.error('Scraping failed:', scrapeError);
    scrapeResult = {
      success: false,
      error:  'Scraping Unknown error',
    };
  }
}
   let response;
let status = 200;

if (caseData.length > 0) {
  // Case 1: Found in database
  response = {
    success: true,
    message: 'Cases found successfully',
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
    response = {
      success: true,
      message: 'CasesNumber found via scraping',
      data: results
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
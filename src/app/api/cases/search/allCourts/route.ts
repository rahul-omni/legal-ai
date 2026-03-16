 import { PrismaClient } from '@prisma/client';
import { userFromSession } from "@/lib/auth";
import { auth } from '@/app/api/lib/auth/nextAuthConfig';
import { is } from 'date-fns/locale';

const CASE_TYPES_REVERSED = {
  "Criminal Appeal": "Crl.A.",
  "Criminal Miscellaneous Case": "Crl.M.C.",
  "Criminal Revision Petition": "Crl.R.P.",
  "Criminal Original Petition": "Crl.O.P.",
  "Criminal Petition": "Crl.P.",
  "Criminal Miscellaneous Petition": "Crl.M.P.",
  "Criminal Revision Case": "Crl.R.C.",
  "Criminal Original Suit": "Crl.O.S.",
  "Criminal Case / Calendar Case": "C.C.",
  "Sessions Case": "S.C.",
  "Preliminary Register Case": "P.R.C.",
  "First Information Report": "F.I.R.",
  "Criminal Contempt Appeal": "C.Crl.A.",

  "Civil Suit": "C.S.",
  "Original Suit": "O.S.",
  "Civil Appeal": "C.A.",
  "First Appeal": "F.A.",
  "Regular First Appeal": "R.F.A.",
  "Regular Second Appeal": "R.S.A.",
  "Second Appeal": "S.A.",
  "Appeal Suit": "A.S.",
  "Civil Miscellaneous Appeal": "C.M.A.",
  "Civil Miscellaneous Petition": "C.M.P.",
  "Civil Revision Petition": "C.R.P.",
  "Civil Revision": "C.R.",
  "Interlocutory Application": "I.A.",
  "Insolvency Petition": "I.P.",
  "Execution Petition": "E.P.",
  "Execution Application": "E.A.",
  "Original Petition": "O.P.",
  "Transfer Original Petition": "Tr.O.P.",
  "Transfer Civil Misc Petition": "Tr.C.M.P.",
  "Transfer Civil Misc Appeal": "Tr.C.M.A.",
  "Appeal Against Orders": "A.A.O.",
  "Arbitration Request": "A.R.",
  "Review Application": "R.A.",

  "Writ Petition": "W.P.",
  "Writ Appeal": "W.A.",
  "Writ Petition (Civil)": "W.P.(C)",
  "Writ Petition (Criminal)": "W.P.(Crl)",
  "Writ Petition (Madurai Bench)": "W.P.(MD)",
  "Writ Appeal (Madurai Bench)": "W.A.(MD)",
  "Habeas Corpus Petition": "H.C.P.",
  "Public Interest Litigation": "PIL",

  "Special Leave Petition": "S.L.P.",
  "Special Leave Petition (Civil)": "SLP(C)",
  "Special Leave Petition (Criminal)": "SLP(Crl)",
  "Curative Petition": "Cur.P.",
  "Review Petition": "R.P.",
  "Transfer Petition (Civil)": "T.P.(C)",
  "Transfer Petition (Criminal)": "T.P.(Crl)",

  "Family Court Original Petition": "F.C.O.P.",
  "Guardianship Petition": "G.W.O.P.",
  "Hindu Marriage Original Petition": "H.M.O.P.",
  "Maintenance Case": "M.C.",
  "Family Court Petition": "O.P.(Family)",
  "Domestic Violence Case": "D.V.C.",
  "Matrimonial Original Petition": "M.O.P.",
  "Family Court Miscellaneous": "C.Misc.",

  "Arbitration Original Petition": "Arb.O.P.",
  "Arbitration Appeal": "Arb.A.",
  "Arbitration Petition": "Arb.P.",
  "Commercial Appeal Suit": "Com.A.S.",
  "Commercial Original Suit": "Com.O.S.",
  "Commercial Appeal Petition": "Com.A.P.",
  "Commercial Misc Petition": "Com.M.P.",

  "Industrial Dispute": "I.D.",
  "Letters Patent Appeal": "L.P.A.",
  "Labour Court Case": "L.C.",
  "Workmen Compensation": "W.C.",
  "Industrial Appellate Tribunal Case": "I.A.T.",

  "Tax Appeal": "T.A.",
  "Tax Case": "T.C.",
  "Income Tax Appeal": "ITA",
  "Income Tax Case": "ITC",
  "Central Excise Appeal": "C.E.A.",
  "Central Excise Revision": "C.E.R.",
  "Service Tax Appeal": "S.T.A.",
  "GST Appeal": "G.S.T.A.",
  "Civil Miscellaneous Appeal (Tax)": "CMA(Tax)",

  "Civil Contempt Petition": "Cont.P.(C)",
  "Criminal Contempt Petition": "Cont.P.(Crl)",
  "Contempt Case": "Cont.Case",
  "Suo Motu Contempt": "Suo Motu Cont.",

  "Motor Accident Claims Appeal": "M.A.C.M.A.",
  "Motor Vehicle Original Petition": "M.V.O.P.",
  "Motor Accident Claim Petition": "M.A.C.P.",

  "Rent Control Case": "R.C.",
  "Rent Control Appeal": "R.C.A.",
  "Land Acquisition Original Petition": "L.A.O.P.",
  "Election Original Petition": "E.O.P.",

  "Miscellaneous Petition": "M.P.",
  "Miscellaneous Appeal": "M.A.",
  "Miscellaneous Criminal Revision": "M.C.R.",
  "Special Revision": "S.R.",
  "Special Misc Petition": "S.M.P.",
  "Registration Appeal": "Reg.Appeal",
  "Registration Original Petition": "Reg.O.P.",

  "Original Application (Tribunal)": "OA",
  "Review Application (Tribunal)": "RA",
  "Misc Application (Tribunal)": "MA",

  "Suo Motu Writ (Civil)": "SMW(C)",
  "Suo Motu Writ (Criminal)": "SMW(Crl)",
  "Suo Motu Criminal Case": "SMC(Crl)",
  "Suo Motu Civil Case": "SMC(C)",

  "Curative Petition (Review)": "CURATIVE PET(R)",
  "Curative Petition (Civil)": "CURATIVE PET(C)",
};


const prisma = new PrismaClient();

/**
 * Cloud function URL overrides – use when an endpoint is deployed to the new Firebase project.
 * Add or update the URL here for each endpoint you migrate; others keep using SERVICE_URL.
 */
const CLOUD_FUNCTION_URL_OVERRIDES: Partial<Record<string, string>> = {
  // supremeCourtOTF: 'https://asia-south1-robotic-land-465306-j7.cloudfunctions.net/supremeCourtOTF',
  // Add more as you deploy to new Firebase, e.g.:
  // highCourtCasesUpsert: 'https://asia-south1-robotic-land-465306-j7.cloudfunctions.net/highCourtCasesUpsert',
  // phhcUpsert: 'https://asia-south1-robotic-land-465306-j7.cloudfunctions.net/phhcUpsert',
  // districtCourtCasesUpsert: 'https://NEW_PROJECT.cloudfunctions.net/districtCourtCasesUpsert',
  // delhiDistrictCourtUpsert: 'https://asia-south1-robotic-land-465306-j7.cloudfunctions.net/delhiDistrictCourtUpsert',
  // ncltCourtCasesUpsert: 'https://NEW_PROJECT.cloudfunctions.net/ncltCourtCasesUpsert',
};

// List of districts that fall under East Delhi jurisdiction
const EAST_DELHI_DISTRICTS = [
  "East District Court, Delhi",
  "Central District Court, Delhi",
  "New Delhi District Court, Delhi",
  "North East District Court, Delhi",
  "Shahdara District Court, Delhi",
  "South-East District Court, New Delhi",
  "South District Court, Delhi",
  "Dwarka Court South West Delhi",
  "West District Court, Delhi",
  "District Court North Delhi",
  "District Court North West Delhi",
];

const getEndpoint = (court: string, district?: string, city?: string) => {
  if (court === "High Court") {
    if (city === "Delhi") {
      return "highCourtCasesUpsert";
    }else if (city === "Punjab and Haryana") {
      return "phhcUpsert";
    }
    return "highCourtCasesUpsert";
  } else if (court === "Supreme Court") {
    return "supremeCourtOTF";
  } else if (court === "District Court") {
    // Check if it's East Delhi District Court
    if (district && EAST_DELHI_DISTRICTS.some(d => district.includes(d))) {
      return "delhiDistrictCourtUpsert";
    }

    if (district === "Gurugram") {
      return "gurugramDistrictCourtUpsert";
    }
    return "districtCourtCasesUpsert";
  } else if (court === "Nclt Court") {
    return "ncltCourtCasesUpsert";
  }
}

const buildPayload = (court: string, queryParams: any, caseId: string) => {
  if (court === "District Court") {
    // District Court specific payload - MUST include ID so cloud function updates instead of creates
    return {
      id: caseId, // ⭐ This is critical - cloud function will UPDATE this case
      diaryNumber: `${queryParams.diaryNumber}/${queryParams.year}`,
      courtName: queryParams.district,
      courtComplex: queryParams.courtComplex,
      caseTypeValue: queryParams.caseType,
      court: queryParams.court
    }
  } else if (queryParams.caseType == 'Diary Number' && (court === "Supreme Court")) {
      return {
        id: caseId, // ⭐ This is critical - cloud function will UPDATE this case
        caseYear: String(queryParams.year ?? ''),
        diaryNumber: `${queryParams.diaryNumber}/${queryParams.year}`,
        caseType: queryParams.caseType,
      };
  } else {
    // Supreme Court by case type (e.g. TRANSFER PETITION (CIVIL)): use case-no flow, not diary-no.
    // Send diaryNumber as empty so supremeCourtOTF uses setCaseTypeAndSetValue(page, caseType, caseNumber, caseYear)
    // instead of enterDiaryNumber(page, diaryNumber) which expects format "1234/2025".
    return {
      id: caseId, // ⭐ This is critical - cloud function will UPDATE this case
      caseYear: String(queryParams.year ?? ''),
      caseNumber: String(queryParams.diaryNumber ?? ''),
      // diaryNumber: '', // empty = use case-no flow; only "Diary Number" type uses diary-no with "number/year"
      caseType: queryParams.caseType,
    };
  }
};

export const GET = auth(async (request) => {
  try {
    const user = await userFromSession(request);
    const { searchParams } = new URL(request.url);

    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const court = searchParams.get('court');
    const queryParams = {
      diaryNumber: searchParams.get('diaryNumber') || '',
      year: searchParams.get('year'),
      court: searchParams.get('court') ? decodeURIComponent(searchParams.get('court')!) : undefined,
      caseType: searchParams.get('caseType') || '',
      city: searchParams.get('city') ? decodeURIComponent(searchParams.get('city')!) : undefined,
      district: searchParams.get('district') ? decodeURIComponent(searchParams.get('district')!) : undefined,
      bench: searchParams.get('bench') ? decodeURIComponent(searchParams.get('bench')!) : undefined,
      courtComplex: searchParams.get('courtComplex') ? decodeURIComponent(searchParams.get('courtComplex')!) : undefined,
    };

    let existingCase;

    if (queryParams.court == 'High Court'){
      existingCase = await prisma.caseDetails.findFirst({
          where: {
            diaryNumber: `${queryParams.diaryNumber}/${queryParams.year}`,
            case_type: queryParams.caseType,
            court: 'High Court',
            city: queryParams.city
          }
        });
    } else if(queryParams.court == 'Supreme Court') {
      if (queryParams.caseType == 'Diary Number') {
        existingCase = await prisma.caseDetails.findFirst({
          where: {
            diaryNumber: `${queryParams.diaryNumber}/${queryParams.year}`,
            court: 'Supreme Court'
          }
        });
      } else {
        // Supreme Court by case type (e.g. SLP(C)): match diary + year so we don't reuse an old year's case
        const caseType = queryParams.caseType; // string

        let shortCaseType: string | undefined;

        if (caseType in CASE_TYPES_REVERSED) {
          shortCaseType = CASE_TYPES_REVERSED[caseType as keyof typeof CASE_TYPES_REVERSED];
        }

        const formattedDiaryNumber = String(queryParams.diaryNumber).padStart(6, '0');
        const diaryWithYear = `${queryParams.diaryNumber}/${queryParams.year}`;

        existingCase = await prisma.caseDetails.findFirst({
          where: {
            AND: [
              {
                caseNumber: {
                  contains: formattedDiaryNumber
                }
              },
              {
                caseNumber: {
                  contains: shortCaseType,
                  mode: 'insensitive'
                }
              },
              {
                court: 'Supreme Court'
              },
              // Match year so we don't subscribe to an old case (e.g. 1351/2023 when user entered 1351/2026)
              {
                diaryNumber: diaryWithYear
              }
            ]
          }
        });
      }
    }

    console.log('Existing case found:', existingCase ? existingCase.id : 'No');

    const endpoint = getEndpoint(court!, queryParams.district, queryParams.city);
    const serviceUrl = process.env.SERVICE_URL?.trim() || '';
    const overrideUrl = endpoint ? CLOUD_FUNCTION_URL_OVERRIDES[endpoint] : undefined;
    if (!overrideUrl && !serviceUrl) {
      console.error('SERVICE_URL is not set and no URL override for endpoint - cloud function will not be called');
      return new Response(JSON.stringify({
        error: "Server misconfiguration",
        message: "Backend service URL not configured. Please set SERVICE_URL or add a URL override for this endpoint.",
      }), { status: 500 });
    }
    // Use override URL if set (e.g. new Firebase); otherwise SERVICE_URL + endpoint
    const externalApi = overrideUrl ?? `${serviceUrl.replace(/\/$/, '')}/${endpoint}`;

    console.log('=== Cloud Function Details ===');
    console.log('Court:', court);
    console.log('District:', queryParams.district);
    console.log('Selected Endpoint:', endpoint);
    console.log('Full API URL:', externalApi);

    // If case exists, just subscribe user and trigger update
    if (existingCase) {
      const isSubscribedCase = await prisma.subscribedCases.findFirst({
        where: {
          userId: user.id,
          case_id: existingCase.id,
          status: 'ACTIVE'
        }
      });
      if (isSubscribedCase) {
        return new Response(JSON.stringify({ message: "Case already subscribed." }), { status: 200 });
      }
      const subscribedCase = await prisma.subscribedCases.create({
        data: {
          userId: user.id,
          case_id: existingCase.id,
        }
      });

      // Trigger Cloud Function to UPDATE the case (with ID)
      const payload = buildPayload(court!, queryParams, existingCase.id);
      
      console.log('=== Payload for Existing Case (UPDATE) ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('⭐ ID included - Cloud function should UPDATE, not CREATE');

      fetch(externalApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        console.log('✓ Cloud function called to update existing case');
      }).catch(err => {
        console.error('✗ Error calling cloud function:', err);
      });

      return new Response(JSON.stringify({ 
        subscribedCase, 
        message: "Case exists." 
      }), { status: 200 });
    }

    console.log('✗ Case not found, creating placeholder case');

    // Create PLACEHOLDER case in CaseDetails with empty judgment_url
    // For Supreme Court always store diary+year so lookup and display are correct (e.g. 1351/2026)
    const diaryNumberForCreate =
      queryParams.court === 'Supreme Court' || queryParams.caseType === 'Diary Number' || queryParams.court === 'High Court' || queryParams.court === 'District Court'
        ? `${queryParams.diaryNumber}/${queryParams.year}`
        : '';

    const newCase = await prisma.caseDetails.create({
      data: {
        diaryNumber: diaryNumberForCreate,
        caseNumber: queryParams.caseType !== 'Diary Number' ? `${queryParams.caseType}/${queryParams.diaryNumber}` : '',
        court: queryParams.court || '',
        case_type: queryParams.caseType,
        bench: queryParams.bench || '',
        judgmentUrl: { orders: [] }, // ⭐ Empty initially - cloud function will populate
        serialNumber: '',
        city: queryParams.city || '',
      }
    });

    console.log('✓ Placeholder case created:', newCase.id);

    // Subscribe user to the new case
    await prisma.subscribedCases.create({
      data: {
        userId: user.id,
        case_id: newCase.id
      }
    });

    console.log('✓ User subscribed to case');

    // Build payload WITH the case ID
    const payload = buildPayload(court!, queryParams, newCase.id);
    
    console.log('=== Payload for New Case (UPDATE with data) ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('⭐ ID included:', newCase.id);
    console.log('⭐ Cloud function should UPDATE this case with scraped data, NOT create new entry');

    // Trigger Cloud Function to populate the case details
    fetch(externalApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      console.log('✓ Cloud function called to populate case data');
    }).catch(err => {
      console.error('✗ Error calling cloud function:', err);
    });

    return new Response(JSON.stringify({ 
      message: "Triggered external Cloud Function." 
    }), { status: 201 });

  } catch (error) {
    console.error("=== Error in court case search ===");
    console.error(error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
});
 
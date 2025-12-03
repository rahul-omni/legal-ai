 import { PrismaClient } from '@prisma/client';
import { userFromSession } from "@/lib/auth";
import { auth } from '@/app/api/lib/auth/nextAuthConfig';
import { is } from 'date-fns/locale';

const prisma = new PrismaClient();

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

const getEndpoint = (court: string, district?: string) => {
  if (court === "High Court") {
    return "highCourtCasesUpsert";
  } else if (court === "Supreme Court") {
    return "supremeCourtOTF";
  } else if (court === "District Court") {
    // Check if it's East Delhi District Court
    if (district && EAST_DELHI_DISTRICTS.some(d => district.includes(d))) {
      return "fetchEastDelhiDistrictJudgments";
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
    };
  } else {
    // Supreme Court / High Court / NCLT payload
    return {
      id: caseId, // ⭐ This is critical - cloud function will UPDATE this case
      caseYear: queryParams.year,
      caseNumber: queryParams.diaryNumber,
      diary_number: queryParams.diaryNumber,
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
            case_type: queryParams.caseType
          }
        });
    } else if(queryParams.court == 'Supreme Court') {
      if (queryParams.caseType == 'Diary Number') {
        existingCase = await prisma.caseDetails.findFirst({
          where: {
            diaryNumber: `${queryParams.diaryNumber}/${queryParams.year}`,
          }
        });
      } else {

        existingCase = await prisma.caseDetails.findFirst({
          where: {
            caseNumber: {
              contains: `${queryParams.diaryNumber}`
            },
            case_type: {
              equals: queryParams.caseType,
              mode: 'insensitive'
            }
          }
        });
      }
    }

    console.log('Existing case found:', existingCase ? existingCase.id : 'No');

    const endpoint = getEndpoint(court!, queryParams.district);
    const externalApi = `${process.env.SERVICE_URL}${endpoint}`;

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
    const newCase = await prisma.caseDetails.create({
      data: {
        diaryNumber: queryParams.caseType === 'Diary Number' || queryParams.court == "High Court" || queryParams.court == "District Court" 
          ? `${queryParams.diaryNumber}/${queryParams.year}` 
          : '',
        caseNumber: queryParams.caseType !== 'Diary Number' ? `${queryParams.caseType}/${queryParams.diaryNumber}` : '',
        court: queryParams.court || '',
        case_type: queryParams.caseType,
        judgmentUrl: { orders: [] }, // ⭐ Empty initially - cloud function will populate
        serialNumber: '',
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
 
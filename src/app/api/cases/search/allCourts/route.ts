import { PrismaClient } from '@prisma/client';
import { userFromSession } from "@/lib/auth";
import { auth } from '@/app/api/lib/auth/nextAuthConfig';

const prisma = new PrismaClient();

const getEndpoint = (court : string) => {
  if (court === "High Court") {
    return "highCourtCasesUpsert";
  }else if(court === "Supreme Court"){
    return "supremeCourtOTF";
  }else if(court === "District Court"){
    return "districtCourtCasesUpsert";
  } else if(court === "Nclt Court"){
    return "ncltCourtCasesUpsert";
  }
}

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
      bench: searchParams.get('bench') ? decodeURIComponent(searchParams.get('bench')!) : undefined,
      courtComplex: searchParams.get('courtComplex') ? decodeURIComponent(searchParams.get('courtComplex')!) : undefined,
    };

    const existingCase = await prisma.caseDetails.findFirst({
      where: {
        diaryNumber: `${queryParams.diaryNumber}/${queryParams.year}`,
        case_type: queryParams.caseType
      }
    });

    const endpoint = getEndpoint(court!);

    const externalApi = `${process.env.SERVICE_URL}/${endpoint}`;

    if (existingCase) {
      const subscribedCase = await prisma.subscribedCases.create({
        data: {
          userId: user.id,
          case_id: existingCase.id,
        }
      });

      fetch(externalApi!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingCase.id,
          caseYear: queryParams.year,
          caseNumber: queryParams.diaryNumber, 
          diary_number: queryParams.diaryNumber,
          caseType: queryParams.caseType,
        })
      })
      return new Response(JSON.stringify({ subscribedCase, message: "Case exists." }), { status: 200 });
    }

    const newCase = await prisma.caseDetails.create({
      data: {
        diaryNumber: queryParams.caseType === 'Diary Number' ? `${queryParams.diaryNumber}/${queryParams.year}` : '',
        caseNumber: queryParams.caseType !== 'Diary Number' ? `${queryParams.caseType}/${queryParams.diaryNumber}` : '',
        court: queryParams.court || '',
        case_type: queryParams.caseType,
        judgmentUrl: { orders: [] },
        serialNumber: '',
      }
    });

    await prisma.subscribedCases.create({
      data: {
        userId: user.id,
        case_id: newCase.id
      }
    });

    fetch(externalApi!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newCase.id,
        caseYear: queryParams.year,
        caseNumber: queryParams.diaryNumber, 
        diary_number: queryParams.diaryNumber,
        caseType: queryParams.caseType,
      })
    })

    return new Response(JSON.stringify({ message: "Triggered external Cloud Function." }), { status: 201 });

  } catch (error) {
    console.error("Error in high court case search:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
});

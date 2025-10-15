import { db } from "@/app/api/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month"); // YYYY-MM
  const date = searchParams.get("date");   // YYYY-MM-DD

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    // 🔹 CASE 1: Return case list for a specific date
    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const causeList = await db.userCase.findMany({
        where: {
          userId,
          tentative_date: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        select: {
          id: true,
          diaryNumber: true,
          caseType: true,
          city: true,
          court: true,
          district: true,
          bench: true,
          courtComplex: true,
          courtType: true,
          case_number: true,
          tentative_date: true,
        },
      });


      return NextResponse.json({ causeList });
    }

    // 🔹 CASE 2: Return counts per day for a month
    if (!month) {
      return NextResponse.json({ error: "Missing month" }, { status: 400 });
    }

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    // Raw SQL query: count cases per day
    const countsRaw = await db.$queryRawUnsafe<{ case_date: string; case_count: bigint }[]>(`
      SELECT
        DATE("tentative_date") AS case_date,
        COUNT(*) AS case_count
      FROM "user_cases"
      WHERE "user_id"::uuid = '${userId}'
        AND "tentative_date" >= '${startDate.toISOString()}'
        AND "tentative_date" < '${endDate.toISOString()}'
      GROUP BY DATE("tentative_date")
      ORDER BY DATE("tentative_date");
    `);

    // Convert BigInt to number and format date as YYYY-MM-DD
    const counts = countsRaw.map(c => ({
      case_date: new Date(c.case_date).toISOString().slice(0, 10),
      case_count: Number(c.case_count),
    }));

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

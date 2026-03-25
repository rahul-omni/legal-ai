import { userFromSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth/nextAuthConfig";
import { ErrorAuth } from "@/app/api/lib/errors";

const prisma = new PrismaClient();

/**
 * GET /api/cases/user-cases/v2
 * Enhanced list + search: q (multi-field OR), year, court.
 * v1 GET /api/cases/user-cases remains parties-only for older app releases.
 */
export const GET = auth(async (request: NextAuthRequest) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const urlParams = request.nextUrl.searchParams;
    const qParam = (urlParams.get("q") ?? "").trim();
    const yearParam = (urlParams.get("year") ?? "").trim();
    const courtParam = (urlParams.get("court") ?? "").trim();

    const page = parseInt(urlParams.get("page") || "1", 10);
    const limit = parseInt(urlParams.get("limit") || "20", 10);
    const pageSize = Math.min(Math.max(limit, 1), 100);
    const currentPage = Math.max(page, 1);
    const skip = (currentPage - 1) * pageSize;

    const caseDetailsAnd: Record<string, unknown>[] = [];

    if (qParam.length > 0) {
      caseDetailsAnd.push({
        OR: [
          { diaryNumber: { contains: qParam, mode: "insensitive" } },
          { caseNumber: { contains: qParam, mode: "insensitive" } },
          { parties: { contains: qParam, mode: "insensitive" } },
          { bench: { contains: qParam, mode: "insensitive" } },
          { judgmentBy: { contains: qParam, mode: "insensitive" } },
        ],
      });
    }

    if (/^\d{4}$/.test(yearParam)) {
      caseDetailsAnd.push({
        OR: [
          { diaryNumber: { contains: `/${yearParam}`, mode: "insensitive" } },
          { judgmentDate: { contains: yearParam, mode: "insensitive" } },
        ],
      });
    }

    if (courtParam.length > 0) {
      caseDetailsAnd.push({
        court: { contains: courtParam, mode: "insensitive" },
      });
    }

    const whereClause: Record<string, unknown> = {
      userId: sessionUser.id,
      status: "ACTIVE",
      ...(caseDetailsAnd.length > 0
        ? { caseDetails: { AND: caseDetailsAnd } }
        : {}),
    };

    const totalCount = await prisma.subscribedCases.count({
      where: whereClause,
    });

    const userCases = await prisma.subscribedCases.findMany({
      where: whereClause,
      include: {
        caseDetails: {
          select: {
            id: true,
            parties: true,
            diaryNumber: true,
            createdAt: true,
            case_type: true,
            court: true,
            city: true,
            district: true,
            courtComplex: true,
            courtType: true,
            site_sync: true,
            caseNumber: true,
            bench: true,
            judgmentBy: true,
            judgmentDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    const transformedCases = userCases.map((item: any) => {
      const { caseDetails, ...rest } = item;
      return {
        ...rest,
        caseDetails: caseDetails
          ? {
              id: caseDetails.id,
              parties: caseDetails.parties,
              diaryNumber: caseDetails.diaryNumber,
              createdAt: caseDetails.createdAt,
              caseType: caseDetails.case_type,
              court: caseDetails.court,
              city: caseDetails.city,
              district: caseDetails.district,
              courtComplex: caseDetails.courtComplex,
              courtType: caseDetails.courtType,
              site_sync: caseDetails.site_sync,
              caseNumber: caseDetails.caseNumber,
              bench: caseDetails.bench,
              judgmentBy: caseDetails.judgmentBy,
              judgmentDate: caseDetails.judgmentDate,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      message:
        userCases.length === 0
          ? "No cases found for this user"
          : "Successfully retrieved diary numbers",
      data: transformedCases,
      pagination: {
        currentPage,
        pageSize,
        totalItems: totalCount,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/cases/user-cases/v2:", error);

    if (error instanceof ErrorAuth) {
      return NextResponse.json(
        { success: false, message: error.message || "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

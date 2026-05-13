import { db } from "@/app/api/lib/db";
import { ErrorAuth } from "@/app/api/lib/errors";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

type WorkspaceDetailsRow = {
  id: string;
  workspaceStatus: string;
  workspaceCreatedAt: Date;
  workspaceUpdatedAt: Date;
  subscribedCaseId: string;
  subscriptionStatus: string;
  subscriptionCreatedAt: Date;
  caseId: string;
  parties: string | null;
  diaryNumber: string | null;
  caseNumber: string | null;
  court: string;
  city: string | null;
  district: string | null;
  bench: string | null;
  caseType: string | null;
  caseStatus: string | null;
  tentativeDate: Date | null;
  siteSync: number | null;
  judgmentBy: string | null;
  judgmentDate: string | null;
  filingDate: string | null;
  filingNumber: string | null;
  lastListed: string | null;
  nextListingDate: string | null;
  registeredOn: string | null;
  petitionerAdvocate: string | null;
  respondentAdvocate: string | null;
  orderDetails: unknown;
  judgmentUrl: unknown;
  causeListNotifications: unknown;
};

export const GET = auth(async (request: NextAuthRequest, context?: any) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const params = context?.params ? await context.params : {};
    const workspaceId = params.id || request.nextUrl.pathname.split("/").pop();

    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Workspace ID is required" }, { status: 400 });
    }

    const rows = await db.$queryRaw<WorkspaceDetailsRow[]>`
      SELECT
        w."id",
        w."status" AS "workspaceStatus",
        w."created_at" AS "workspaceCreatedAt",
        w."updated_at" AS "workspaceUpdatedAt",
        sc."id" AS "subscribedCaseId",
        sc."status"::text AS "subscriptionStatus",
        sc."created_at" AS "subscriptionCreatedAt",
        cd."id" AS "caseId",
        cd."parties",
        cd."diary_number" AS "diaryNumber",
        cd."case_number" AS "caseNumber",
        cd."court",
        cd."city",
        cd."district",
        cd."bench",
        cd."case_type" AS "caseType",
        cd."case_status" AS "caseStatus",
        cd."tentative_date" AS "tentativeDate",
        cd."site_sync" AS "siteSync",
        cd."judgment_by" AS "judgmentBy",
        cd."judgment_date" AS "judgmentDate",
        cd."filing_date" AS "filingDate",
        cd."filing_number" AS "filingNumber",
        cd."last_listed" AS "lastListed",
        cd."next_listing_date" AS "nextListingDate",
        cd."registered_on" AS "registeredOn",
        cd."petitioner_advocate" AS "petitionerAdvocate",
        cd."respondent_advocate" AS "respondentAdvocate",
        to_jsonb(cd."order_details") AS "orderDetails",
        cd."judgment_url" AS "judgmentUrl",
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', n."id",
                'day', n."day",
                'message', n."message",
                'method', n."method",
                'status', n."status",
                'createdAt', n."created_at"
              )
              ORDER BY n."day" DESC NULLS LAST, n."created_at" DESC
            )
            FROM "notifications" n
            WHERE n."case_id" = cd."id"
              AND n."user_id" = ${sessionUser.id}::uuid
          ),
          '[]'::jsonb
        ) AS "causeListNotifications"
      FROM "workspaces" w
      INNER JOIN "subscribed_cases" sc ON sc."id" = w."subscribed_case_id"
      INNER JOIN "case_details" cd ON cd."id" = sc."case_id"
      WHERE w."id" = ${workspaceId}::uuid
        AND w."user_id" = ${sessionUser.id}::uuid
        AND sc."status" = 'ACTIVE'
      LIMIT 1;
    `;

    if (!rows[0]) {
      return NextResponse.json(
        { success: false, message: "Workspace not found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error in GET /api/workspace/[id]:", error);

    if (error instanceof ErrorAuth) {
      return NextResponse.json({ success: false, message: error.message || "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});

import { db } from "@/app/api/lib/db";
import { ErrorAuth } from "@/app/api/lib/errors";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { assertWorkspaceAccessAllowed } from "@/app/api/lib/subscriptionLimits";
import { userFromSession } from "@/lib/auth";
import { normalizePartiesDisplay } from "@/lib/parties";
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
  assignedTo: string[];
  clientId: string | null;
  projectFolderId: string | null;
  projectFolderName: string | null;
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

const WORKSPACE_STATUSES = new Set(["PENDING", "IN_PROGRESS", "DONE", "STALLED"]);

type WorkspaceFolderRow = {
  id: string;
  name: string;
};

function buildWorkspaceFolderName(row: Pick<WorkspaceDetailsRow, "id" | "parties" | "caseNumber" | "diaryNumber">) {
  const caseLabel = normalizePartiesDisplay(row.parties) || row.caseNumber || row.diaryNumber || `Workspace ${row.id.slice(0, 8)}`;
  return `Workspace - ${caseLabel}`.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").slice(0, 180);
}

async function ensureWorkspaceProjectFolder(row: WorkspaceDetailsRow, userId: string) {
  if (row.projectFolderId && row.projectFolderName) {
    return { id: row.projectFolderId, name: row.projectFolderName };
  }

  const folderName = buildWorkspaceFolderName(row);
  const folderRows = await db.$queryRaw<WorkspaceFolderRow[]>`
    INSERT INTO "file_system_nodes" (
      "name",
      "type",
      "content",
      "parent_id",
      "is_expanded",
      "user_id",
      "created_at",
      "updated_at"
    )
    VALUES (
      ${folderName},
      'FOLDER'::"FileType",
      NULL,
      NULL,
      false,
      ${userId}::uuid,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING "id", "name";
  `;

  const folder = folderRows[0];
  if (!folder) return null;

  await db.$executeRaw`
    UPDATE "workspaces"
    SET "project_folder_id" = ${folder.id}::uuid,
        "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = ${row.id}::uuid
      AND "user_id" = ${userId}::uuid;
  `;

  return folder;
}

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

    await assertWorkspaceAccessAllowed(sessionUser.id, workspaceId);

    const rows = await db.$queryRaw<WorkspaceDetailsRow[]>`
      SELECT
        w."id",
        w."status" AS "workspaceStatus",
        w."created_at" AS "workspaceCreatedAt",
        w."updated_at" AS "workspaceUpdatedAt",
        sc."id" AS "subscribedCaseId",
        sc."status"::text AS "subscriptionStatus",
        sc."created_at" AS "subscriptionCreatedAt",
        w."assigned_to" AS "assignedTo",
        w."client_id" AS "clientId",
        w."project_folder_id" AS "projectFolderId",
        fsn."name" AS "projectFolderName",
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
      LEFT JOIN "file_system_nodes" fsn ON fsn."id" = w."project_folder_id"
        AND fsn."user_id" = w."user_id"
        AND fsn."type" = 'FOLDER'::"FileType"
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

    const projectFolder = await ensureWorkspaceProjectFolder(rows[0], sessionUser.id);

    return NextResponse.json({
      success: true,
      data: {
        ...rows[0],
        projectFolderId: projectFolder?.id ?? rows[0].projectFolderId,
        projectFolderName: projectFolder?.name ?? rows[0].projectFolderName,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/workspace/[id]:", error);

    if (error instanceof ErrorAuth) {
      return NextResponse.json({ success: false, message: error.message || "Unauthorized" }, { status: 401 });
    }

    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;

    return NextResponse.json(
      {
        success: false,
        message: status === 500 ? "Internal server error" : error instanceof Error ? error.message : "Workspace is locked",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status }
    );
  }
});

export const PATCH = auth(async (request: NextAuthRequest, context?: any) => {
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

    await assertWorkspaceAccessAllowed(sessionUser.id, workspaceId);

    const body = await request.json();
    const status = typeof body.status === "string" ? body.status : "";

    if (!WORKSPACE_STATUSES.has(status)) {
      return NextResponse.json({ success: false, message: "Invalid workspace status" }, { status: 400 });
    }

    const rows = await db.$queryRaw<{ id: string; status: string }[]>`
      UPDATE "workspaces"
      SET "status" = ${status},
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${workspaceId}::uuid
        AND "user_id" = ${sessionUser.id}::uuid
      RETURNING "id", "status";
    `;

    if (!rows[0]) {
      return NextResponse.json({ success: false, message: "Workspace not found for this user" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error in PATCH /api/workspace/[id]:", error);

    if (error instanceof ErrorAuth) {
      return NextResponse.json({ success: false, message: error.message || "Unauthorized" }, { status: 401 });
    }

    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;

    return NextResponse.json(
      {
        success: false,
        message: status === 500 ? "Internal server error" : error instanceof Error ? error.message : "Workspace is locked",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status }
    );
  }
});

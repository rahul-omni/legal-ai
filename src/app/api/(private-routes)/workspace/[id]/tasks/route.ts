import { db } from "@/app/api/lib/db";
import { ErrorAuth } from "@/app/api/lib/errors";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { assertWorkspaceAccessAllowed } from "@/app/api/lib/subscriptionLimits";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

type WorkspaceTaskRow = {
  id: string;
  workspaceId: string;
  title: string;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
  assignedToUserId: string;
  assignedToName: string | null;
  assignedToEmail: string | null;
  assignedByUserId: string;
  assignedByName: string | null;
  assignedByEmail: string | null;
};

const TASK_STATUSES = new Set(["PENDING", "DONE", "OVERDUE", "STALLED"]);

async function getWorkspaceId(request: NextAuthRequest, context?: any) {
  const params = context?.params ? await context.params : {};
  return params.id || request.nextUrl.pathname.split("/").at(-2);
}

export const GET = auth(async (request: NextAuthRequest, context?: any) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(request, context);
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Workspace ID is required" }, { status: 400 });
    }

    await assertWorkspaceAccessAllowed(sessionUser.id, workspaceId);

    const tasks = await db.$queryRaw<WorkspaceTaskRow[]>`
      SELECT
        wt."id",
        wt."workspace_id" AS "workspaceId",
        wt."title",
        wt."status",
        wt."due_date" AS "dueDate",
        wt."created_at" AS "createdAt",
        wt."assigned_to_user_id" AS "assignedToUserId",
        assigned_to."name" AS "assignedToName",
        assigned_to."email" AS "assignedToEmail",
        wt."assigned_by_user_id" AS "assignedByUserId",
        assigned_by."name" AS "assignedByName",
        assigned_by."email" AS "assignedByEmail"
      FROM "workspace_tasks" wt
      INNER JOIN "workspaces" w ON w."id" = wt."workspace_id"
      INNER JOIN "users" assigned_to ON assigned_to."id" = wt."assigned_to_user_id"
      INNER JOIN "users" assigned_by ON assigned_by."id" = wt."assigned_by_user_id"
      WHERE wt."workspace_id" = ${workspaceId}::uuid
        AND w."user_id" = ${sessionUser.id}::uuid
      ORDER BY wt."created_at" DESC;
    `;

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error in GET /api/workspace/[id]/tasks:", error);

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

export const POST = auth(async (request: NextAuthRequest, context?: any) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(request, context);
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Workspace ID is required" }, { status: 400 });
    }

    await assertWorkspaceAccessAllowed(sessionUser.id, workspaceId);

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const dueDate = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : null;
    const status = typeof body.status === "string" && TASK_STATUSES.has(body.status) ? body.status : "PENDING";

    if (!title) {
      return NextResponse.json({ success: false, message: "Task title is required" }, { status: 400 });
    }

    const rows = await db.$queryRaw<WorkspaceTaskRow[]>`
      INSERT INTO "workspace_tasks" (
        "workspace_id",
        "title",
        "status",
        "due_date",
        "assigned_to_user_id",
        "assigned_by_user_id",
        "created_at",
        "updated_at"
      )
      SELECT
        w."id",
        ${title},
        ${status},
        ${dueDate}::timestamp,
        ${sessionUser.id}::uuid,
        ${sessionUser.id}::uuid,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "workspaces" w
      WHERE w."id" = ${workspaceId}::uuid
        AND w."user_id" = ${sessionUser.id}::uuid
      RETURNING
        "id",
        "workspace_id" AS "workspaceId",
        "title",
        "status",
        "due_date" AS "dueDate",
        "created_at" AS "createdAt",
        "assigned_to_user_id" AS "assignedToUserId",
        NULL::text AS "assignedToName",
        NULL::text AS "assignedToEmail",
        "assigned_by_user_id" AS "assignedByUserId",
        NULL::text AS "assignedByName",
        NULL::text AS "assignedByEmail";
    `;

    if (!rows[0]) {
      return NextResponse.json({ success: false, message: "Workspace not found for this user" }, { status: 404 });
    }

    const [task] = await db.$queryRaw<WorkspaceTaskRow[]>`
      SELECT
        wt."id",
        wt."workspace_id" AS "workspaceId",
        wt."title",
        wt."status",
        wt."due_date" AS "dueDate",
        wt."created_at" AS "createdAt",
        wt."assigned_to_user_id" AS "assignedToUserId",
        assigned_to."name" AS "assignedToName",
        assigned_to."email" AS "assignedToEmail",
        wt."assigned_by_user_id" AS "assignedByUserId",
        assigned_by."name" AS "assignedByName",
        assigned_by."email" AS "assignedByEmail"
      FROM "workspace_tasks" wt
      INNER JOIN "users" assigned_to ON assigned_to."id" = wt."assigned_to_user_id"
      INNER JOIN "users" assigned_by ON assigned_by."id" = wt."assigned_by_user_id"
      WHERE wt."id" = ${rows[0].id}::uuid
      LIMIT 1;
    `;

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/workspace/[id]/tasks:", error);

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

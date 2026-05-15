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

export const PATCH = auth(async (request: NextAuthRequest, context?: any) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const params = context?.params ? await context.params : {};
    const workspaceId = params.id || request.nextUrl.pathname.split("/").at(-3);
    const taskId = params.taskId || request.nextUrl.pathname.split("/").pop();

    if (!workspaceId || !taskId) {
      return NextResponse.json({ success: false, message: "Workspace ID and task ID are required" }, { status: 400 });
    }

    await assertWorkspaceAccessAllowed(sessionUser.id, workspaceId);

    const body = await request.json();
    const status = typeof body.status === "string" ? body.status : "";

    if (!TASK_STATUSES.has(status)) {
      return NextResponse.json({ success: false, message: "Invalid task status" }, { status: 400 });
    }

    const rows = await db.$queryRaw<WorkspaceTaskRow[]>`
      WITH updated_task AS (
        UPDATE "workspace_tasks" wt
        SET "status" = ${status},
            "updated_at" = CURRENT_TIMESTAMP
        FROM "workspaces" w
        WHERE wt."id" = ${taskId}::uuid
          AND wt."workspace_id" = ${workspaceId}::uuid
          AND wt."workspace_id" = w."id"
          AND w."user_id" = ${sessionUser.id}::uuid
        RETURNING wt.*
      )
      SELECT
        updated_task."id",
        updated_task."workspace_id" AS "workspaceId",
        updated_task."title",
        updated_task."status",
        updated_task."due_date" AS "dueDate",
        updated_task."created_at" AS "createdAt",
        updated_task."assigned_to_user_id" AS "assignedToUserId",
        assigned_to."name" AS "assignedToName",
        assigned_to."email" AS "assignedToEmail",
        updated_task."assigned_by_user_id" AS "assignedByUserId",
        assigned_by."name" AS "assignedByName",
        assigned_by."email" AS "assignedByEmail"
      FROM updated_task
      INNER JOIN "users" assigned_to ON assigned_to."id" = updated_task."assigned_to_user_id"
      INNER JOIN "users" assigned_by ON assigned_by."id" = updated_task."assigned_by_user_id"
      LIMIT 1;
    `;

    if (!rows[0]) {
      return NextResponse.json({ success: false, message: "Task not found for this workspace" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error in PATCH /api/workspace/[id]/tasks/[taskId]:", error);

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

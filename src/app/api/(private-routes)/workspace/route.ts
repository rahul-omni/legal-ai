import { db } from "@/app/api/lib/db";
import { ErrorAuth } from "@/app/api/lib/errors";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

type WorkspaceRow = {
  id: string;
  status: string;
  subscribedCaseId: string;
};

export const POST = auth(async (request: NextAuthRequest) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const subscribedCaseId = typeof body.subscribedCaseId === "string" ? body.subscribedCaseId : "";

    if (!subscribedCaseId) {
      return NextResponse.json({ success: false, message: "Subscribed case ID is required" }, { status: 400 });
    }

    const rows = await db.$queryRaw<WorkspaceRow[]>`
      INSERT INTO "workspaces" ("user_id", "subscribed_case_id", "status", "created_at", "updated_at")
      SELECT sc."user_id", sc."id", 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM "subscribed_cases" sc
      WHERE sc."id" = ${subscribedCaseId}::uuid
        AND sc."user_id" = ${sessionUser.id}::uuid
        AND sc."status" = 'ACTIVE'
      ON CONFLICT ("subscribed_case_id")
      DO UPDATE SET "updated_at" = CURRENT_TIMESTAMP
      RETURNING
        "id",
        "status",
        "subscribed_case_id" AS "subscribedCaseId";
    `;

    if (!rows[0]) {
      return NextResponse.json(
        { success: false, message: "Subscribed case not found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error in POST /api/workspace:", error);

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

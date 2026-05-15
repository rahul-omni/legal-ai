import { userFromSession } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth/nextAuthConfig";
import { ErrorAuth } from "@/app/api/lib/errors";

const prisma = new PrismaClient();

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type WorkspaceCleanupRow = {
  id: string;
  projectFolderId: string | null;
};

async function deleteWorkspaceProjectFolder(tx: TransactionClient, rootId: string, userId: string) {
  const nodes = await tx.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE descendants AS (
      SELECT "id", "parent_id", 0 AS depth
      FROM "file_system_nodes"
      WHERE "id" = ${rootId}::uuid
        AND "user_id" = ${userId}::uuid
      UNION ALL
      SELECT child."id", child."parent_id", descendants.depth + 1
      FROM "file_system_nodes" child
      INNER JOIN descendants ON child."parent_id" = descendants."id"
      WHERE child."user_id" = ${userId}::uuid
    )
    SELECT "id"
    FROM descendants
    ORDER BY depth DESC;
  `;

  const nodeIds = nodes.map((node) => node.id);
  if (!nodeIds.length) return;

  await tx.$executeRaw`
    DELETE FROM "review_comments" comments
    USING "file_reviews" reviews
    WHERE comments."review_id" = reviews."id"
      AND reviews."file_id" = ANY(${nodeIds}::uuid[]);
  `;
  await tx.$executeRaw`
    DELETE FROM "file_reviews"
    WHERE "file_id" = ANY(${nodeIds}::uuid[]);
  `;
  await tx.$executeRaw`
    DELETE FROM "chat_conversation_documents"
    WHERE "node_id" = ANY(${nodeIds}::uuid[]);
  `;
  await tx.$executeRaw`
    DELETE FROM "chat_message_documents"
    WHERE "node_id" = ANY(${nodeIds}::uuid[]);
  `;
  await tx.$executeRaw`
    DELETE FROM "file_system_nodes"
    WHERE "id" = ANY(${nodeIds}::uuid[]);
  `;
}

export const DELETE = auth(async (request: NextAuthRequest, context?: any) => {
  try {
    // Authentication
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get subscription ID from route params
    const params = context?.params ? await context.params : {};
    const subscriptionId = params.subscriptionId || request.nextUrl.pathname.split('/').pop();

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, message: "Subscription ID is required" },
        { status: 400 }
      );
    }

    // Verify the subscription exists and belongs to the user
    const subscription = await prisma.subscribedCases.findFirst({
      where: {
        id: subscriptionId,
        userId: sessionUser.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: "Subscription not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Check if already deleted
    if ((subscription as any).status === 'DELETED') {
      return NextResponse.json(
        { success: false, message: "Subscription is already deleted" },
        { status: 400 }
      );
    }

    const deletedSubscription = await prisma.$transaction(async (tx) => {
      const workspaceRows = await tx.$queryRaw<WorkspaceCleanupRow[]>`
        SELECT
          "id",
          "project_folder_id" AS "projectFolderId"
        FROM "workspaces"
        WHERE "subscribed_case_id" = ${subscriptionId}::uuid
          AND "user_id" = ${sessionUser.id}::uuid
        LIMIT 1;
      `;
      const workspace = workspaceRows[0];

      if (workspace) {
        await tx.$executeRaw`
          DELETE FROM "chat_conversations"
          WHERE "workspace_id" = ${workspace.id}::uuid
            AND "user_id" = ${sessionUser.id}::uuid;
        `;
        await tx.$executeRaw`
          DELETE FROM "workspace_tasks"
          WHERE "workspace_id" = ${workspace.id}::uuid;
        `;

        if (workspace.projectFolderId) {
          await tx.$executeRaw`
            UPDATE "workspaces"
            SET "project_folder_id" = NULL
            WHERE "id" = ${workspace.id}::uuid
              AND "user_id" = ${sessionUser.id}::uuid;
          `;
          await deleteWorkspaceProjectFolder(tx, workspace.projectFolderId, sessionUser.id);
        }

        await tx.$executeRaw`
          DELETE FROM "workspaces"
          WHERE "id" = ${workspace.id}::uuid
            AND "user_id" = ${sessionUser.id}::uuid;
        `;
      }

      // Soft delete: Update status to DELETED.
      // Note: Type assertion needed until TypeScript server picks up regenerated Prisma types.
      return (tx.subscribedCases.update as any)({
        where: {
          id: subscriptionId,
        },
        data: {
          status: 'DELETED',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Subscription deleted successfully",
      data: {
        subscriptionId: deletedSubscription.id,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error in DELETE /api/cases/user-cases/[subscriptionId]:", error);
    
    // Handle auth errors (401)
    if (error instanceof ErrorAuth) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message || "Unauthorized"
        },
        { status: 401 }
      );
    }
    
    // Handle other errors (500)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

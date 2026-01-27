import { userFromSession } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth/nextAuthConfig";
import { ErrorAuth } from "@/app/api/lib/errors";

const prisma = new PrismaClient();

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

    // Soft delete: Update status to DELETED
    // Note: Type assertion needed until TypeScript server picks up regenerated Prisma types
    // The runtime will work correctly as the database column exists
    const deletedSubscription = await (prisma.subscribedCases.update as any)({
      where: {
        id: subscriptionId,
      },
      data: {
        status: 'DELETED',
      },
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

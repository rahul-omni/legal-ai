import { NextRequest, NextResponse } from "next/server";
import { NextAuthRequest } from "next-auth";
import { ErrorResponse, handleError } from "../../lib/errors";
import { userSubscriptionService } from "../../services/userSubscriptionService";
import { userFromSession } from "@/lib/auth";
import { auth } from "../../lib/auth/nextAuthConfig";

/**
 * GET /api/user-subscriptions - Get current user's subscription
 * Returns the active subscription if exists, or null
 */
async function getUserSubscriptionController(
  request: NextAuthRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    // Get authenticated user
    const sessionUser = await userFromSession(request);
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true"; // Get all subscriptions or just active

    if (all) {
      // Get all user subscriptions
      const subscriptions = await userSubscriptionService.getSubscriptionsByUserId(
        sessionUser.id
      );
      return NextResponse.json(
        {
          success: true,
          subscriptions,
          count: subscriptions.length,
        },
        { status: 200 }
      );
    } else {
      // Get only active subscription
      const subscription = await userSubscriptionService.getActiveSubscription(
        sessionUser.id
      );
      return NextResponse.json(
        {
          success: true,
          subscription,
          hasActiveSubscription: subscription !== null,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error in GET /api/user-subscriptions:", error);
    return handleError(error);
  }
}

/**
 * POST /api/user-subscriptions/check - Check if user has active subscription
 * Returns boolean indicating if user has active subscription
 */
async function checkActiveSubscriptionController(
  request: NextAuthRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    // Get authenticated user
    const sessionUser = await userFromSession(request);
    const hasActive = await userSubscriptionService.hasActiveSubscription(
      sessionUser.id
    );
    return NextResponse.json(
      {
        success: true,
        hasActiveSubscription: hasActive,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/user-subscriptions/check:", error);
    return handleError(error);
  }
}

// Export with auth middleware
export const GET = auth(getUserSubscriptionController);
export const POST = auth(checkActiveSubscriptionController);



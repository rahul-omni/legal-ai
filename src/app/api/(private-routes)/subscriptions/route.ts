import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse, handleError } from "../../lib/errors";
import { subscriptionPlanService } from "../../services/subscriptionPlanService";
import { z } from "zod";

// Validation schema for creating a plan
const createPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  discountedPrice: z.number().min(0, "Discounted price must be positive"),
  discounted: z.number().min(0, "Discount amount must be positive"),
  price: z.number().min(0, "Price must be positive"),
  duration: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/subscriptions - Get all subscription plans
 * Query params: ?active=true (default: true) - only get active plans
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

    const plans = activeOnly
      ? await subscriptionPlanService.getActivePlans()
      : await subscriptionPlanService.getAllPlans();

    return NextResponse.json(
      {
        success: true,
        plans,
        count: plans.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/subscriptions:", error);
    return handleError(error);
  }
}

/**
 * POST /api/subscriptions - Create a new subscription plan
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    const body = await request.json();

    // Validate request body
    const validation = createPlanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 422 }
      );
    }

    // Create plan
    const plan = await subscriptionPlanService.createPlan(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Subscription plan created successfully",
        plan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/subscriptions:", error);
    return handleError(error);
  }
}


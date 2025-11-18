import { NextRequest, NextResponse } from "next/server";
import { NextAuthRequest } from "next-auth";
import { ErrorResponse, handleError, ErrorValidation, ErrorApp } from "../../lib/errors";
import { paymentService } from "../../services/paymentService";
import { userFromSession } from "@/lib/auth";
import { auth } from "../../lib/auth/nextAuthConfig";
import { z } from "zod";

// Validation schemas
const createPaymentSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  subscriptionPlanId: z.string().uuid().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  status: z.enum(["SUCCESS", "FAILED"]),
  request: z.any().optional(),
  response: z.any().optional(),
});

/**
 * POST /api/payments - Create a new payment record
 */
async function createPaymentController(
  request: NextAuthRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    // Get authenticated user
    const sessionUser = await userFromSession(request);
    const body = await request.json();

    // Validate request body
    const validation = createPaymentSchema.safeParse(body);
    if (!validation.success) {
      throw new ErrorValidation(validation.error.errors);
    }

    // Create payment with userId
    const payment = await paymentService.createPayment({
      ...validation.data,
      userId: sessionUser.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment record created successfully",
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/payments:", error);
    return handleError(error);
  }
}

/**
 * GET /api/payments - Get payments with optional filters
 * Query params: ?leadId=xxx&status=xxx&razorpayPaymentId=xxx&id=xxx&userId=xxx
 */
async function getPaymentsController(
  request: NextAuthRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    // Get authenticated user
    const sessionUser = await userFromSession(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const leadId = searchParams.get("leadId");
    const status = searchParams.get("status");
    const razorpayPaymentId = searchParams.get("razorpayPaymentId");
    const userId = searchParams.get("userId");

    // Get by ID
    if (id) {
      const payment = await paymentService.getPaymentById(id);
      if (!payment) {
        throw new ErrorApp("Payment not found", 404);
      }
      // Verify user owns this payment
      if (payment.userId && payment.userId !== sessionUser.id) {
        throw new ErrorApp("Unauthorized access", 403);
      }
      return NextResponse.json({ payment }, { status: 200 });
    }

    // Get by Razorpay payment ID
    if (razorpayPaymentId) {
      const payment = await paymentService.getPaymentByRazorpayPaymentId(razorpayPaymentId);
      if (!payment) {
        throw new ErrorApp("Payment not found", 404);
      }
      // Verify user owns this payment
      if (payment.userId && payment.userId !== sessionUser.id) {
        throw new ErrorApp("Unauthorized access", 403);
      }
      return NextResponse.json({ payment }, { status: 200 });
    }

    // Get by userId (default to current user if not specified)
    const targetUserId = userId || sessionUser.id;
    if (targetUserId) {
      const payments = await paymentService.getPaymentsByUserId(targetUserId);
      return NextResponse.json({ payments }, { status: 200 });
    }

    // Get by lead ID
    if (leadId) {
      const payments = await paymentService.getPaymentsByLeadId(leadId);
      return NextResponse.json({ payments }, { status: 200 });
    }

    // Get by status
    if (status) {
      if (!["SUCCESS", "FAILED"].includes(status)) {
        throw new ErrorValidation("Invalid status value. Must be SUCCESS or FAILED");
      }
      const payments = await paymentService.getPaymentsByStatus(status as any);
      return NextResponse.json({ payments }, { status: 200 });
    }

    // Default: Get current user's payments
    const payments = await paymentService.getPaymentsByUserId(sessionUser.id);
    return NextResponse.json({ payments }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/payments:", error);
    return handleError(error);
  }
}

/**
 * PUT /api/payments - Update a payment
 * Body: { id: string, ...updateData }
 */
async function updatePaymentController(
  request: NextAuthRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    // Get authenticated user
    const sessionUser = await userFromSession(request);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      throw new ErrorApp("Payment ID is required", 400);
    }

    // Verify user owns this payment
    const existingPayment = await paymentService.getPaymentById(id);
    if (!existingPayment) {
      throw new ErrorApp("Payment not found", 404);
    }
    if (existingPayment.userId && existingPayment.userId !== sessionUser.id) {
      throw new ErrorApp("Unauthorized access", 403);
    }

    // Validate update data
    const updateSchema = createPaymentSchema.partial();
    const validation = updateSchema.safeParse(updateData);
    if (!validation.success) {
      throw new ErrorValidation(validation.error.errors);
    }

    // Update payment
    const payment = await paymentService.updatePayment(id, validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Payment updated successfully",
        payment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/payments:", error);
    return handleError(error);
  }
}

// Export with auth middleware
export const POST = auth(createPaymentController);
export const GET = auth(getPaymentsController);
export const PUT = auth(updatePaymentController);


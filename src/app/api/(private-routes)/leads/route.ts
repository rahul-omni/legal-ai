import { NextRequest, NextResponse } from "next/server";
import { NextAuthRequest } from "next-auth";
import { ErrorResponse, handleError, ErrorValidation, ErrorApp } from "../../lib/errors";
import { leadService } from "../../services/leadService";
import { userFromSession } from "@/lib/auth";
import { auth } from "../../lib/auth/nextAuthConfig";
import { z } from "zod";

// Validation schemas
const createLeadSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  subscriptionPlanId: z.string().uuid().optional(),
  bookingId: z.string().optional(),
  eventDetails: z.any().optional(),
});

const updateLeadSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
  subscriptionPlanId: z.string().uuid().optional(),
  bookingId: z.string().optional(),
  eventDetails: z.any().optional(),
});

/**
 * POST /api/leads - Create a new lead
 */
async function createLeadController(
  request: NextAuthRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    // Get authenticated user
    const sessionUser = await userFromSession(request);
    const body = await request.json();

    // Validate request body
    const validation = createLeadSchema.safeParse(body);
    if (!validation.success) {
      throw new ErrorValidation(validation.error.errors);
    }

    // Create lead with userId
    const lead = await leadService.createLead({
      ...validation.data,
      userId: sessionUser.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        lead,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/leads:", error);
    return handleError(error);
  }
}

/**
 * GET /api/leads - Get leads with optional filters
 * Query params: ?email=xxx&status=xxx&bookingId=xxx&userId=xxx
 */
async function getLeadsController(
  request: NextAuthRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    // Get authenticated user
    const sessionUser = await userFromSession(request);
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const status = searchParams.get("status");
    const bookingId = searchParams.get("bookingId");
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    // Get by ID
    if (id) {
      const lead = await leadService.getLeadById(id);
      if (!lead) {
        throw new ErrorApp("Lead not found", 404);
      }
      // Verify user owns this lead (unless admin)
      if (lead.userId && lead.userId !== sessionUser.id) {
        throw new ErrorApp("Unauthorized access", 403);
      }
      return NextResponse.json({ lead }, { status: 200 });
    }

    // Get by booking ID
    if (bookingId) {
      const lead = await leadService.getLeadByBookingId(bookingId);
      if (!lead) {
        throw new ErrorApp("Lead not found", 404);
      }
      // Verify user owns this lead
      if (lead.userId && lead.userId !== sessionUser.id) {
        throw new ErrorApp("Unauthorized access", 403);
      }
      return NextResponse.json({ lead }, { status: 200 });
    }

    // Get by userId (default to current user if not specified)
    const targetUserId = userId || sessionUser.id;
    if (targetUserId) {
      const leads = await leadService.getLeadsByUserId(targetUserId);
      return NextResponse.json({ leads }, { status: 200 });
    }

    // Get by email
    if (email) {
      const leads = await leadService.getLeadsByEmail(email);
      return NextResponse.json({ leads }, { status: 200 });
    }

    // Get by status
    if (status) {
      if (!["PENDING", "CONFIRMED", "SCHEDULED", "CANCELLED", "COMPLETED"].includes(status)) {
        throw new ErrorValidation("Invalid status value");
      }
      const leads = await leadService.getLeadsByStatus(status as any);
      return NextResponse.json({ leads }, { status: 200 });
    }

    // Default: Get current user's leads
    const leads = await leadService.getLeadsByUserId(sessionUser.id);
    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/leads:", error);
    return handleError(error);
  }
}

/**
 * PUT /api/leads - Update a lead
 * Body: { id: string, ...updateData }
 */
async function updateLeadController(
  request: NextAuthRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    // Get authenticated user
    const sessionUser = await userFromSession(request);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      throw new ErrorApp("Lead ID is required", 400);
    }

    // Verify user owns this lead
    const existingLead = await leadService.getLeadById(id);
    if (!existingLead) {
      throw new ErrorApp("Lead not found", 404);
    }
    if (existingLead.userId && existingLead.userId !== sessionUser.id) {
      throw new ErrorApp("Unauthorized access", 403);
    }

    // Validate update data
    const validation = updateLeadSchema.safeParse(updateData);
    if (!validation.success) {
      throw new ErrorValidation(validation.error.errors);
    }

    // Update lead
    const lead = await leadService.updateLead(id, validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Lead updated successfully",
        lead,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/leads:", error);
    return handleError(error);
  }
}

// Export with auth middleware
export const POST = auth(createLeadController);
export const GET = auth(getLeadsController);
export const PUT = auth(updateLeadController);


import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../[...nextauth]/route";
import { db } from "../../lib/db";
import { ErrorValidation, handleError } from "../../lib/errors";
import { reviewService } from "../../services/fileReviewServices";

const createReviewSchema = z.object({
  fileId: z.string().uuid(),
  requesterId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  orgId: z.string().uuid(),
  dueDate: z.string().datetime().optional(),
});

export const GET = auth(async (request: NextAuthRequest) => {
  try {
    const sessionUser = await userFromSession(request);

    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized - No user session" },
        { status: 401 }
      );
    }

    const reviews = await reviewService.getFullReviews(sessionUser.id);

    return NextResponse.json(reviews);
  } catch (error) {
    return handleError(error);
  }
});

export const POST = auth(async (request: NextAuthRequest) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser) throw new Error("Unauthorized");

    const body = await request.json();

    // Validate input (expects reviewerEmail)
    const { data, error } = await createReviewSchema.safeParseAsync({
      ...body,
      requesterId: sessionUser.id, // Ensure this matches
    });

    if (error) {
      console.error("Validation failed:", error.errors);
      console.error("Request body:", body);
      throw new ErrorValidation(error.flatten());
    }

    // Verify relationships
    await verifyRelationships({
      fileId: data.fileId,
      reviewerId: data.reviewerId,
      organizationId: data.orgId,
    });

    // Call service with transformed data
    const review = await reviewService.createReview({
      fileId: data.fileId,
      reviewerId: data.reviewerId,
      requesterId: sessionUser.id,
      orgId: data.orgId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});

async function verifyRelationships(ids: {
  fileId: string;
  reviewerId: string;
  reviewerEmail?: string;
  organizationId?: string | null;
}) {
  // 1. Verify file exists
  const file = await db.fileSystemNode.findUnique({
    where: { id: ids.fileId },
  });
  if (!file) throw new Error("File not found");

  // 2. Verify reviewer (either by ID or email)
  let reviewer = await db.user.findUnique({
    where: { id: ids.reviewerId },
  });

  if (!reviewer && ids.reviewerEmail) {
    reviewer = await db.user.findUnique({
      where: { email: ids.reviewerEmail },
    });
  }

  // 3. Check organization if provided
  if (ids.organizationId) {
    const org = await db.organization.findUnique({
      where: { id: ids.organizationId },
    });
    if (!org) throw new Error("Organization not found");
  }

  return { file, reviewer };
}

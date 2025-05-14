import { userFromSession } from "@/lib/auth";
import { FileReviewStatus } from "@prisma/client";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../[...nextauth]/route";
import { handleError } from "../../lib/errors";
import { reviewService } from "../../services/fileReviewServices";
import { db } from "../../lib/db";

 
const createReviewSchema = z.object({
  fileId: z.string().uuid(),
  requesterId: z.string().uuid(),
  reviewerEmail: z.string().email(), // Only email required
  orgId: z.string().uuid(),
  dueDate: z.string().datetime().optional()
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
    
    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: "No reviews found" }, 
        { status: 404 }
      );
    }
   // console.log("Fetched reviews route:", reviews); 
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error in GET /api/file-reviews:", error);
    return handleError(error);
  }
});
 

 export const POST = auth(async (request: NextAuthRequest) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser) throw new Error("Unauthorized");

    const body = await request.json();
    console.log("Raw request body:", body);

    // Validate input (expects reviewerEmail)
    const parsedInput = await createReviewSchema.safeParseAsync({
      ...body,
      requesterId: sessionUser.id // Ensure this matches
    });
    
    if (!parsedInput.success) {
      return NextResponse.json(
        { error: parsedInput.error.flatten() },
        { status: 400 }
      );
    }

    // Resolve email to ID
    console.log("Looking up reviewer by email:", parsedInput.data.reviewerEmail);
    const reviewer = await db.user.findUnique({
      where: { email: parsedInput.data.reviewerEmail },
      select: { id: true }
    });
    
    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer not found" },
        { status: 404 }
      );
    }
    console.log("Resolved reviewer ID:", reviewer.id);

    // Verify relationships
    await verifyRelationships({
      fileId: parsedInput.data.fileId,
      reviewerId: reviewer.id,
      organizationId: parsedInput.data.orgId
    });

    // Call service with transformed data
    const review = await reviewService.createReview({
      fileId: parsedInput.data.fileId,
      reviewerId: reviewer.id, // The resolved ID
      requesterId: sessionUser.id,
      orgId: parsedInput.data.orgId,
      dueDate: parsedInput.data.dueDate ? new Date(parsedInput.data.dueDate) : undefined
    });

    return NextResponse.json(review, { status: 201 });

  } catch (error) {
    console.error("Error in POST /file-reviews:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 500 }
    );
  }
});

async function verifyRelationships(ids: {
  fileId: string;
  reviewerId: string;
  reviewerEmail?: string;
  organizationId?: string | null;
}) {
  console.log('=== STARTING VERIFICATION ===');
  
  // 1. Verify file exists
  const file = await db.fileSystemNode.findUnique({ 
    where: { id: ids.fileId } 
  });
  if (!file) throw new Error("File not found");

  // 2. Verify reviewer (either by ID or email)
  let reviewer = await db.user.findUnique({ 
    where: { id: ids.reviewerId } 
  });

  if (!reviewer && ids.reviewerEmail) {
    reviewer = await db.user.findUnique({
      where: { email: ids.reviewerEmail }
    });
  }

  // 3. Check organization if provided
  if (ids.organizationId) {
    const org = await db.organization.findUnique({ 
      where: { id: ids.organizationId } 
    });
    if (!org) throw new Error("Organization not found");
  }

  console.log('=== VERIFICATION COMPLETE ===');
  return { file, reviewer };
}
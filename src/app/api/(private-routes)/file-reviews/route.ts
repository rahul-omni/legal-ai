import { userFromSession } from "@/lib/auth";
import { FileReviewStatus } from "@prisma/client";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../[...nextauth]/route";
import { handleError } from "../../lib/errors";
import { reviewService } from "../../lib/services/fileReviewServices";

const createReviewSchema = z.object({
  fileId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  orgId: z.string().uuid(),
  dueDate: z.string().datetime().optional(),
});

export const GET = auth(async (request: NextAuthRequest) => {
  try {
    const sessionUser = await userFromSession(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as FileReviewStatus | null;

    const reviews = await reviewService.getReviewsForUser(sessionUser.id, {
      status: status || undefined,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return handleError(error);
  }
});

export const POST = auth(async (request: NextAuthRequest) => {
  try {
    const sessionUser = await userFromSession(request);
    const body = await request.json();

    const parsedInput = await createReviewSchema.parseAsync(body);

    const review = await reviewService.createReview({
      ...parsedInput,
      requesterId: sessionUser.id,
      dueDate: parsedInput.dueDate ? new Date(parsedInput.dueDate) : undefined,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});

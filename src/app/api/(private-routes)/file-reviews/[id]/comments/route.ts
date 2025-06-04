import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { ErrorApp, handleError } from "@/app/api/lib/errors";
import { reviewService } from "@/app/api/services/fileReviewServices";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const addCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export const POST = auth(async (request: NextAuthRequest, context) => {
  const { id: reviewId } = await context.params;

  try {
    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }
    const sessionUser = await userFromSession(request);
    const body = await request.json();

    const { content } = await addCommentSchema.parseAsync(body);

    const comment = await reviewService.addComment({
      reviewId,
      userId: sessionUser.id,
      content,
    });
    if (!comment) {
      throw new ErrorApp("Failed to add comment", 500);
    }
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});

import { auth } from "@/app/api/[...nextauth]/route";
import { handleError } from "@/app/api/lib/errors";
import { reviewService } from "@/app/api/lib/services/fileReviewServices";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const addCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export const POST = auth(async (request: NextAuthRequest, context) => {
  const { params } = context;
  const { id } = params as unknown as { id: string };
  try {
    const sessionUser = await userFromSession(request);
    const body = await request.json();

    const { content } = await addCommentSchema.parseAsync(body);

    const comment = await reviewService.addComment({
      reviewId: id,
      userId: sessionUser.id,
      content,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});

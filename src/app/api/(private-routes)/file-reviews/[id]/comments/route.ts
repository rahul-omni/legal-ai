import { auth } from "@/app/api/[...nextauth]/route";
import { handleError } from "@/app/api/lib/errors";
import { reviewService } from "@/app/api/services/fileReviewServices";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const addCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export const POST = auth(async (request: NextAuthRequest, context) => {
  // const { params } = context;
  // console.log("params", params);
  // const { id } = params as unknown as { id: string };

  
  try {

    // Ensure async context before accessing params
    await Promise.resolve();
    
    // Now safely access params
    const params = await context.params;
    const reviewId = params?.id;
    
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
      return NextResponse.json(
        { error: "Failed to add comment" },
        { status: 500 }
      );
    }

    console.log("comment");
    
    
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});

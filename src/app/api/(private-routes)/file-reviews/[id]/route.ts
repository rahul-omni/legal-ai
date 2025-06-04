import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { handleError } from "@/app/api/lib/errors";
import { reviewService } from "@/app/api/services/fileReviewServices";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

export const GET = auth(async (request: NextAuthRequest, context) => {
  const { id } = await context.params;

  try {
    const sessionUser = await userFromSession(request);
    const review = await reviewService.getReviewById(id, sessionUser.id);
    return NextResponse.json(review);
  } catch (error) {
    return handleError(error);
  }
});

import { auth } from "@/app/api/[...nextauth]/route";
import { handleError } from "@/app/api/lib/errors";
import { reviewService } from "@/app/api/services/fileReviewServices";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

export const PUT = auth(async (request: NextAuthRequest, context) => {
  const { params } = context;
  const { id } = params as unknown as { id: string };

  try {
    const sessionUser = await userFromSession(request);

    const comment = await reviewService.resolveComment(id, sessionUser.id);

    return NextResponse.json(comment);
  } catch (error) {
    return handleError(error);
  }
});

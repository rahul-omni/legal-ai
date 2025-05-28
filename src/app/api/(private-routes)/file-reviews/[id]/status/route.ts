import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { handleError } from "@/app/api/lib/errors";
import { reviewService } from "@/app/api/services/fileReviewServices";
import { userFromSession } from "@/lib/auth";
import { FileReviewStatus } from "@prisma/client";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.nativeEnum(FileReviewStatus),
});

export const PUT = auth(async (request: NextAuthRequest, context) => {
  const { params } = context;
  const { id } = (await params) as unknown as { id: string };

  try {
    const sessionUser = await userFromSession(request);
    const body = await request.json();

    const { status } = await updateStatusSchema.parseAsync(body);

    const updatedReview = await reviewService.updateReviewStatus(
      id,
      sessionUser.id,
      status
    );
     
    if (!updatedReview) {
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 }
      );
    }

    console.log("Updated review:", );
    return NextResponse.json(updatedReview);
  } catch (error) {
    return handleError(error);
  }
});

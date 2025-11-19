import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { handleError } from "../../lib/errors";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET = auth(async (request: NextAuthRequest) => {
  try {
    const sessionUser = await userFromSession(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Id is required" },
        { status: 400 }
      );
    }
    const userCase = await prisma.caseDetails.findUnique({
      where: {
        id: id
      }
    });
    return NextResponse.json(userCase);
  } catch (error) {
    return handleError(error);
  }
});
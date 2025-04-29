import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? undefined;

  const invite = await db.invitation.findUnique({
    where: { token, expiresAt: { gt: new Date() } },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Invalid or expired invitation" },
      { status: 400 }
    );
  }

  const currentUser = await db.user.findUnique({
    where: { email: invite.email },
  });

  let createdUser = null;

  if (!currentUser) {
    createdUser = await db.user.create({
      data: {
        email: invite.email,
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
      select: { id: true },
    });
  }

  await db.orgMembership.create({
    data: {
      userId: currentUser?.id ?? createdUser?.id ?? "",
      orgId: invite.orgId,
      roleId: invite.roleId,
    },
  });

  // Update invite status
  await db.invitation.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  return NextResponse.redirect("/dashboard");
}
